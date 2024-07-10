const express = require("express");
const router = express.Router();
const { sequelize } = require("../models"); // Import sequelize instance
const {
  verifyCreatePermission,
  verifyDoingPermission,
  verifyDonePermission,
  verifyOpenPermission,
  verifyToDoListPermission,
} = require("../middleware/groupAuthMiddleware");
const { broadcast } = require("../middleware/websocket");
const nodemailer = require('nodemailer');

// Create a transporter object
const transporter = nodemailer.createTransport({
  service: 'outlook',  
  auth: {
    user: process.env.EMAIL_USER,  
    pass: process.env.EMAIL_PASSWORD,   
  },
});

const sendTaskDoneNotification = async (emails, task) => {
  console.log('Sending emails:', emails)
  console.log('task owner:' , task.Task_owner)
  const mailOptions = {
    from: process.env.EMAIL_USER,  
    to: emails.join(','),  // Join the array of emails into a comma-separated string
    subject: `Task Completed: ${task.Task_name}`,
    text: `The task "${task.Task_name}" has been completed by ${task.Task_owner} and is awaiting your review.`,
    html: `<p>The task "<strong>${task.Task_name}</strong>" has been completed by ${task.Task_owner} and is awaiting your review.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Emails sent successfully');
  } catch (error) {
    console.error('Error sending emails:', error);
  }
};

router.post("/create", verifyCreatePermission, async (req, res) => {
  const {
    Task_app_Acronym,
    Task_name,
    Task_description,
    Task_plan,
    Task_notes,
  } = req.body;

  if (!Task_name) {
    return res.status(400).json({ error: 'Task name is required and cannot be null' });
  }

  const transaction = await sequelize.transaction();

  try {
    const [application] = await sequelize.query(
      `SELECT * FROM Applications WHERE App_Acronym = :app_acronym FOR UPDATE`,
      {
        replacements: { app_acronym: Task_app_Acronym },
        type: sequelize.QueryTypes.SELECT,
        transaction,
      }
    );

    if (!application) {
      await transaction.rollback();
      return res.status(404).json({ error: "Application not found" });
    }

    const newRnumber = application.App_Rnumber + 1;
    const taskId = `${Task_app_Acronym}_${newRnumber}`;

    await sequelize.query(
      `INSERT INTO Tasks 
        (Task_id, Task_name, Task_description, Task_app_Acronym, Task_plan, Task_notes, Task_state, Task_creator, Task_owner, Task_createDate) 
      VALUES 
        (:taskId, :task_name, :task_description, :task_app_acronym, :task_plan, :task_notes, 'open', :task_creator, :task_owner, :task_createDate)`,
      {
        replacements: {
          taskId,
          task_name: Task_name,
          task_description: Task_description || '',
          task_app_acronym: Task_app_Acronym,
          task_plan: Task_plan,
          task_notes: Task_notes,
          task_creator: req.username,
          task_owner: req.username,
          task_createDate: new Date(),
        },
        transaction,
      }
    );

    await sequelize.query(
      `UPDATE Applications SET App_Rnumber = :newRnumber WHERE App_Acronym = :app_acronym`,
      {
        replacements: { newRnumber, app_acronym: Task_app_Acronym },
        transaction,
      }
    );

    await transaction.commit();

    // Notify clients of the new task
    broadcast({ type: 'TASK_CREATED', task: { Task_id: taskId, Task_name, Task_description, Task_app_Acronym, Task_plan, Task_notes, Task_state: 'open', Task_creator: req.username, Task_owner: req.username, Task_createDate: new Date() } });

    res.status(201).json({
      Task_id: taskId,
      Task_name,
      Task_description,
      Task_app_Acronym,
      Task_plan,
      Task_notes,
      Task_state: 'open',
      Task_creator: req.username,
      Task_owner: req.username,
      Task_createDate: new Date(),
    });
  } catch (error) {
    if (transaction.finished !== 'commit') {
      await transaction.rollback();
    }
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ error: "Task already exists" });
    } else {
      console.error("Error creating task:", error);
      res.status(500).json({ error: "Error creating task" });
    }
  }
});

// fetch task for application
router.get("/:app_acronym", async (req, res) => {
  const { app_acronym } = req.params;

  try {
    const tasks = await sequelize.query(
      `SELECT * FROM Tasks WHERE Task_app_Acronym = :app_acronym`,
      {
        replacements: { app_acronym },
        type: sequelize.QueryTypes.SELECT,
      }
    );
    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Error fetching tasks" });
  }
});

// update task
router.put("/:taskId", verifyOpenPermission, async (req, res) => {
  const { taskId } = req.params;
  const { Task_notes, Task_owner, Task_plan } = req.body;

  const transaction = await sequelize.transaction();

  try {
    const [task] = await sequelize.query(
      `SELECT * FROM Tasks WHERE Task_id = :taskId FOR UPDATE`,
      {
        replacements: { taskId },
        type: sequelize.QueryTypes.SELECT,
        transaction,
      }
    );
    if (!task) {
      await transaction.rollback();
      return res.status(404).json({ error: "Task not found" });
    }
    
    await sequelize.query(
      `UPDATE Tasks SET Task_notes = :task_notes, Task_owner = :task_owner, Task_plan = :task_plan WHERE Task_id = :taskId`,
      {
        replacements: { task_notes: Task_notes, task_owner: Task_owner, task_plan: Task_plan, taskId },
        transaction,
      }
    );

    await transaction.commit();
    
    // Notify clients of the updated task
    broadcast({ type: 'TASK_UPDATED', task: { ...task, Task_notes, Task_owner, Task_plan } });

    res.status(200).json({ message: "Task updated successfully" });
  } catch (error) {
    if (transaction.finished !== 'commit') {
      await transaction.rollback();
    }
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Error updating task" });
  }
});

router.put("/:taskId/addnote", async (req, res) => {
  const { taskId } = req.params;
  const { Task_notes, Task_owner } = req.body;

  const transaction = await sequelize.transaction();

  try {
    const [task] = await sequelize.query(
      `SELECT * FROM Tasks WHERE Task_id = :taskId FOR UPDATE`,
      {
        replacements: { taskId },
        type: sequelize.QueryTypes.SELECT,
        transaction,
      }
    );
    if (!task) {
      await transaction.rollback();
      return res.status(404).json({ error: "Task not found" });
    }
    await sequelize.query(
      `UPDATE Tasks SET Task_notes = :task_notes, Task_owner = :task_owner WHERE Task_id = :taskId`,
      {
        replacements: { task_notes: Task_notes, task_owner: Task_owner, taskId },
        transaction,
      }
    );
    await transaction.commit();

    // Notify clients of the updated task
    broadcast({ type: 'NOTES_UPDATED', task: { ...task, Task_notes, Task_owner } });
    res.status(200).json({ message: "Task updated successfully" });
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Error updating task" });
  }
});

router.put("/:taskId/release", verifyOpenPermission, async (req, res) => {
  const { taskId } = req.params;
  const {
    Task_name,
    Task_description,
    Task_plan,
    Task_notes,
    Task_state,
    Task_owner,
  } = req.body;

  const transaction = await sequelize.transaction();

  try {
    const [task] = await sequelize.query(
      `SELECT * FROM Tasks WHERE Task_id = :taskId FOR UPDATE`,
      {
        replacements: { taskId },
        type: sequelize.QueryTypes.SELECT,
        transaction,
      }
    );

    if (!task) {
      await transaction.rollback();
      return res.status(404).json({ error: "Task not found" });
    }

    if (task.Task_state !== "open") {
      await transaction.rollback();
      return res.status(403).json({ error: "Task has already been acknowledged by a user." });
    }

    await sequelize.query(
      `UPDATE Tasks SET Task_name = :task_name, Task_description = :task_description, Task_plan = :task_plan, Task_notes = :task_notes, Task_state = 'to-do', Task_owner = :task_owner WHERE Task_id = :taskId`,
      {
        replacements: {
          task_name: Task_name,
          task_description: Task_description,
          task_plan: Task_plan,
          task_notes: Task_notes,
          task_owner: Task_owner,
          taskId,
        },
        transaction,
      }
    );

    await transaction.commit();
    broadcast({ type: 'TASK_UPDATED', task: { ...task, Task_name, Task_description, Task_plan, Task_notes, Task_state: 'to-do', Task_owner } });
    res.status(200).json({ message: "Task released successfully", task: { ...task, Task_name, Task_description, Task_plan, Task_notes, Task_state: 'to-do', Task_owner } });
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Error updating task" });
  }
});

router.put("/:taskId/Acknowledge", verifyToDoListPermission, async (req, res) => {
  const {
    Task_name,
    Task_description,
    Task_plan,
    Task_notes,
    Task_state,
    Task_owner,
  } = req.body;

  const { taskId } = req.params;

  const transaction = await sequelize.transaction();

  try {
    const [task] = await sequelize.query(
      `SELECT * FROM Tasks WHERE Task_id = :taskId FOR UPDATE`,
      {
        replacements: { taskId },
        type: sequelize.QueryTypes.SELECT,
        transaction,
      }
    );

    if (!task) {
      await transaction.rollback();
      return res.status(404).json({ error: "Task not found" });
    }

    if (task.Task_state !== "to-do") {
      await transaction.rollback();
      return res.status(403).json({ error: "Task has already been acknowledged by a user." });
    }

    await sequelize.query(
      `UPDATE Tasks SET Task_name = :task_name, Task_description = :task_description, Task_plan = :task_plan, Task_notes = :task_notes, Task_state = 'doing', Task_owner = :task_owner WHERE Task_id = :taskId`,
      {
        replacements: {
          task_name: Task_name,
          task_description: Task_description,
          task_plan: Task_plan,
          task_notes: Task_notes,
          task_owner: Task_owner,
          taskId,
        },
        transaction,
      }
    );

    await transaction.commit();
    broadcast({ type: 'TASK_UPDATED', task: { ...task, Task_name, Task_description, Task_plan, Task_notes, Task_state: 'doing', Task_owner } });
    res.status(200).json({ message: "Task acknowledged successfully", task: { ...task, Task_name, Task_description, Task_plan, Task_notes, Task_state: 'doing', Task_owner } });
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Error updating task" });
  }
});

router.put("/:taskId/CompleteOrHalt", verifyDoingPermission, async (req, res) => {
  const { taskId } = req.params;
  const {
    Task_name,
    Task_description,
    Task_plan,
    Task_notes,
    Task_state,
    Task_owner,
  } = req.body;

  const transaction = await sequelize.transaction();

  try {
    const [task] = await sequelize.query(
      `SELECT * FROM Tasks WHERE Task_id = :taskId FOR UPDATE`,
      {
        replacements: { taskId },
        type: sequelize.QueryTypes.SELECT,
        transaction,
      }
    );

    if (!task) {
      await transaction.rollback();
      return res.status(404).json({ error: "Task not found" });
    }

    if (task.Task_state !== "doing") {
      await transaction.rollback();
      return res.status(403).json({ error: "Task has already been acknowledged by a user." });
    }

    await sequelize.query(
      `UPDATE Tasks SET Task_name = :task_name, Task_description = :task_description, Task_plan = :task_plan, Task_notes = :task_notes, Task_state = :task_state, Task_owner = :task_owner WHERE Task_id = :taskId`,
      {
        replacements: {
          task_name: Task_name,
          task_description: Task_description,
          task_plan: Task_plan,
          task_notes: Task_notes,
          task_state: Task_state,
          task_owner: Task_owner,
          taskId,
        },
        transaction,
      }
    );

    await transaction.commit();
    broadcast({ type: 'TASK_UPDATED', task: { ...task, Task_name, Task_description, Task_plan, Task_notes, Task_state, Task_owner } });

    if (Task_state === 'done') {
      const [application] = await sequelize.query(
        `SELECT App_permit_Done FROM Applications WHERE App_Acronym = :app_acronym`,
        {
          replacements: { app_acronym: task.Task_app_Acronym },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      if (application) {
        const [group] = await sequelize.query(
          `SELECT id FROM fullstack.groups WHERE name = :groupName`,
          {
            replacements: { groupName: application.App_permit_Done },
            type: sequelize.QueryTypes.SELECT,
          }
        );

        if (group) {
          const userGroups = await sequelize.query(
            `SELECT fullstack.users.email FROM fullstack.usergroups INNER JOIN fullstack.users ON fullstack.usergroups.username = fullstack.users.username WHERE fullstack.usergroups.groupId = :groupId`,
            {
              replacements: { groupId: group.id },
              type: sequelize.QueryTypes.SELECT,
            }
          );

          const emails = userGroups.map(userGroup => userGroup.email);
          await sendTaskDoneNotification(emails, task);
        }
      }
    }
    res.status(200).json({ message: "Task updated successfully" });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    if (error.name === 'SequelizeTimeoutError' || error.name === 'SequelizeLockError') {
      res.status(409).json({ error: 'Transaction lock timeout. Please try again.' });
    } else {
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Error updating task" });
    }
  }
});

router.put("/:taskId/ApproveOrReject", verifyDonePermission, async (req, res) => {
  const { taskId } = req.params;
  const {
    Task_name,
    Task_description,
    Task_plan,
    Task_notes,
    Task_state,
    Task_owner,
  } = req.body;


  const transaction = await sequelize.transaction();

  try {
    const [task] = await sequelize.query(
      `SELECT * FROM Tasks WHERE Task_id = :taskId FOR UPDATE`,
      {
        replacements: { taskId },
        type: sequelize.QueryTypes.SELECT,
        transaction,
      }
    );

    if (!task) {
      await transaction.rollback();
      return res.status(404).json({ error: "Task not found" });
    }

    // Check if Task_plan is being changed and Task_state is "done"
    if (task.Task_plan !== Task_plan && Task_state === "closed") {
      await transaction.rollback();
      return res.status(400).json({ error: "Task cannot be approved if the Task_plan is reassigned" });
    }

    await sequelize.query(
      `UPDATE Tasks SET Task_name = :task_name, Task_description = :task_description, Task_plan = :task_plan, Task_notes = :task_notes, Task_state = :task_state, Task_owner = :task_owner WHERE Task_id = :taskId`,
      {
        replacements: {
          task_name: Task_name,
          task_description: Task_description,
          task_plan: Task_plan,
          task_notes: Task_notes,
          task_state: Task_state,
          task_owner: Task_owner,
          taskId,
        },
        transaction,
      }
    );

    await transaction.commit();
    broadcast({ type: 'TASK_UPDATED', task: { ...task, Task_name, Task_description, Task_plan, Task_notes, Task_state, Task_owner } });
    res.status(200).json({ message: "Task updated successfully" });
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Error updating task" });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const { Task, Application, UserGroup, User, Group } = require("../models");
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

  const transaction = await Task.sequelize.transaction();

  try {
    const application = await Application.findOne({
      where: { App_Acronym: Task_app_Acronym },
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    if (!application) {
      await transaction.rollback();
      return res.status(404).json({ error: "Application not found" });
    }

    const newRnumber = application.App_Rnumber + 1;
    const taskId = `${Task_app_Acronym}_${newRnumber}`;

    const newTask = await Task.create({
      Task_id: taskId,
      Task_name: Task_name,
      Task_description: Task_description ? Task_description : '',
      Task_app_Acronym: Task_app_Acronym,
      Task_plan: Task_plan,
      Task_notes: Task_notes,
      Task_state: "open",
      Task_creator: req.username,
      Task_owner: req.username,
      Task_createDate: new Date(),
    }, { transaction });

    application.App_Rnumber = newRnumber;
    await application.save({ transaction });

    await transaction.commit();

    // Notify clients of the new task
    broadcast({ type: 'TASK_CREATED', task: newTask });

    res.status(201).json(newTask);
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
    const tasks = await Task.findAll({
      where: { Task_app_Acronym: app_acronym },
    });
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

  const transaction = await Task.sequelize.transaction();

  try {
    const task = await Task.findOne({
      where: { Task_id: taskId },
      lock: transaction.LOCK.UPDATE,
      transaction,
    });
    if (!task) {
      await transaction.rollback();
      return res.status(404).json({ error: "Task not found" });
    }
    
    await task.update(
      { Task_notes, Task_owner, Task_plan },
      { transaction }
    );

    await transaction.commit();
    
    // Notify clients of the updated task
    broadcast({ type: 'TASK_UPDATED', task });

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
  const { Task_notes, Task_owner} = req.body;

  const transaction = await Task.sequelize.transaction();

  try {
    const task = await Task.findOne({ where: { Task_id: taskId },
      lock: transaction.LOCK.UPDATE,
       transaction});
    if (!task) {
      await transaction.rollback();
      return res.status(404).json({ error: "Task not found" });
    }
    await task.update(
      { Task_notes, Task_owner},
       { transaction }
    );
    await transaction.commit();

    // Notify clients of the updated task
    broadcast({ type: 'NOTES_UPDATED', task: task });
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

  const transaction = await Task.sequelize.transaction();

  try {
    const task =  await Task.findOne({ where: { Task_id: taskId },
      lock: transaction.LOCK.UPDATE,
       transaction});

    if (!task) {
      await transaction.rollback();
      return res.status(404).json({ error: "Task not found" });
    }

    if (task.Task_state !== "open") {
        await transaction.rollback();
        return res.status(403).json({ error: "Task has already been acknowledged by a user." });
        }

      await task.update(
        { Task_name, Task_description, Task_plan, Task_notes, Task_state: "to-do", Task_owner },
       { transaction }
      );
      await transaction.commit();
      broadcast({ type: 'TASK_UPDATED', task });
      res.status(200).json({ message: "Task released successfully", task });
    } catch (error) {
      await transaction.rollback();
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Error updating task" });
    }
  }
);

router.put(
  "/:taskId/Acknowledge",
  verifyToDoListPermission,
  async (req, res) => {
    const {
      Task_name,
      Task_description,
      Task_plan,
      Task_notes,
      Task_state,
      Task_owner,
    } = req.body;

    const { taskId } = req.params;

    const transaction = await Task.sequelize.transaction();
    try {
      const task =  await Task.findOne({ where: { Task_id: taskId },
        lock: transaction.LOCK.UPDATE,
         transaction});

      if (!task) {
        await transaction.rollback();
        return res.status(404).json({ error: "Task not found" });
      }

      if (task.Task_state !== "to-do") {
        await transaction.rollback();
        return res.status(403).json({ error: "Task has already been acknowledged by a user." });
        }

        await task.update(
          { Task_name, Task_description, Task_plan, Task_notes, Task_state: "doing", Task_owner },
          { transaction }
        );

      await transaction.commit();
      broadcast({ type: 'TASK_UPDATED', task });
      res.status(200).json({ message: "Task acknowledged successfully", task });
    } catch (error) {
      await transaction.rollback();
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Error updating task" });
    }
  }
);


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

  const transaction = await Task.sequelize.transaction();

  try {
    // Try to acquire a lock on the task row
    const task = await Task.findOne({
      where: { Task_id: taskId },
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    if (!task) {
      await transaction.rollback();
      return res.status(404).json({ error: "Task not found" });
    }

    if (task.Task_state !== "doing") {
      await transaction.rollback();
      return res.status(403).json({ error: "Task has already been acknowledged by a user." });
    }

    // Perform the update within the transaction
    await task.update({
      Task_name,
      Task_description,
      Task_plan,
      Task_notes,
      Task_state,
      Task_owner,
    }, { transaction });

    // Commit the transaction
    await transaction.commit();

    // Broadcast the updated task
    broadcast({ type: 'TASK_UPDATED', task });
    // Send email notification if the task state is 'done'
    if (Task_state === 'done') {
      // Fetch the application to get the app_permit_done field
      const application = await Application.findOne({ where: { App_Acronym: task.Task_app_Acronym } });
      if (application) {
        const groupName = application.App_permit_Done;

        // Fetch the group with the specified group name
        const group = await Group.findOne({ where: { name: groupName } });

        if (group) {
          // Fetch the users in that group through the UserGroup table
          const userGroups = await UserGroup.findAll({
            where: { groupId: group.id },
            include: [{ model: User, as: 'user', attributes: ['email'] }]
          });

          const emails = userGroups.map(userGroup => userGroup.user.email);
          await sendTaskDoneNotification(emails, task);
        }
      }
    }
    res.status(200).json({ message: "Task updated successfully" });
  } catch (error) {
    // Rollback the transaction only if it hasn't been committed
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


router.put(
  "/:taskId/ApproveOrReject",
  verifyDonePermission,
  async (req, res) => {
    const { taskId } = req.params;
    const {
      Task_name,
      Task_description,
      Task_plan,
      Task_notes,
      Task_state,
      Task_owner,
    } = req.body;

  const transaction = await Task.sequelize.transaction();

    try {
      const task = await Task.findOne({ where: { Task_id: taskId },
        lock: transaction.LOCK.UPDATE,
         transaction}
      );
      if (!task) {
        await transaction.rollback();
        return res.status(404).json({ error: "Task not found" });
      }
     
    // Perform the update within the transaction
    await task.update({
      Task_name,
      Task_description,
      Task_plan,
      Task_notes,
      Task_state,
      Task_owner,
    }, { transaction });

    await transaction.commit();
    broadcast({ type: 'TASK_UPDATED', task });
      res.status(200).json({ message: "Task updated successfully" });
    } catch (error) {
      await transaction.rollback();
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Error updating task" });
    }
  }
);

module.exports = router;

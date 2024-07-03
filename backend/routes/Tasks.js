const express = require("express");
const router = express.Router();
const { Task, Application } = require("../models");
const {
  verifyCreatePermission,
  verifyDoingPermission,
  verifyDonePermission,
  verifyOpenPermission,
  verifyToDoListPermission,
  isTaskOwner,
} = require("../middleware/groupAuthMiddleware");
const { taskTransactionLockMiddleware } = require("../middleware/raceConditionMiddleware");

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
      // Fetch the application to get the current App_Rnumber
      const application = await Application.findOne({
        where: { App_Acronym: Task_app_Acronym },
        lock: transaction.LOCK.UPDATE,
        transaction,
      });
  
      if (!application) {
        await transaction.rollback();
        return res.status(404).json({ error: "Application not found" });
      }
  
      // Increment the App_Rnumber
      const newRnumber = application.App_Rnumber + 1;
  
      // Generate the task_id
      const taskId = `${Task_app_Acronym}_${newRnumber}`;
  
      // Create the new task
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
  
      // Update the App_Rnumber in the application
      application.App_Rnumber = newRnumber;
      await application.save({ transaction });
  
      await transaction.commit();
      res.status(201).json(newTask);
    } catch (error) {
      await transaction.rollback();
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
    const task = await Task.findOne({ where: { Task_id: taskId },
      lock: transaction.LOCK.UPDATE,
       transaction});
    if (!task) {
      await transaction.rollback();
      return res.status(404).json({ error: "Task not found" });
    }
    await Task.update(
      { Task_notes, Task_owner, Task_plan},
      { transaction }
    );
    await transaction.commit();
    res.status(200).json({ message: "Task updated successfully" });
  } catch (error) {
    await transaction.rollback();
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
    await Task.update(
      { Task_notes, Task_owner},
       { transaction }
    );
    await transaction.commit();
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
      res.status(200).json({ message: "Task acknowledged successfully", task });
    } catch (error) {
      await transaction.rollback();
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Error updating task" });
    }
  }
);

router.put(
  "/:taskId/CompleteOrHalt",
  verifyDoingPermission,
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
      res.status(200).json({ message: "Task updated successfully" });
    } catch (error) {
      await transaction.rollback();

      if (error.name === 'SequelizeTimeoutError' || error.name === 'SequelizeLockError') {
        res.status(409).json({ error: 'Transaction lock timeout. Please try again.' });
      } else {
        console.error("Error updating task:", error);
        res.status(500).json({ error: "Error updating task" });
      }
    }
  }
);

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
      res.status(200).json({ message: "Task updated successfully" });
    } catch (error) {
      await transaction.rollback();
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Error updating task" });
    }
  }
);

module.exports = router;

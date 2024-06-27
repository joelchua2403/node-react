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
const { transactionLockMiddleware } = require("../middleware/raceConditionMiddleware");

router.post("/create", verifyCreatePermission, async (req, res) => {
  const {
    Task_app_Acronym,
    Task_name,
    Task_description,
    Task_plan,
    Task_notes,
  } = req.body;

  console.log("app_acronym", Task_app_Acronym);

  try {
    // Fetch the application to get the current App_Rnumber
    const application = await Application.findOne({
      where: { App_Acronym: Task_app_Acronym },
    });

    if (!application) {
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
      Task_description: Task_description,
      Task_app_Acronym: Task_app_Acronym,
      Task_plan: Task_plan,
      Task_notes: Task_notes,
      Task_state: "open",
      Task_creator: req.username,
      Task_owner: req.username,
      Task_createDate: new Date(),
    });

    // Update the App_Rnumber in the application
    application.App_Rnumber = newRnumber;
    await application.save();

    res.status(201).json(newTask);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Error creating task" });
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
router.put("/:taskId", isTaskOwner, async (req, res) => {
  const { taskId } = req.params;
  const { Task_notes, Task_owner } = req.body;

  try {
    const task = await Task.findOne({ where: { Task_id: taskId } });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    await Task.update(
      { Task_notes: Task_notes, Task_owner: Task_owner },
      { where: { Task_id: taskId } }
    );
    res.status(200).json({ message: "Task updated successfully" });
  } catch (error) {
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
  console.log("Task_name", Task_name);

  try {
    const task = await Task.findOne({ where: { Task_id: taskId } });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    await Task.update(
      {
        Task_name: Task_name,
        Task_description: Task_description,
        Task_plan: Task_plan,
        Task_notes: Task_notes,
        Task_state: Task_state,
        Task_owner: Task_owner,
      },
      { where: { Task_id: taskId } }
    );
    res.status(200).json({ message: "Task updated successfully" });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Error updating task" });
  }
});

router.put(
  "/:taskId/Acknowledge",
  verifyToDoListPermission,
  transactionLockMiddleware("Task", "taskId"),
  async (req, res) => {
    const {
      Task_name,
      Task_description,
      Task_plan,
      Task_notes,
      Task_state,
      Task_owner,
    } = req.body;
    try {
      const task = req.record; // This should be set by the transactionLockMiddleware
      if (!task) {
        await req.transaction.rollback();
        return res.status(404).json({ error: "Task not found" });
      }

      if (task.Task_state !== "to-do") {
        await req.transaction.rollback();
        return res.status(403).json({ error: "Task has already been acknowledged by a user." });
        }

      task.Task_name = Task_name;
      task.Task_description = Task_description;
      task.Task_plan = Task_plan;
      task.Task_notes = Task_notes;
      task.Task_state = "doing"; // Acknowledge action changes state to 'doing'
      task.Task_owner = Task_owner;

      // for testing purposes
    //   setTimeout(() => {
    //     console.log("Task is now in progress.");
    //   }, 5000);    
      
      await task.save({ transaction: req.transaction });
      console.log('task completed')

      await req.transaction.commit();
      res.status(200).json({ message: "Task acknowledged successfully", task });
    } catch (error) {
      await req.transaction.rollback();
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
    console.log("Task_name", Task_name);

    try {
      const task = await Task.findOne({ where: { Task_id: taskId } });
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      if (task.Task_owner !== req.username) {
        return res.status(403).json({ error: "You are not the Task Owner." });
      }
      await Task.update(
        {
          Task_name: Task_name,
          Task_description: Task_description,
          Task_plan: Task_plan,
          Task_notes: Task_notes,
          Task_state: Task_state,
          Task_owner: Task_owner,
        },
        { where: { Task_id: taskId } }
      );
      res.status(200).json({ message: "Task updated successfully" });
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Error updating task" });
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
    console.log("Task_name", Task_name);

    try {
      const task = await Task.findOne({ where: { Task_id: taskId } });
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      await Task.update(
        {
          Task_name: Task_name,
          Task_description: Task_description,
          Task_plan: Task_plan,
          Task_notes: Task_notes,
          Task_state: Task_state,
          Task_owner: Task_owner,
        },
        { where: { Task_id: taskId } }
      );
      res.status(200).json({ message: "Task updated successfully" });
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Error updating task" });
    }
  }
);

module.exports = router;

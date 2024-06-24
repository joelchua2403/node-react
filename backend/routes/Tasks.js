const express = require('express');
const router = express.Router();
const { Task, Application } = require('../models');
const { verifyGroupProjectLead } = require('../middleware/groupAuthMiddleware');

router.post('/create', verifyGroupProjectLead, async (req, res) => {
  const { app_acronym, Task_name, Task_description, Task_plan, Task_notes } = req.body;

  console.log("app_acronym", app_acronym)

  try {
    // Fetch the application to get the current App_Rnumber
    const application = await Application.findOne({ where: { App_Acronym: app_acronym } });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Increment the App_Rnumber
    const newRnumber = application.App_Rnumber + 1;

    // Generate the task_id
    const taskId = `${app_acronym}_${newRnumber}`;

    // Create the new task
    const newTask = await Task.create({
      Task_id: taskId,
      Task_name: Task_name,
      Task_description: Task_description,
      Task_app_Acronym: app_acronym,
      Task_plan: Task_plan,
      Task_notes: Task_notes,
      Task_state: 'open',
      Task_creator: req.username,
      Task_owner: req.username,
      Task_createDate: new Date()
    });

    // Update the App_Rnumber in the application
    application.App_Rnumber = newRnumber;
    await application.save();

    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Error creating task' });
  }
});

// fetch task for application
router.get('/:app_acronym',  async (req, res) => {
  const { app_acronym } = req.params;

  try {
    const tasks = await Task.findAll({ where: { Task_app_Acronym: app_acronym } });
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Error fetching tasks' });
  }
});

// update task
router.put('/:taskId',  async (req, res) => {
  const { taskId } = req.params;
  const { Task_name, Task_description, Task_plan, Task_notes, Task_state, Task_owner } = req.body;
  console.log("Task_name", Task_name)

  try {
    const task = await Task.findOne({ where: { Task_id: taskId } });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    await Task.update({ Task_name: Task_name, Task_description: Task_description, Task_plan: Task_plan, Task_notes: Task_notes, Task_state: Task_state, Task_owner: Task_owner }, { where: { Task_id: taskId } });
    res.status(200).json({ message: 'Task updated successfully' });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Error updating task' });
        }
        }
        );

module.exports = router;

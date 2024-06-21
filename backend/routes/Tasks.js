const express = require('express');
const router = express.Router();
const { Task, Application } = require('../models');
const verifyToken = require('../middleware/authMiddleware');

router.post('/create', verifyToken, async (req, res) => {
  const { app_acronym, name, description, plan, notes } = req.body;

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
      Task_name: name,
      Task_description: description,
      Task_app_Acronym: app_acronym,
      Task_plan: plan,
      Task_notes: notes,
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
router.get('/:app_acronym', verifyToken, async (req, res) => {
  const { app_acronym } = req.params;

  try {
    const tasks = await Task.findAll({ where: { Task_app_Acronym: app_acronym } });
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Error fetching tasks' });
  }
});

module.exports = router;

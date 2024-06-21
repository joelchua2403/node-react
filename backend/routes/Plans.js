const express = require('express');
const router = express.Router();
const { Plan } = require('../models');
const verifyToken = require('../middleware/authMiddleware');

// Create a new plan
router.post('/', verifyToken, async (req, res) => {
  const { Plan_MVP_name, Plan_Description, Plan_startDate, Plan_endDate, Plan_app_Acronym } = req.body;

  try {
    const newPlan = await Plan.create({
      Plan_MVP_name,
      Plan_Description,
      Plan_startDate,
      Plan_endDate,
      Plan_app_Acronym,
    });
    res.status(201).json(newPlan);
  } catch (error) {
    console.error('Failed to create plan:', error);
    res.status(500).json({ error: 'Failed to create plan' });
  }
});

// Get all plans
router.get('/:app_acronym', verifyToken, async (req, res) => {
    const { app_acronym } = req.params;
  try {
    const plans = await Plan.findAll({ where: { Plan_app_Acronym: app_acronym }});
    res.status(200).json(plans);
  } catch (error) {
    console.error('Failed to fetch plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// Get a single plan by ID
router.get('/:planId', verifyToken, async (req, res) => {
  const { planId } = req.params;

  try {
    const plan = await Plan.findByPk(planId);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    res.status(200).json(plan);
  } catch (error) {
    console.error('Failed to fetch plan:', error);
    res.status(500).json({ error: 'Failed to fetch plan' });
  }
});

// Update a plan by ID
router.put('/:planId', verifyToken, async (req, res) => {
  const { planId } = req.params;
  const { Plan_MVP_name, Plan_Description, Plan_startDate, Plan_endDate, Plan_app_Acronym } = req.body;

  try {
    const plan = await Plan.findByPk(planId);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    plan.Plan_MVP_name = Plan_MVP_name;
    plan.Plan_Description = Plan_Description;
    plan.Plan_startDate = Plan_startDate;
    plan.Plan_endDate = Plan_endDate;
    plan.Plan_app_Acronym = Plan_app_Acronym;

    await plan.save();
    res.status(200).json(plan);
  } catch (error) {
    console.error('Failed to update plan:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

// Delete a plan by ID
router.delete('/:planId', verifyToken, async (req, res) => {
  const { planId } = req.params;

  try {
    const plan = await Plan.findByPk(planId);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    await plan.destroy();
    res.status(200).json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Failed to delete plan:', error);
    res.status(500).json({ error: 'Failed to delete plan' });
  }
});

module.exports = router;

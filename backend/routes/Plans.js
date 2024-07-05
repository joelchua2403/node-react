const express = require('express');
const router = express.Router();
const { sequelize } = require('../models'); // Import sequelize instance
const verifyToken = require('../middleware/authMiddleware');
const { broadcast } = require('../middleware/websocket');

// Create a new plan
router.post('/', async (req, res) => {
  const { Plan_MVP_name, Plan_startDate, Plan_endDate, Plan_app_Acronym } = req.body;

  // Check if any of the required fields is null or undefined
  if (!Plan_MVP_name || !Plan_startDate || !Plan_endDate || !Plan_app_Acronym) {
    return res.status(400).json({ error: 'All fields are required and cannot be null' });
  }

    try {
    // Check if the plan name already exists for the given application
    const [existingPlan] = await sequelize.query(
      `SELECT * FROM Plans WHERE Plan_MVP_name = :Plan_MVP_name AND Plan_app_Acronym = :Plan_app_Acronym`,
      {
        replacements: {
          Plan_MVP_name,
          Plan_app_Acronym,
        },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (existingPlan) {
      return res.status(409).json({ error: 'Plan name already exists for this application' });
    }

    const [result] = await sequelize.query(
      `INSERT INTO Plans 
        (Plan_MVP_name, Plan_startDate, Plan_endDate, Plan_app_Acronym) 
      VALUES 
        (:Plan_MVP_name, :Plan_startDate, :Plan_endDate, :Plan_app_Acronym) 
        `,
      {
        replacements: {
          Plan_MVP_name,
          Plan_startDate,
          Plan_endDate,
          Plan_app_Acronym,
        }
      }
    );
    const newPlan = result[0];
    broadcast({ type: 'PLAN_CREATED', payload: newPlan });
    res.status(201).json(newPlan);
  } catch (error) {
    console.error('Failed to create plan:', error);
    res.status(500).json({ error: 'Failed to create plan' });
  }
});

// Get all plans
router.get('/:app_acronym', async (req, res) => {
  const { app_acronym } = req.params;
  try {
    const plans = await sequelize.query(
      `SELECT * FROM Plans WHERE Plan_app_Acronym = :app_acronym`,
      {
        replacements: { app_acronym },
        type: sequelize.QueryTypes.SELECT,
      }
    );
    res.status(200).json(plans);
  } catch (error) {
    console.error('Failed to fetch plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// Get a single plan by ID
router.get('/:planId', async (req, res) => {
  const { planId } = req.params;

  try {
    const [plan] = await sequelize.query(
      `SELECT * FROM Plans WHERE id = :planId`,
      {
        replacements: { planId },
        type: sequelize.QueryTypes.SELECT,
      }
    );
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

  const transaction = await sequelize.transaction();

  try {
    const [plan] = await sequelize.query(
      `SELECT * FROM Plans WHERE id = :planId FOR UPDATE`,
      {
        replacements: { planId },
        type: sequelize.QueryTypes.SELECT,
        transaction
      }
    );
    if (!plan) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Plan not found' });
    }

    await sequelize.query(
      `UPDATE Plans SET 
        Plan_MVP_name = :Plan_MVP_name, 
        Plan_Description = :Plan_Description, 
        Plan_startDate = :Plan_startDate, 
        Plan_endDate = :Plan_endDate, 
        Plan_app_Acronym = :Plan_app_Acronym 
      WHERE id = :planId`,
      {
        replacements: {
          Plan_MVP_name,
          Plan_Description,
          Plan_startDate,
          Plan_endDate,
          Plan_app_Acronym,
          planId
        },
        transaction
      }
    );

    await transaction.commit();

    res.status(200).json({
      ...plan,
      Plan_MVP_name,
      Plan_Description,
      Plan_startDate,
      Plan_endDate,
      Plan_app_Acronym
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Failed to update plan:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

// Delete a plan by ID
router.delete('/:planId', async (req, res) => {
  const { planId } = req.params;

  const transaction = await sequelize.transaction();

  try {
    const [plan] = await sequelize.query(
      `SELECT * FROM Plans WHERE id = :planId FOR UPDATE`,
      {
        replacements: { planId },
        type: sequelize.QueryTypes.SELECT,
        transaction
      }
    );
    if (!plan) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Plan not found' });
    }

    await sequelize.query(
      `DELETE FROM Plans WHERE id = :planId`,
      {
        replacements: { planId },
        transaction
      }
    );

    await transaction.commit();

    res.status(200).json({ message: 'Plan deleted successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Failed to delete plan:', error);
    res.status(500).json({ error: 'Failed to delete plan' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { sequelize } = require('../models'); // Import sequelize instance
const { verifyProjectLead } = require('../middleware/groupAuthMiddleware');
const { broadcast } = require('../middleware/websocket');
const { format, isValid, parseISO } = require('date-fns');

// Function to check if date is valid and in ISO format
const isValidISODate = (dateString) => {
  const date = parseISO(dateString);
  return isValid(date);
};

// Function to check if date has '00:00:00.000Z' time portion
const hasInvalidTime = (dateString) => {
  return dateString.endsWith('00:00:00.000Z');
};
router.get('/', async (req, res) => {
  try {
    const applications = await sequelize.query(
      `SELECT * FROM Applications`,
      { type: sequelize.QueryTypes.SELECT }
    );
    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Get a single application by acronym
router.get('/:app_acronym', async (req, res) => {
  const { app_acronym } = req.params;
  try {
    const [application] = await sequelize.query(
      `SELECT * FROM Applications WHERE App_Acronym = :app_acronym`,
      {
        replacements: { app_acronym },
        type: sequelize.QueryTypes.SELECT,
      }
    );
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.status(200).json(application);
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

router.post('/create', verifyProjectLead, async (req, res) => {
  const {
    App_Acronym,
    App_Description,
    App_Rnumber,
    App_startDate,
    App_endDate,
    App_permit_Create,
    App_permit_Open,
    App_permit_toDoList,
    App_permit_Doing,
    App_permit_Done
  } = req.body;

  // Check for null or undefined values
  if (!App_Acronym || !App_Rnumber || !App_startDate || !App_endDate) {
    return res.status(400).json({ error: 'App_Acronym, App_Rnumber, App_startDate, and App_endDate are required and cannot be null' });
  }


  // Check if App_Acronym only contains alphanumeric characters and underscores
  const acronymRegex = /^[a-zA-Z0-9_]+$/;
  if (!acronymRegex.test(App_Acronym)) {
    return res.status(401).json({ error: 'Application acronym can only contain alphanumeric characters and underscores.' });
  }

  // Check if App_Rnumber is a positive integer
  const runningNumber = parseInt(App_Rnumber, 10);
  if (isNaN(runningNumber) || runningNumber <= 0) {
    return res.status(402).json({ error: 'Application running number must be a positive integer.' });
  }


  try {
    // Check if App_Acronym already exists
    const [existingApplication] = await sequelize.query(
      `SELECT * FROM fullstack.applications WHERE App_Acronym = :App_Acronym`,
      {
        replacements: { App_Acronym },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (existingApplication) {
      return res.status(409).json({ error: 'App_Acronym already exists' });
    }

    // Insert new application
    const [result] = await sequelize.query(
      `INSERT INTO fullstack.applications 
        (App_Acronym, App_Description, App_Rnumber, App_startDate, App_endDate, App_permit_Create, App_permit_Open, App_permit_toDoList, App_permit_Doing, App_permit_Done) 
      VALUES 
        (:App_Acronym, :App_Description, :App_Rnumber, :App_startDate, :App_endDate, :App_permit_Create, :App_permit_Open, :App_permit_toDoList, :App_permit_Doing, :App_permit_Done)`,
      {
        replacements: {
          App_Acronym,
          App_Description,
          App_Rnumber,
          App_startDate,
          App_endDate,
          App_permit_Create,
          App_permit_Open,
          App_permit_toDoList,
          App_permit_Doing,
          App_permit_Done
        }
      }
    );
    const application = result[0];
    broadcast({ type: 'APPLICATION_CREATED', payload: application });
    res.status(201).json(application);
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update an application
router.put('/:appAcronym', verifyProjectLead, async (req, res) => {
  const { appAcronym } = req.params;
  const {
    App_Rnumber,
    App_Description,
    App_startDate,
    App_endDate,
    App_permit_Create,
    App_permit_Open,
    App_permit_toDoList,
    App_permit_Doing,
    App_permit_Done
  } = req.body;

  
   // Check if any of the required fields is null or undefined
   if (!App_startDate || !App_endDate) {
    return res.status(400).json({ error: 'App start date and App end date are required and cannot be null' });
  }

  // Check if datetime format is valid and if it has invalid time
  if (!isValidISODate(App_startDate) || !isValidISODate(App_endDate) || hasInvalidTime(App_startDate) || hasInvalidTime(App_endDate)) {
    return res.status(400).json({ error: 'App start date and App end date are required and cannot have invalid time format' });
  }
  const transaction = await sequelize.transaction();

  try {
    const [application] = await sequelize.query(
      `SELECT * FROM fullstack.applications WHERE App_Acronym = :appAcronym FOR UPDATE`,
      {
        replacements: { appAcronym },
        type: sequelize.QueryTypes.SELECT,
        transaction
      }
    );

    if (!application) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Application not found' });
    }

    await sequelize.query(
      `UPDATE fullstack.applications SET
        App_Description = :App_Description,
        App_Rnumber = :App_Rnumber,
        App_startDate = :App_startDate,
        App_endDate = :App_endDate,
        App_permit_Create = :App_permit_Create,
        App_permit_Open = :App_permit_Open,
        App_permit_toDoList = :App_permit_toDoList,
        App_permit_Doing = :App_permit_Doing,
        App_permit_Done = :App_permit_Done
      WHERE
        App_Acronym = :appAcronym`,
      {
        replacements: {
          App_Description,
          App_Rnumber,
          App_startDate,
          App_endDate,
          App_permit_Create,
          App_permit_Open,
          App_permit_toDoList,
          App_permit_Doing,
          App_permit_Done,
          appAcronym
        },
        transaction
      }
    );

    await transaction.commit();
    broadcast({ type: 'APPLICATION_UPDATED', payload: { ...application, App_Description, App_Rnumber, App_startDate, App_endDate, App_permit_Create, App_permit_Open, App_permit_toDoList, App_permit_Doing, App_permit_Done } });
    console.log('Updated application:', application);
    res.status(200).json(application);
  } catch (error) {
    await transaction.rollback();
    if (error.name === 'SequelizeTimeoutError') {
      res.status(409).json({ error: 'Transaction is currently locked. Please try again later.' });
    } else {
      console.error('Error updating application:', error);
      res.status(500).json({ error: 'Error updating application' });
    }
  }
});

module.exports = router;

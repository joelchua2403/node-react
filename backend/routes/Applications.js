// routes/applications.js
const express = require('express');
const router = express.Router();
const { Application } = require('../models');
const { verifyProjectLead } = require('../middleware/groupAuthMiddleware');
const { applicationTransactionLockMiddleware } = require('../middleware/raceConditionMiddleware');

router.get('/', async (req, res) => {
  try {
    const applications = await Application.findAll();
    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

router.post('/create', verifyProjectLead , async (req, res) => {
    const { App_Acronym, App_Name, App_Description, App_Owner, App_Rnumber, App_startDate, App_endDate, App_permit_Create, App_permit_Open, App_permit_toDoList, App_permit_Doing, App_permit_Done } = req.body;
    
    try {
        const application = await Application.create({
        App_Acronym,
        App_Name,
        App_Description,
        App_Owner,
        App_Rnumber,
        App_startDate,
        App_endDate,
        App_permit_Create,
        App_permit_Open,
        App_permit_toDoList,
        App_permit_Doing,
        App_permit_Done
        });
        res.status(201).json(application);
    } catch (error) {
        console.error('Error creating application:', error);
        res.status(500).json({ error: 'Error creating application' });
    }
    }
);

// Update an application
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

  const transaction = await Application.sequelize.transaction();

  try {
    const application = await Application.findOne({
      where: { App_Acronym: appAcronym },
      lock: transaction.LOCK.UPDATE,
      transaction
    });

    if (!application) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Application not found' });
    }

    await application.update({
      App_Description,
      App_Rnumber,
      App_startDate,
      App_endDate,
      App_permit_Create,
      App_permit_Open,
      App_permit_toDoList,
      App_permit_Doing,
      App_permit_Done
    }, { transaction });

    await transaction.commit();
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

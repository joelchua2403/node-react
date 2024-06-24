// routes/applications.js
const express = require('express');
const router = express.Router();
const { Application } = require('../models');
const { verifyProjectLead } = require('../middleware/groupAuthMiddleware');

router.get('/', async (req, res) => {
  try {
    const applications = await Application.findAll();
    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

router.post('/create', verifyProjectLead ,async (req, res) => {
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

module.exports = router;

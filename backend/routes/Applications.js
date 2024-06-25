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
  
    try {
      const application = await Application.findOne({ where: { App_Acronym: appAcronym } });
  
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }
  
      application.App_Rnumber = App_Rnumber;
      application.App_Description = App_Description;
      application.App_startDate = App_startDate;
      application.App_endDate = App_endDate;
      application.App_permit_Create = App_permit_Create;
      application.App_permit_Open = App_permit_Open;
      application.App_permit_toDoList = App_permit_toDoList;
      application.App_permit_Doing = App_permit_Doing;
      application.App_permit_Done = App_permit_Done;
  
      await application.save();
  
      res.status(200).json(application);
    } catch (error) {
      console.error('Error updating application:', error);
      res.status(500).json({ error: 'Error updating application' });
    }
  });

module.exports = router;

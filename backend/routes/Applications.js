// routes/applications.js
const express = require('express');
const router = express.Router();
const { Application } = require('../models');

router.get('/', async (req, res) => {
  try {
    const applications = await Application.findAll();
    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

module.exports = router;

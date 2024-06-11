const express = require('express');
const router = express.Router();
const { Group, UserGroup } = require('../models');
const verifyToken = require('../middleware/authMiddleware');

router.get("/", verifyToken, async (req, res) => {
    const userId = req.userId;
  
    try {
      const userGroups = await UserGroup.findAll({ where: { userId } });
  
      // Log the entire userGroups object to see its structure
      console.log('User Groups:', userGroups);
  
      // Iterate through the userGroups array to log individual userId values
      userGroups.forEach(ug => {
        console.log('Group ID:', ug.groupId, 'User ID:', ug.userId);
      });
  
      res.json(userGroups);
    } catch (error) {
      console.error('Failed to fetch user groups:', error);
      res.status(500).json({ error: 'Failed to fetch user groups' });
    }
  });
// Join a group
router.post('/:groupId/join', verifyToken, async (req, res) => {
    const { groupId } = req.params;
    const { userId } = req.body;
  
    try {
      const userGroup = await UserGroup.create({ userId, groupId });
      res.json(userGroup);
    } catch (error) {
      res.status(500).json({ error: 'Failed to join group' });
    }
  });
  
  // Leave a group
  router.post('/:groupId/leave', verifyToken, async (req, res) => {
    const { groupId } = req.params;
    const { userId } = req.body;
  
    try {
      await UserGroup.destroy({ where: { userId, groupId } });
      res.json({ message: 'Successfully left group' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to leave group' });
    }
  });
  
  module.exports = router;
const express = require('express');
const router = express.Router();
const { Group, UserGroup, User } = require('../models');
const verifyToken = require('../middleware/authMiddleware');
const { sequelize } = require('../models');
const { CheckGroup } = require('../middleware/groupAuthMiddleware');

// Fetch all users with their groups

router.get('/', async (req, res) => {
  try {
    const users = await sequelize.query(`
      SELECT u.username, u.email, u.isDisabled, g.name as groupName
      FROM users u
      LEFT JOIN usergroups ug ON u.username = ug.username
      LEFT JOIN \`groups\` g ON ug.groupId = g.id
    `, { type: sequelize.QueryTypes.SELECT });

    const result = users.reduce((acc, user) => {
      const existingUser = acc.find(u => u.username === user.username);
      if (existingUser) {
        if (user.groupName) {
          existingUser.groups.push(user.groupName);
        }
      } else {
        acc.push({ ...user, groups: user.groupName ? [user.groupName] : [] });
      }
      return acc;
    }, []);

    res.json(result);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err });
  }
});

// Get all groups for a user
router.get('/:username/:app_acronym', async (req, res) => {
  const { username, app_acronym } = req.params;
console.log('username:', username);
console.log('app_acronym:', app_acronym);
  try {
    const user = await User.findOne({
      where: { username},
      include: {
        model: Group,
        through: UserGroup,
        as: 'groups',
        attributes: ['name']
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const isInGroupProjectManager = await CheckGroup(username, `${app_acronym}_Pm`);

    res.json({
      isInGroupProjectManager
    });
  } catch (error) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({ error: 'Error fetching user groups' });
  }
});


// Join a group
router.post('/:groupId/join',  async (req, res) => {
  const { groupId } = req.params;
  const { username } = req.body;

  try {
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userGroup = await UserGroup.create({ userId: username, groupId });
    console.log('User Group:', userGroup);
    res.json(userGroup);
  } catch (error) {
    res.status(500).json({ error: 'Failed to join group' });
  }
});

// Leave a group
router.post('/:groupId/leave', verifyToken, async (req, res) => {
  const { groupId } = req.params;
  const { username } = req.body;

  try {
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    await UserGroup.destroy({ where: { userId: username, groupId } });
    res.json({ message: 'Successfully left group' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to leave group' });
  }
});

module.exports = router;

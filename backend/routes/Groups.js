const express = require('express');
const router = express.Router();
const { Group, UserGroup, Post, User } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { where } = require('sequelize');
const secretKey = 'secretkey'
const verifyToken = require('../middleware/authMiddleware'); 


router.get("/" , async (req, res) => {
    try {
        const groups = await Group.findAll();
        res.json(groups);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err });
    }
    
});

router.get("/:groupId/members" , async (req, res) => {
  const groupId = req.params.groupId;
 
  try {
    const group = await Group.findOne({
      where: { id: groupId },
      include: {
        model: User,
        as: 'users',
        through: { attributes: [] }, // Exclude the UserGroup join table attributes
      },
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json(group.users);
  } catch (error) {
    console.error('Failed to fetch group members:', error);
    res.status(500).json({ error: 'Failed to fetch group members' });
  }
});


// Create a group
router.post('/', async (req, res) => {
    try {
      const { name } = req.body;
      const group = await Group.create({ name });
      res.json(group);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

// Join a group
router.post('/:groupId/join', async (req, res) => {
    const { groupId } = req.params;
    const { userId } = req.body;
    console.log('userId:', userId);
    console.log('groupId:', groupId);
    try {
      const userGroup = await UserGroup.create({ userId, groupId });
      res.json(userGroup);
    } catch (error) {
      res.status(500).json({ error: 'Failed to join group' });
    }
  });

  router.get('/:groupId', async (req, res) => {
    const { groupId } = req.params;
    try {
      const group = await Group.findByPk(groupId);
      res.json(group);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch group' });
    }
  });

  // Get posts for a specific group
router.get('/:id/posts',  async (req, res) => {
    const groupId = req.params.id;

    try {
        const posts = await Post.findAll({ where: { groupId }, include: 'user' });
        res.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// Create a post in a specific group
router.post('/:id/posts',  async (req, res) => {
    const groupId = req.params.id;
    const { title, content, userId } = req.body;

    try {
        const group = await Group.findByPk(groupId);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const post = await Post.create({
            title,
            content,
            userId,
            groupId
        });

        res.json(post);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});


module.exports = router;
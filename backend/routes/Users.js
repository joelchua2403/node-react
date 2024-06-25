const express = require('express');
const router = express.Router();
const {  User, Group, UserGroup } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const secretKey = 'secretkey';
const verifyToken = require('../middleware/authMiddleware');
const { sequelize } = require('../models');
const { Op } = require('sequelize');
const { isAdmin, isDisabled } = require('../middleware/groupAuthMiddleware');


  // Create token
  const createToken = (user, req) => {
    const tokenPayload = {
      username: user.username,
      ip: req.ip,
      browser: (req.headers['user-agent'])
    };
    return jwt.sign(tokenPayload, secretKey, { expiresIn: '1h' });
    };


// Password validation
const validatePassword = (password) => {
    const minLength = 8;
    const maxLength = 10;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return (
      password.length >= minLength &&
      password.length <= maxLength &&
      hasLetter &&
      hasNumber &&
      hasSpecialChar
    );
  };

 
router.get('/', isAdmin,  async (req, res) => {
    try {
      const users = await User.findAll({
        include: {
          model: Group,
          through: UserGroup,
          as: 'groups'
        }
      });
  
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });


router.post('/register', verifyToken, isAdmin, async (req, res) => {
    const { username, email, password, groups } = req.body;
  
    try {
        if (!validatePassword(password)) {
          return res.status(400).json({ error: 'Password does not meet requirements' });
        }
        hashedPassword = await bcrypt.hash(password, 8);
  
        const newUser = await User.create({
            username: username,
            email: email,
            password: hashedPassword,
            groups: groups
          });
  
      if (groups) {
        const groupInstances = await Group.findAll({
          where: {
            name: { [Op.in]: groups }
          }
        });
  
        await newUser.setGroups(groupInstances);
      }
      await newUser.save();
      

      res.status(200).json({ message: 'User created successfully' });
    } catch (error) {
      console.error('Failed to update user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
});


router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [user] = await sequelize.query(`SELECT * FROM users WHERE username = '${username}'`);
       
        if (!user.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        const foundUser = user[0];
        if (foundUser.isDisabled) {
            return res.status(540).json({ error: 'Disabled' });
        }

        const validPassword = await bcrypt.compare(password, foundUser.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const token = createToken(foundUser, req);
        res.cookie('token', token, { httpOnly: false});
        res.status(200).json({ auth: true, token: token });
    } catch (err) {
        console.log('error:', err);
        res.status(500).json({ error: err });
    }
});

router.patch('/:username/disable', isAdmin, isDisabled, async (req, res) => {
    const username = req.params.username;
    await User.update({ isDisabled: true }, { where: { username: username } });
    res.json('User disabled');
});


router.patch('/:username/enable', isAdmin, isDisabled, async (req, res) => {
    const username = req.params.username;
    await User.update({ isDisabled: false }, { where: { username: username } });
    res.json('User enabled');
});


// Update email
router.put('/update-email', verifyToken, isDisabled, async (req, res) => {
    const username = req.username;
    const { newEmail } = req.body;
  
    try {
      await User.update({ email: newEmail }, { where: { username: username } });
      res.status(200).json({ message: 'Email updated successfully' });
    } catch (error) {
      console.error('Failed to update email:', error);
      res.status(500).json({ error: 'Failed to update email' });
    }
  });
  
  // Update password
  router.put('/update-password', verifyToken, isDisabled, async (req, res) => {
    const username = req.username;
    const { currentPassword, newPassword } = req.body;
  
    try {
      const user = await User.findOne({ where: { username: username } });
      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
      if (!validatePassword(newPassword)) {
        return res.status(400).json({ error: 'Password does not meet requirements' });
    }
      const hashedPassword = await bcrypt.hash(newPassword, 8);
      await User.update({ password: hashedPassword }, { where: { username: username } });
      res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Failed to update password:', error);
      res.status(500).json({ error: 'Failed to update password' });
    }
  });

  router.put('/update-groups', isAdmin, isDisabled, async (req, res) => {
    const { username, groups } = req.body;
    try {
      const user = await User.findOne({ where: { username } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      const groupInstances = await Group.findAll({
        where: {
          name: groups
        }
      });
  
      await user.setGroups(groupInstances);
  
      res.status(200).json({ message: 'User groups updated successfully' });
    } catch (error) {
      console.error('Failed to update user groups:', error);
      res.status(500).json({ error: 'Failed to update user groups' });
    }
  });

  router.put('/:username', isAdmin, isDisabled, async (req, res) => {
    const { username } = req.params;
    const { email, password, role, groups } = req.body;
  
    try {
      const user = await User.findOne({ where: { username } });
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      if (email) user.email = email;
      if (role) user.role = role;
      if (password) {
        if (!validatePassword(password)) {
          return res.status(400).json({ error: 'Password does not meet requirements' });
        }
        user.password = await bcrypt.hash(password, 8);
      }
  
      await user.save();
  
      if (groups) {
        const groupInstances = await Group.findAll({
          where: {
            name: { [Op.in]: groups }
          }
        });
  
        await user.setGroups(groupInstances);
      }
  
      res.status(200).json({ message: 'User updated successfully' });
    } catch (error) {
      console.error('Failed to update user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  });
  
  

 // Fetch user info
router.get('/profile', verifyToken, isDisabled, async (req, res) => {
    
    const username = req.username;
  
    try {
      const user = await User.findOne({ where: { username: username }, attributes: ['username', 'email', 'password'] });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.status(200).json(user);
    } catch (error) {
        if (error.response && error.response.status === 403 && error.response.data.message === 'Request failed with status code 403') {
            navigate('/disabled-account'); }
            else {
                console.error('Failed to fetch user info:', error);
                res.status(500).json({ error: 'Failed to fetch user info' });
            }
    }
  });


module.exports = router;
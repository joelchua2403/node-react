const express = require('express');
const router = express.Router();
const {  User, Group, UserGroup } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const secretKey = 'secretkey';
const verifyToken = require('../middleware/authMiddleware');
const { sequelize } = require('../models');
const { Op } = require('sequelize');

const isAdmin = (req, res, next) => {
    const token = req.headers['authorization'].split(' ')[1];
    const decoded = jwt.verify(token, secretKey);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };

  // Create token
  const createToken = (user, req) => {
    const tokenPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
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

 
router.get('/', verifyToken, async (req, res) => {
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

router.post('/register', async (req, res) => {
    const { username, password, email, role} = req.body;
    console.log(username, password, email, role);
    try {

        if (!validatePassword(password)) {
            return res.status(400).json({ error: 'Password does not meet requirements' });
        }
        const [existingUser] = await sequelize.query(`SELECT * FROM users WHERE username = '${username}'`);
        if (existingUser.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        const [existingEmail] = await sequelize.query(`SELECT * FROM users WHERE email = '${email}'`);
        if (existingEmail.length>0) {
            return res.status(400).json({ error: 'Email already exists' });
        }
    
    const hashedPassword = await bcrypt.hash(password, 8);
    const query = `
    INSERT INTO users (username, password, email, role, isDisabled)
    VALUES ('${username}', '${hashedPassword}', '${email}', '${role}', false)
  `;
  await sequelize.query(query, {
    replacements: { username, password: hashedPassword, email, role },
    type: sequelize.QueryTypes.INSERT,
  });
    res.json('User created');
} catch (error) {
    console.error('Failed to create user:', error);
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

router.patch('/:id/disable', isAdmin, async (req, res) => {
    const id = req.params.id;
    await User.update({ isDisabled: true }, { where: { id: id } });
    res.json('User disabled');
});

// Update email
router.put('/update-email', verifyToken, async (req, res) => {
    const userId = req.userId;
    const { newEmail } = req.body;
  
    try {
      await User.update({ email: newEmail }, { where: { id: userId } });
      res.status(200).json({ message: 'Email updated successfully' });
    } catch (error) {
      console.error('Failed to update email:', error);
      res.status(500).json({ error: 'Failed to update email' });
    }
  });
  
  // Update password
  router.put('/update-password', verifyToken, async (req, res) => {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;
  
    try {
      const user = await User.findOne({ where: { id: userId } });
      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
      if (!validatePassword(newPassword)) {
        return res.status(400).json({ error: 'Password does not meet requirements' });
    }
      const hashedPassword = await bcrypt.hash(newPassword, 8);
      await User.update({ password: hashedPassword }, { where: { id: userId } });
      res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Failed to update password:', error);
      res.status(500).json({ error: 'Failed to update password' });
    }
  });

  router.put('/update-groups', verifyToken, isAdmin, async (req, res) => {
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

  router.put('/:username', verifyToken, isAdmin, async (req, res) => {
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
router.get('/profile', verifyToken, async (req, res) => {
    const userId = req.userId;
  
    try {
      const user = await User.findOne({ where: { id: userId }, attributes: ['username', 'email', 'role', 'password'] });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.status(200).json(user);
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      res.status(500).json({ error: 'Failed to fetch user info' });
    }
  });


module.exports = router;
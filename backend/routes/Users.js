const express = require('express');
const router = express.Router();
const {  User } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const secretKey = 'secretkey';
const verifyToken = require('../middleware/authMiddleware');

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

  router.get('/',  async (req, res) => {
    const users = await User.findAll();
    res.json(users);
});

router.post('/register', async (req, res) => {
    const { username, password, email, role} = req.body;
    console.log(username, password, email, role);
    try {
        const existingUser = await User.findOne({ where: { username: username } });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        const existingEmail = await User.findOne({ where: { email: email } });
        if (existingEmail) {
            return res.status(400).json({ error: 'Email already exists' });
        }
    
    const hashedPassword = await bcrypt.hash(password, 8);
    await User.create({ username: username, password: hashedPassword, email: email, role: role, isDisabled: false});
    res.json('User created');
} catch (error) {
    console.error('Failed to create user:', error);
    res.status(500).json({ error: 'Failed to create user' });
}
});


router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ where: { username: username } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        if (user.isDisabled) {
            return res.status(540).json({ error: 'Disabled' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const token = createToken(user, req);
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
  
      const hashedPassword = await bcrypt.hash(newPassword, 8);
      await User.update({ password: hashedPassword }, { where: { id: userId } });
      res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Failed to update password:', error);
      res.status(500).json({ error: 'Failed to update password' });
    }
  });

 // Fetch user info
router.get('/profile', verifyToken, async (req, res) => {
    const userId = req.userId;
  
    try {
      const user = await User.findOne({ where: { id: userId }, attributes: ['username', 'email'] });
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
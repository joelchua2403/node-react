const express = require('express');
const router = express.Router();
const {  User } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const secretKey = 'secretkey';

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
    const hashedPassword = await bcrypt.hash(password, 8);
    await User.create({ username: username, password: hashedPassword, email: email, role: role, isDisabled: false});
    res.json('User created');
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


module.exports = router;
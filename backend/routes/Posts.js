const express = require('express');
const router = express.Router();
const { Post, User } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { where } = require('sequelize');
const Group = require('../models/Group');
const secretKey = 'secretkey'

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'].split(' ')[1];
    if (!token) {
        return res.status(401).json({ auth: false, message: 'No token provided' });
    }
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(500).json({ auth: false, message: 'Failed to authenticate token' });
        }
        req.userId = decoded.id;
        next();
    });
};

router.get("/" , async (req, res) => {
    try {
        const posts = await Post.findAll({where: {userId: req.userId}});
        res.json(posts);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err });
    }
    
});

router.get("/verifyToken", async (req, res) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.json({ auth: false });
    }
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.json({ auth: false });
        }
        res.json({ auth: true });
    });
});

router.post('/', verifyToken, async (req, res) => {
    try {
      const { title, content, userId, groupId, status } = req.body;
      console.log(title, content, userId);
      const post = await Post.create({ title, content, userId, groupId, status });
      res.json(post);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

router.delete("/:id" ,async (req, res) => {
    const id = req.params.id;
    await Post.destroy({where: {id: id}})
    res.json("Post deleted");
})

router.put("/:id" ,async (req, res) => {
    const id = req.params.id;
    const newPost = req.body;
    await Post.update(newPost, {where: {id: id}})
    res.json("Post updated");
})

router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    console.log(username, password);
    const hashedPassword = await bcrypt.hash(password, 8);
    await User.create({ username: username, password: hashedPassword });
    res.json('User created');
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username: username } });
    if (!user) {
        return res.json({ error: 'Invalid username or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        return res.json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ username: user.username }, secretKey, { expiresIn: '1h' });
    res.status(200).send({ auth: true, token: token });
});

module.exports = router;
require('dotenv').config();
const express = require('express');
const http = require('http');
const logger = require('./middleware/logger');
const app = express();
const { initializeWebSocket, broadcast } = require('./middleware/websocket');
const verifyToken = require('./middleware/authMiddleware');
const { isDisabled } = require('./middleware/groupAuthMiddleware');
app.use(express.json());
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

const db = require('./models');

// Routes
app.use('/users', require('./routes/Users'));
app.use('/groups', verifyToken, isDisabled, require('./routes/Groups'));
app.use('/usergroups', verifyToken, isDisabled, require('./routes/UserGroups'));
app.use('/tasks', verifyToken, isDisabled, require('./routes/Tasks'));
app.use('/applications', verifyToken, isDisabled, require('./routes/Applications'));
app.use('/plans', verifyToken, isDisabled, require('./routes/Plans'));

const server = http.createServer(app);

initializeWebSocket(server);

db.sequelize.sync().then(() => {
  server.listen(3001, () => {
    console.log('Server is running on port 3001');
    logger.info('Server is running on port 3001');
  });
});


const express = require('express');
const app = express();
const verifyToken = require('./middleware/authMiddleware');
app.use(express.json());
const cors = require('cors');
app.use(cors(
  {
    origin: 'http://localhost:3000',
    credentials: true
  }
));


const db = require('./models');

// Routes
app.use('/users', require('./routes/Users'));
app.use('/groups',verifyToken, require('./routes/Groups'));
app.use('/usergroups',verifyToken, require('./routes/UserGroups'));
app.use('/tasks',verifyToken, require('./routes/Tasks'));
app.use('/applications',verifyToken, require('./routes/Applications'));
app.use('/plans',verifyToken, require('./routes/Plans'));





db.sequelize.sync().then(() => {
app.listen(3001, () => {
  console.log('Server is running on port 3001');
})
});
const express = require('express');
const app = express();
app.use(express.json());
const cors = require('cors');
app.use(cors());

const db = require('./models');

// Routes
const postRouter = require('./routes/Posts');
app.use('/posts', postRouter);
app.use('/users', require('./routes/Users'));
app.use('/groups', require('./routes/Groups'));
app.use('/usergroups', require('./routes/UserGroups'));






db.sequelize.sync().then(() => {
app.listen(3001, () => {
  console.log('Server is running on port 3001');
})
});
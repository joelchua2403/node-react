const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET_KEY;
const { Group, UserGroup, Application, User } = require('../models');


const isDisabled = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ auth: false, message: 'No token provided' });
  }

  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return res.status(401).json({ auth: false, message: 'Token format incorrect' });
  }

  const token = tokenParts[1];
  try {
    const decoded = jwt.verify(token, secretKey);
    const username = decoded.username;

    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isDisabled) {
      return res.status(403).json({ message: 'Account is disabled' });
    }

    req.username = username;
    next();
  } catch (error) {
    console.error('Failed to verify token or check user status:', error);
    return res.status(500).json({ auth: false, message: 'Failed to verify user status' });
  }
};


const CheckGroup = async (username, groupName) => {
  try {
    const userGroups = await UserGroup.findAll({
      where: { username },
      include: [{ model: Group, as: 'group', where: { name: groupName } }]
    });

    return userGroups.length > 0;
  } catch (error) {
    console.error('Error checking group membership:', error);
    return false;
  }
};

const isAdmin = async (req, res, next) => {
  try {
    const token = req.headers['authorization'].split(' ')[1];
    const decoded = jwt.verify(token, secretKey);
    const username = decoded.username;

    const isAdmin = await CheckGroup(username, 'admin');

    if (!isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    next();
  } catch (error) {
    console.error('Failed to check admin group:', error);
    res.status(500).json({ message: 'Failed to check admin group' });
  }
};

const isTaskOwner = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ auth: false, message: 'No token provided' });
  }

  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return res.status(401).json({ auth: false, message: 'Token format incorrect' });
  }
  const token = tokenParts[1];

  const Task_owner = req.body.Task_owner;
  try {
    const decoded = jwt.verify(token, secretKey);
    const username = decoded.username;
    const isTaskOwner = (username === Task_owner);
    if (!isTaskOwner) {
      return res.status(403).json({ message: 'You are not the Task Owner.' });
    }
    req.username = username;
    next();
  } catch (error) {
    console.error('Failed to verify token or check group:', error);
    return res.status(500).json({ auth: false, message: 'Failed to verify user in required group' });
  }
};

const verifyProjectLead = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ auth: false, message: 'No token provided' });
  }

  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return res.status(401).json({ auth: false, message: 'Token format incorrect' });
  }

  const token = tokenParts[1];
  try {
    const decoded = jwt.verify(token, secretKey);
    const username = decoded.username;

    const isProjectLead = await CheckGroup(username, 'project lead');
    if (!isProjectLead) {
      return res.status(403).json({ message: 'Access denied' });
    }

    req.username = username;
    next();
  } catch (error) {
    console.error('Failed to verify token or check group:', error);
    return res.status(500).json({ auth: false, message: 'Failed to verify user in required group' });
  }
};

const verifyGroup = (requiredPermission) => {
  return async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ auth: false, message: 'No token provided' });
    }

    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      return res.status(401).json({ auth: false, message: 'Token format incorrect' });
    }

    const token = tokenParts[1];
    try {
      const decoded = jwt.verify(token, secretKey);
      const username = decoded.username;
      const { Task_app_Acronym } = req.body;
      console.log('app_acronym:', Task_app_Acronym)

      const application = await Application.findOne({
        where: { App_Acronym: Task_app_Acronym },
        attributes: [
          'App_permit_Create', 'App_permit_Open', 'App_permit_toDoList',
          'App_permit_Doing', 'App_permit_Done'
        ]
      });
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      const groupToCheck = application[`App_permit_${requiredPermission}`];
      const isInGroup = await CheckGroup(username, groupToCheck);
  

      if (!isInGroup) {
        return res.status(403).json({ message: 'Access denied' });
      }

      req.username = username;
      next();
    } catch (error) {
      console.error('Failed to verify token or check group:', error);
      return res.status(500).json({ auth: false, message: 'Failed to verify user in required group' });
    }
  };
};

const verifyCreatePermission = verifyGroup('Create');
const verifyOpenPermission = verifyGroup('Open');
const verifyToDoListPermission = verifyGroup('toDoList');
const verifyDoingPermission = verifyGroup('Doing');
const verifyDonePermission = verifyGroup('Done');

  module.exports = { verifyProjectLead,  verifyCreatePermission,
    verifyOpenPermission,
    verifyToDoListPermission,
    verifyDoingPermission,
    verifyDonePermission,
    CheckGroup,
    isAdmin,
    isDisabled,
    isTaskOwner
  } ;
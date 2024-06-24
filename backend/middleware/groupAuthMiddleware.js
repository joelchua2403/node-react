const jwt = require('jsonwebtoken');
const secretKey = 'secretkey';
const { Group, UserGroup, Application } = require('../models');


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
  
        // Check if the user is in the 'project lead' group
        const userGroups = await UserGroup.findAll({
            where: { username },
            include: [{ model: Group, as: 'group', where: { name: 'project lead' } }]
        });
  
        if (userGroups.length === 0) {
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
      const { app_acronym } = req.body;

      // Fetch application permissions
      const application = await Application.findOne({
        where: { App_Acronym: app_acronym },
        attributes: [
          'App_permit_Create', 'App_permit_Open', 'App_permit_toDoList',
          'App_permit_Doing', 'App_permit_Done'
        ]
      });
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      // Determine the required group based on the task state
      let groupToCheck = application[`App_permit_${requiredPermission}`];

      // Check if the user is in the specified group
      const userGroups = await UserGroup.findAll({
        where: { username },
        include: [{ model: Group, as: 'group', where: { name: groupToCheck } }]
      });

      if (userGroups.length === 0) {
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
    verifyDonePermission} ;
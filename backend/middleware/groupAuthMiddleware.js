const jwt = require('jsonwebtoken');
const secretKey = 'secretkey';
const { Group, UserGroup } = require('../models');


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


const verifyGroup = (groupName) => {
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
  
        const groupToCheck = `${app_acronym}_${groupName}`;
  
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
  
  const verifyGroupProjectLead = verifyGroup('Pl');
  const verifyGroupProjectManager = verifyGroup('Pm');
  const verifyGroupDeveloperTeam = verifyGroup('Dt');
  
  module.exports = { verifyProjectLead, verifyGroupProjectLead, verifyGroupProjectManager, verifyGroupDeveloperTeam} ;
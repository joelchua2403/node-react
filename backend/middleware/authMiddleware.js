const jwt = require('jsonwebtoken');
const secretKey = 'secretkey';



const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ auth: false, message: 'No token provided' });
  }

  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return res.status(401).json({ auth: false, message: 'Token format incorrect' });
  }

  const token = tokenParts[1];
  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(500).json({ auth: false, message: 'Failed to authenticate token' });
    }

    req.username = decoded.username; // Ensure this matches your token payload
    next();
  });
};



module.exports = verifyToken;


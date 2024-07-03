// websocket.js
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET_KEY || 'your-secret-key';

const initializeWebSocket = (server) => {
    wss = new WebSocket.Server({ server });
  
    wss.on('connection', (ws) => {
      console.log('New client connected');
  
      ws.on('message', (message) => {
        console.log('Received message from client:', message);
        // Broadcast the received message to all connected clients
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      });
  
      ws.on('close', () => {
        console.log('Client disconnected');
      });
    });
  
    console.log('WebSocket server initialized');
  };

const authenticate = (request, cb) => {
  const urlParams = new URLSearchParams(request.url.split('?')[1]);
  const token = urlParams.get('token');
  if (!token) {
    return cb(false, 401, 'Unauthorized');
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return cb(false, 401, 'Unauthorized');
    }
    request.user = decoded;
    cb(true);
  });
};

const broadcast = (data) => {
    if (wss) {
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    } else {
      console.error('WebSocket server is not initialized');
    }
  };



module.exports = { authenticate, initializeWebSocket, broadcast};

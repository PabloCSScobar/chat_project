const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users');

const app = express();
const server = http.createServer(app);


// Set static folder
app.use(express.static(path.join(__dirname, 'public')));



server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

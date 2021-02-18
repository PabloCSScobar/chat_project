const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
var bodyParser = require('body-parser')
var cors = require('cors');
const formatMessage = require('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  isUsernameAvailable
} = require('./utils/users');

const app = express();
const server = http.createServer(app);

options={
  cors:true,
  origins:["http://localhost:4200", "http://localhost:3000"],
 }
 
const io = socketio(server, options);
// enable cors
app.use(cors());
app.use( bodyParser.json() ); 

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const AppName = 'ChatSGGW';

app.post('/auth', (req, res) => {
    console.log(req.body.username)
    if(isUsernameAvailable(req.body.username)) {
      return res.send({available: true});
    } else {
      return res.send({available: false});
    }
});






// Run when client connects
io.on('connection', socket => {
  console.log('nowy user ' + socket.id);
  socket.on('joinRoom', ({ username, room }) => {
    console.log('joinRoom ' + username + ' ' + room)
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Welcome current user
    socket.emit('message', formatMessage(AppName, 'Witamy na chacie!'));

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(AppName, `${user.username} dołączył do chatu`)
      );

    // Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  // Listen for chatMessage
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(AppName, `${user.username} opuścił chat`)
      );

      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });

   // Runs when client disconnects
   socket.on('leaveChat', () => {
     console.log("leaveChat");
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(AppName, `${user.username} opuścił chat`)
      );

      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

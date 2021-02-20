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
  isUsernameAvailable,
  randomChat,
  getAllUsers
} = require('./utils/users');

const app = express();
const server = http.createServer(app);


//ustawienia cors dla ws
options={
  cors:true,
  origins:["http://localhost:4200", "http://localhost:3000", "https://chat-sggw.netlify.app"],
 }
app.use(cors());
 
const io = socketio(server, options);

app.use( bodyParser.json() ); 


const AppName = 'ChatSGGW';


// weryfikacja czy wprowadzona nazwa użytkownika jest wolna
app.post('/auth', (req, res) => {
    console.log(req.body.username)
    if(isUsernameAvailable(req.body.username)) {
      return res.send({available: true});
    } else {
      return res.send({available: false});
    }
});


// polaczenie z klientem
io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    console.log('joinRoom ' + username + ' ' + room)
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Powitanie połączonego usera
    socket.emit('message', formatMessage(AppName, 'Witamy na chacie!'));

    // Wiadomość do pozostałych użytkowników na chacie w przypadku pojawienia się nowego usera
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(AppName, `${user.username} dołączył do chatu`)
      );

    // Przesłanie aktualnej listy użytkowników w pokoju i nazwy pokoju
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  // Nasluchiwanie wiadomości od użytkownika
  socket.on('chatMessage', msg => {
    console.log("allusers", getAllUsers())
    const user = getCurrentUser(socket.id);
    if(user) {
      io.to(user.room).emit('message', formatMessage(user.username, msg));
    }
  });


  // rozpoczęcie nowego chatu
  socket.on('randomChat', username => {
    const ruser = randomChat(socket.id, username );
    const user = userJoin(socket.id, username, ruser.room);
    socket.join(user.room);

    // W przypadku, gdy w pokoju jest jedna osoba, wysłanie wiadomości do oczekującego użytkownika
    if(ruser.status == 'waiting') {
      socket.emit('message', formatMessage(AppName, 'Trwa łączenie z losowym użytkownikiem...'));
    }
    // Jeśli do losowego chatu połączy się druga osoba, wysłanie powitalnej wiadomości do obu użytkowników
    if(ruser.status == 'connected') {
      io.to(user.room).emit('message', formatMessage(AppName, 'Połączono z losowym użytkownikiem. Przywitaj się :) '));
    }
  });

  // Uruchomienie po rozłączeniu się użytkownika ( w przypadku zamknięcia przeglądarki)
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);
    // wiadomość do użytkowników w pokoju o opuszczeniu użytkownika
    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(AppName, `${user.username} opuścił chat`)
      );

      // aktualizacja aktualnej listy użytkowników
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });

   //Uruchomienie po rozłączeniu się użytkownika ( w przypadku ręcznego wyjścia z pokoju)
   socket.on('leaveChat', () => {

    const user = userLeave(socket.id);
    // wiadomość do użytkowników w pokoju o opuszczeniu użytkownika
    if (user) {
      socket.broadcast.to(user.room).emit(
        'message',
        formatMessage(AppName, `${user.username} opuścił chat`)
      );

      // aktualizacja aktualnej listy użytkowników
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });


   //Uruchomienie po rozłączeniu się drugiego użytkownika z randomChatu
   socket.on('leaveRandomChatSecondUser', () => {
    userLeave(socket.id);
  });

   //Uruchomienie po rozłączeniu się pierwszego użytkownika z randomChatu
   socket.on('leaveRandomChat', () => {
    const user = userLeave(socket.id);
    // wiadomość do drugiego użytkownika 
    if (user) {
      socket.broadcast
      .to(user.room).emit('leaveRandom', formatMessage(AppName, `Użytkownik ${user.username} rozłączył się. Rozpocznij nowa rozmowę lub przejdź do strony głównej.`));
    }
  });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

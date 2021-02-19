const users = [];
let randomUser = null;

function userJoin(id, username, room) {
  const user = { id, username, room };

  users.push(user);

  return user;
}

function randomChat(id, username) {
  if(randomUser == null || randomUser.id == id) {
    const room = new Date().valueOf()
    randomUser = {id, username, room, status: 'waiting'}
    return randomUser;
  } else {
    res = {...randomUser, status: 'connected'}
    randomUser = null;
    return res;
  }
}

function getCurrentUser(id) {
  return users.find(user => user.id === id);
}


function userLeave(id) {
  const index = users.findIndex(user => user.id === id);
  if (randomUser !=null && randomUser.id ==id) {
    randomUser = null;
  }
  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
}

function isUsernameAvailable(username) {
  const index = users.findIndex(user => user.username === username);
  if (index !== -1) {
    return false;
  } else {
    return true;
  }
}

function getRoomUsers(room) {
  return users.filter(user => user.room === room);
}

function getAllUsers() {
  return users;
}
module.exports = {
  getAllUsers,
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  isUsernameAvailable,
  randomChat
};

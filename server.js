const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.get('/', (req, res) => res.send('RPG Server is Running!'));

const players = {};

io.on('connection', (socket) => {
  socket.on('playerInit', (data) => {
    players[socket.id] = { id: socket.id, ...data };
    socket.emit('currentPlayers', players);
    socket.broadcast.emit('playerJoined', players[socket.id]);
  });

  socket.on('playerMove', (data) => {
    if (players[socket.id]) {
      Object.assign(players[socket.id], data);
      socket.broadcast.emit('playerMoved', { id: socket.id, ...data });
    }
  });

  socket.on('playerAttack', () => {
    socket.broadcast.emit('playerAttacked', socket.id);
  });

  socket.on('pvpChallenge', (targetId) => {
    const sender = players[socket.id];
    const others = Object.keys(players).filter(id => id !== socket.id);
    const to = targetId || others[0];
    if (to) io.to(to).emit('pvpInvite', { fromId: socket.id, fromName: sender ? sender.name : 'Игрок' });
  });

  socket.on('pvpResponse', ({ fromId, accepted }) => {
    if (accepted) {
      io.to(fromId).emit('teleportArena', { x: 1200, y: 101.5, z: -735 });
      socket.emit('teleportArena', { x: 1200, y: 101.5, z: -745 });
    }
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('playerLeft', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server on port ${PORT}`));

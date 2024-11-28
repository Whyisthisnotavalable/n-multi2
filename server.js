const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  pingTimeout: 5000,
  pingInterval: 2500,
});
const { performance } = require("perf_hooks");
app.use(express.static("public"));
const players = new Map();
const bullets = [];
io.on("connection", (socket) => {
  console.log("A player has connected:", socket.id);

  players.set(socket.id, {
    id: socket.id,
    pl: {
      pos: { x: 0, y: 0 },
      angle: 0,
      walk_cycle: 0,
      Vx: 0,
      onGround: false,
      hip: { x: 0, y: 0 },
      knee: { x: 0, y: 0 },
      foot: { x: 0, y: 0 },
      yOff: 0,
      height: 0,
      fillColor: "white",
      bodyGradient: "white",
      fillStyle: "white",
      flipLegs: 1,
      stepSize: 0,
      legLength1: 0,
      legLength2: 0,
      velocity: { x: 0, y: 0 },
      isCrouch: false,
    },
  });
  socket.on("change", (data) => {
    const { id, pl } = data;
    if (id === socket.id) {
      players.set(socket.id, { id, pl });
    }
  });
  socket.on("bulletChange", (data) => {
    const { bullets: clientBullets, id } = data;

    for (let i = bullets.length - 1; i >= 0; i--) {
      if (bullets[i].id === id) {
        bullets.splice(i, 1);
      }
    }

    clientBullets.forEach((bullet) => {
      bullets.push({ ...bullet, id });
    });
  });

  socket.on("requestBodyDeletionServerSide", (id) => {
    io.emit("removeBody", id);
  });
  socket.on("disconnect", () => {
    console.log("A player has disconnected:", socket.id);
    players.delete(socket.id);
    io.emit("playerDisconnected", socket.id);
  });
});
setInterval(() => {
  const serializedPlayers = Object.fromEntries(players);
  io.emit("playerPositions", serializedPlayers);
  const serializedBullets = bullets.map(bullet => ({
      type: bullet.type,
      position: { x: bullet.position.x, y: bullet.position.y },
      // velocity: { x: bullet.velocity.x, y: bullet.velocity.y },
      vertices: bullet.vertices.map(vertex => ({ x: vertex.x, y: vertex.y }))
    }));
    console.log(bullets + ", " + serializedBullets);
    io.emit("updateBullets", serializedBullets);
}, 1000 / 60);
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

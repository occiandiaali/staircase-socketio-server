// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");
// const cors = require("cors");

// const app = express();
// app.use(cors());

// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//   },
// });
// // In-memory player state per room: { socketId: { username, gender, networth, x, y, z, yaw, room } }
// const rooms = {};

// io.on("connection", (socket) => {
//   console.log(`[Connect] Client connected: ${socket.id}`);
//   socket.on("joinRoom", ({ roomName, username, gender, networth }) => {
//     socket.join(roomName);

//     if (!rooms[roomName]) rooms[roomName] = {};

//     const playerData = {
//       id: socket.id,
//       username: username || "VoxelHero",
//       gender: gender || "male",
//       networth: parseFloat(networth) || 100.0,
//       x: roomName === "lobby" ? (Math.random() - 0.5) * 6 : 0,
//       y: roomName === "lobby" ? 0 : 1.0,
//       z: roomName === "lobby" ? (Math.random() - 0.5) * 6 : 0,
//       yaw: 0,
//     };
//     rooms[roomName][socket.id] = playerData;
//     socket.currentRoom = roomName;

//     // Send existing players in this room to the new joining player
//     socket.emit("currentPlayers", rooms[roomName]);

//     // Notify other players in the same room
//     socket.to(roomName).emit("playerJoined", playerData);
//     console.log(
//       `[Join] ${playerData.username} (${socket.id}) joined ${roomName}`,
//     );
//   });
//   socket.on("updatePosition", (data) => {
//     const r = socket.currentRoom;
//     if (r && rooms[r] && rooms[r][socket.id]) {
//       const p = rooms[r][socket.id];
//       p.x = data.x;
//       p.y = data.y;
//       p.z = data.z;
//       p.yaw = data.yaw;

//       socket.to(r).emit("playerMoved", {
//         id: socket.id,
//         x: p.x,
//         y: p.y,
//         z: p.z,
//         yaw: p.yaw,
//       });
//     }
//   });
//   socket.on("speech", (data) => {
//     const r = socket.currentRoom;
//     if (r) {
//       io.to(r).emit("speechBubble", {
//         id: socket.id,
//         text: data.text,
//       });
//     }
//   });
//   socket.on("disconnect", () => {
//     const r = socket.currentRoom;
//     if (r && rooms[r] && rooms[r][socket.id]) {
//       delete rooms[r][socket.id];
//       io.to(r).emit("playerLeft", socket.id);
//       console.log(`[Disconnect] Client ${socket.id} left ${r}`);
//     }
//   });
// });

// const PORT = process.env.PORT || 3000;
// server.listen(PORT, () => {
//   console.log(`🚀 Staircase Socket.io Server running on port ${PORT}`);
// });
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// In-memory player state per room: { socketId: { id, username, gender, wallet, x, y, z, yaw } }
const rooms = {};

io.on("connection", (socket) => {
  console.log(`[Connect] Client connected: ${socket.id}`);

  socket.on(
    "joinRoom",
    ({ roomName, username, gender, wallet, avatar_data }) => {
      socket.join(roomName);

      if (!rooms[roomName]) rooms[roomName] = {};

      const playerData = {
        id: socket.id,
        username: username || "Tycoon",
        gender: gender || "male",
        wallet: parseFloat(wallet) || 100.0,
        avatar_data: avatar_data || {},
        x: (Math.random() - 0.5) * 6,
        y: 0,
        z: (Math.random() - 0.5) * 6,
        yaw: 0,
      };

      rooms[roomName][socket.id] = playerData;
      socket.currentRoom = roomName;

      // Send existing players in this room to the new joining player
      socket.emit("currentPlayers", rooms[roomName]);

      // Notify other players in the same room
      socket.to(roomName).emit("playerJoined", playerData);
      console.log(
        `[Join] ${playerData.username} (${socket.id}) joined ${roomName}`,
      );
    },
  );

  socket.on("updatePosition", (data) => {
    const r = socket.currentRoom;
    if (r && rooms[r] && rooms[r][socket.id]) {
      const p = rooms[r][socket.id];
      p.x = data.x;
      p.y = data.y;
      p.z = data.z;
      p.yaw = data.yaw;

      socket.to(r).emit("playerMoved", {
        id: socket.id,
        x: p.x,
        y: p.y,
        z: p.z,
        yaw: p.yaw,
      });
    }
  });

  // Targeted/Filtered Speech / Chat handler
  socket.on("speech", (data) => {
    const r = socket.currentRoom;
    if (r && rooms[r] && rooms[r][socket.id]) {
      const sender = rooms[r][socket.id];
      const text = data.text || "";
      const lowerText = text.toLowerCase();

      // Check if any other player in the room is mentioned by username in the text
      let targetSocketId = null;
      for (const [id, player] of Object.entries(rooms[r])) {
        if (
          id !== socket.id &&
          lowerText.includes(player.username.toLowerCase())
        ) {
          targetSocketId = id;
          break; // Target the first mentioned player
        }
      }

      const speechPayload = {
        id: socket.id,
        username: sender.username,
        text: text,
      };

      if (targetSocketId) {
        // Send ONLY to the sender and the specifically targeted user
        socket.emit("speechBubble", speechPayload);
        io.to(targetSocketId).emit("speechBubble", speechPayload);
      } else {
        // Broadcast to everyone in the room if no specific user is targeted
        io.to(r).emit("speechBubble", speechPayload);
      }
    }
  });

  socket.on("disconnect", () => {
    const r = socket.currentRoom;
    if (r && rooms[r] && rooms[r][socket.id]) {
      delete rooms[r][socket.id];
      io.to(r).emit("playerLeft", socket.id);
      console.log(`[Disconnect] Client ${socket.id} left ${r}`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Socket.io Signal Server running on port ${PORT}`);
});

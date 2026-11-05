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
// const io = new Server(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//   },
// });
const io = new Server(server, {
  cors: {
    origin: ["https://makemoney.occiandiaali.com", "http://localhost"], // Add your live domain
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// In-memory player state per room: { socketId: { id, username, gender, wallet, x, y, z, yaw } }
const rooms = {};

io.on("connection", (socket) => {
  console.log(`[Connect] Client connected: ${socket.id}`);

  // socket.on(
  //   "joinRoom",
  //   ({
  //     roomName,
  //     userId,
  //     username,
  //     gender,
  //     wallet,
  //     target_amt,
  //     deadline,
  //     avatar_data,
  //   }) => {
  //     socket.join(roomName);

  //     if (!rooms[roomName]) rooms[roomName] = {};

  //     const playerData = {
  //       id: socket.id,
  //       userId: userId || null,
  //       username: username || "Tycoon",
  //       gender: gender || "male",
  //       wallet: parseFloat(wallet) || 100.0,
  //       target_amt: parseFloat(target_amt) || 0.0,
  //       deadline: deadline || null,
  //       avatar_data: avatar_data || {},
  //       x: (Math.random() - 0.5) * 6,
  //       y: 0,
  //       z: (Math.random() - 0.5) * 6,
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
  //   },
  // );
  // Inside server.js -> socket.on("joinRoom", (data) => { ... })
  socket.on("joinRoom", (data) => {
    const {
      roomName,
      userId,
      username,
      gender,
      wallet,
      target_amt,
      deadline,
      avatar_data,
    } = data;
    socket.join(roomName);

    if (!rooms[roomName]) rooms[roomName] = {};

    const playerData = {
      id: socket.id,
      userId: userId || socket.id, // <-- Safe fallback if undefined
      username: username || "Tycoon",
      gender: gender || "male",
      wallet: parseFloat(wallet) || 100.0,
      target_amt: parseFloat(target_amt) || 0.0,
      deadline: deadline || null,
      avatar_data: avatar_data || {},
      x: (Math.random() - 0.5) * 6,
      y: 0,
      z: (Math.random() - 0.5) * 6,
      yaw: 0,
    };

    rooms[roomName][socket.id] = playerData;
    socket.currentRoom = roomName;

    socket.emit("currentPlayers", rooms[roomName]);
    socket.to(roomName).emit("playerJoined", playerData);
    console.log(
      `[Join] ${playerData.username} (${socket.id}) joined ${roomName}`,
    );
  });

  socket.on("updatePosition", (data) => {
    const r = socket.currentRoom;
    if (r && rooms[r] && rooms[r][socket.id]) {
      const p = rooms[r][socket.id];
      p.x = data.x;
      p.y = data.y;
      p.z = data.z;
      p.yaw = data.yaw;
      p.isMoving = data.isMoving || false;

      socket.to(r).emit("playerMoved", {
        id: socket.id,
        x: p.x,
        y: p.y,
        z: p.z,
        yaw: p.yaw,
        isMoving: p.isMoving,
      });
    }
  });

  // Listen for energy updates from clients and broadcast to others in the room
  socket.on("updateEnergy", (data) => {
    const r = socket.currentRoom;
    if (r && rooms[r] && rooms[r][socket.id]) {
      rooms[r][socket.id].energy = data.energy;
      socket.to(r).emit("playerEnergyUpdated", {
        id: socket.id,
        energy: data.energy,
      });
    }
  });

  // Handle real-time money transfer broadcasts
  socket.on("transferCompleted", (data) => {
    const r = socket.currentRoom;
    if (r && rooms[r]) {
      // Update sender wallet in room state
      if (rooms[r][socket.id]) {
        rooms[r][socket.id].wallet = data.newSenderWallet;
      }

      // Find recipient in the room and update their wallet in room state
      for (const sId in rooms[r]) {
        if (
          rooms[r][sId].username.toLowerCase() ===
          data.recipientUsername.toLowerCase()
        ) {
          rooms[r][sId].wallet = data.recipientNewWallet;
          // Notify the recipient directly
          io.to(sId).emit("walletUpdated", {
            newWallet: data.recipientNewWallet,
          });
          break;
        }
      }

      // Broadcast room-wide wallet sync so remote HUDs update instantly
      io.to(r).emit("roomWalletsSynced", {
        senderId: socket.id,
        senderWallet: data.newSenderWallet,
        recipientUsername: data.recipientUsername,
        recipientWallet: data.recipientNewWallet,
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

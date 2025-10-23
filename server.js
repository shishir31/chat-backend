const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const dotenv = require("dotenv");

const { connectDB, PORT } = require("./config");

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const chatRoutes = require("./routes/chats");
const messageRoutes = require("./routes/messages");

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);

// Create HTTP server + socket.io
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // Track online users
  socket.on("addUser", (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
  });

  // Join chat room
  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
    console.log(`Socket ${socket.id} joined chat ${chatId}`);
  });

  // Send message to all users in the room including sender
  socket.on("sendMessage", (data) => {
    const { chatId, senderId, text, file } = data;
    io.to(chatId).emit("receiveMessage", { chatId, senderId, text, file: file || null });
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
    for (let [userId, sId] of onlineUsers.entries()) {
      if (sId === socket.id) onlineUsers.delete(userId);
    }
    io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
  });
});

server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const { MONGO_URI, PORT } = require("./config");

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const chatRoutes = require("./routes/chats");
const messageRoutes = require("./routes/messages");

const app = express();

// 🧩 Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // serve uploaded files

// 🧩 API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);

// 🧩 MongoDB connection
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));

// 🧩 Create server + socket.io setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

let onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // Add user when they log in
  socket.on("addUser", (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
  });

  // Typing indicator
  socket.on("typing", ({ chatId, senderId }) => {
    socket.to(chatId).emit("typing", { chatId, senderId });
  });

  // Send message
  socket.on("sendMessage", (data) => {
    const { chatId, senderId, text, file } = data;
    io.to(chatId).emit("receiveMessage", { chatId, senderId, text, file });
  });

  // Join specific chat room
  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
    for (let [userId, sId] of onlineUsers.entries()) {
      if (sId === socket.id) onlineUsers.delete(userId);
    }
    io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
  });
});

// 🧩 Start the backend server
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
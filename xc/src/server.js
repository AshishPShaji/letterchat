const app = require("./app");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Connect to MongoDB with fallback URI if the env variable is missing
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/letterchat";

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Store connected users
const connectedUsers = new Map();

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  
  let userData = null;
  
  // User setup
  socket.on("setup", (userInfo) => {
    if (userInfo && userInfo._id) {
      userData = userInfo;
      socket.join(userInfo._id);
      connectedUsers.set(userInfo._id, socket.id);
      socket.emit("connected");
      console.log(`User ${userInfo._id} setup complete`);
    }
  });

  // Join chat
  socket.on("join_chat", (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat: ${chatId}`);
    socket.emit("joined_chat", chatId);
  });

  // New message
  socket.on("new_message", (message) => {
    const chat = message.chat;
    if (!chat.users) return console.log("Chat users not defined");

    chat.users.forEach((user) => {
      if (user._id === message.sender._id) return;
      socket.to(user._id).emit("message_received", message);
    });
  });

  // Typing indicators with username
  socket.on("typing", (data) => {
    console.log(`User ${data.username} is typing in chat ${data.chatId}`);
    socket.to(data.chatId).emit("typing", { username: data.username });
  });

  socket.on("stop_typing", (chatId) => {
    socket.to(chatId).emit("stop_typing");
    console.log(`User stopped typing in chat ${chatId}`);
  });

  // Message read status
  socket.on("read_messages", (chatId) => {
    console.log("Messages read in chat:", chatId, "by user:", userData?._id);
    socket.to(chatId).emit("messages_read", {
      chatId,
      userId: userData?._id
    });
  });

  // Message delivered status
  socket.on("deliver_messages", (chatId) => {
    console.log("Messages delivered in chat:", chatId, "to user:", userData?._id);
    socket.to(chatId).emit("messages_delivered", {
      chatId,
      userId: userData?._id
    });
  });

  // Test event
  socket.on("test", () => {
    console.log("Test event received from:", socket.id);
    socket.emit("test_response", { message: "Test successful!" });
  });

  // Handle message deletion
  socket.on("delete_message", (data) => {
    const { messageId, chatId } = data;
    console.log(`Message ${messageId} deleted in chat ${chatId}`);
    socket.to(chatId).emit("message_deleted", {
      messageId,
      chat: chatId
    });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    
    // Remove from connected users
    if (userData) {
      connectedUsers.delete(userData._id);
    }
  });
});

// Global socket access for other modules
global.io = io;
global.connectedUsers = connectedUsers;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    // Start the server after successful database connection
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Socket.io server ready for connections`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });

import { io, Socket } from "socket.io-client";
import { showNotification, requestNotificationPermission } from "./notificationService.tsx";

let socket: Socket | null = null;
let socketInitialized = false;

export const connectSocket = (user: any) => {
  if (!socketInitialized && user) {
    try {
      // Request notification permission when connecting socket
      requestNotificationPermission();
      
      socket = io("http://localhost:5000", {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      socket.on("connect", () => {
        console.log("Socket connected successfully:", socket?.id);
        // Setup socket with user data
        socket?.emit("setup", user);
      });

      socket.on("connected", () => {
        console.log("Socket setup complete");
        socketInitialized = true;
      });

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });

      socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        socketInitialized = false;
      });

      // Debug event
      socket.on("test_response", (data) => {
        console.log("Test response received:", data);
        showNotification("Socket Test", "Connection successful!", "System");
      });
    } catch (error) {
      console.error("Socket initialization error:", error);
    }
  }

  return socket;
};

// Test if socket connection is working
export const testSocketConnection = () => {
  if (socket?.connected) {
    socket.emit("test");
    return true;
  }
  return false;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    socketInitialized = false;
  }
};

export const joinChatRoom = (chatId: string) => {
  if (socket?.connected && chatId) {
    console.log("Joining chat room:", chatId);
    socket.emit("join_chat", chatId);
  } else {
    console.log("Cannot join chat: Socket not connected");
  }
};

export const sendTypingIndicator = (chatId: string, username: string) => {
  if (socket?.connected && chatId) {
    console.log("Sending typing indicator for:", username);
    socket.emit("typing", { chatId, username });
  }
};

export const stopTypingIndicator = (chatId: string) => {
  if (socket?.connected && chatId) {
    socket.emit("stop_typing", chatId);
  }
};

export const sendReadReceipt = (chatId: string) => {
  if (socket?.connected && chatId) {
    console.log("Sending read receipt for chat:", chatId);
    socket.emit("read_messages", chatId);
  }
};

export const sendDeliveryReceipt = (chatId: string) => {
  if (socket?.connected && chatId) {
    console.log("Sending delivery receipt for chat:", chatId);
    socket.emit("deliver_messages", chatId);
  }
};

export const subscribeToMessages = (callback: (message: any) => void) => {
  if (socket) {
    // Remove any existing listeners to prevent duplicates
    socket.off("new_message");
    socket.off("message_received");
    
    // Add new listeners
    socket.on("new_message", (message) => {
      console.log("New message received:", message);
      callback(message);
    });
    
    socket.on("message_received", (message) => {
      console.log("Message received:", message);
      callback(message);
    });
  }
};

export const subscribeToNotifications = (callback: (notification: any) => void) => {
  if (socket) {
    // Remove any existing listener
    socket.off("notification");
    
    socket.on("notification", (notification) => {
      console.log("Notification received:", notification);
      const { message } = notification;
      
      // Show notification with profile picture if available
      showNotification(
        message.chat.isGroupChat ? message.chat.chatName : message.sender.name,
        message.content,
        message.sender.name,
        message.sender.profilePic
      );
      
      // Pass to callback
      callback(notification);
    });
  }
};

export const subscribeToTyping = (callback: (data: { username: string }) => void) => {
  if (socket) {
    // Remove any existing listener
    socket.off("typing");
    
    socket.on("typing", (data) => {
      console.log("Typing indicator received:", data);
      callback(data);
    });
  }
};

export const subscribeToStopTyping = (callback: () => void) => {
  if (socket) {
    // Remove any existing listener
    socket.off("stop_typing");
    
    socket.on("stop_typing", () => {
      console.log("Stop typing indicator received");
      callback();
    });
  }
};

export const subscribeToMessageRead = (callback: (data: { chatId: string, userId: string }) => void) => {
  if (socket) {
    // Remove any existing listener
    socket.off("messages_read");
    
    socket.on("messages_read", (data) => {
      console.log("Messages read:", data);
      callback(data);
    });
  }
};

export const subscribeToMessageDelivered = (callback: (data: { chatId: string, userId: string }) => void) => {
  if (socket) {
    // Remove any existing listener
    socket.off("messages_delivered");
    
    socket.on("messages_delivered", (data) => {
      console.log("Messages delivered:", data);
      callback(data);
    });
  }
};

export const subscribeToMessageDeletion = (callback: (data: { messageId: string, chat: string }) => void) => {
  if (socket) {
    // Remove any existing listener
    socket.off("message_deleted");
    
    socket.on("message_deleted", (data) => {
      console.log("Message deleted:", data);
      callback(data);
    });
  }
};

export const getSocket = () => socket;

export const isSocketConnected = () => socket?.connected || false;

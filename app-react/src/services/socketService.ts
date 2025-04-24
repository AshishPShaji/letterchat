import { io, Socket } from "socket.io-client";
import { showNotification } from "./notificationService";

// Define proper types
interface User {
  _id: string;
  name: string;
  email: string;
  profilePic?: string;
}

interface Message {
  _id: string;
  sender: User;
  content: string;
  chat: {
    _id: string;
    chatName: string;
    isGroupChat: boolean;
    users: User[];
  };
  createdAt: string;
  updatedAt: string;
}

interface Notification {
  message: Message;
}

let socket: Socket | null = null;

export const connectSocket = (user: User) => {
  if (!socket) {
    socket = io("http://localhost:5000");
  }

  if (socket && user) {
    // Setup socket with user data
    socket.emit("setup", user);
    
    socket.on("connected", () => {
      console.log("Socket connected");
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinChatRoom = (chatId: string) => {
  if (socket && chatId) {
    socket.emit("join_chat", chatId);
  }
};

export const sendTypingIndicator = (chatId: string, username: string) => {
  if (socket && chatId) {
    socket.emit("typing", { chatId, username });
  }
};

export const stopTypingIndicator = (chatId: string) => {
  if (socket && chatId) {
    socket.emit("stop_typing", chatId);
  }
};

export const sendReadReceipt = (chatId: string) => {
  if (socket && chatId) {
    socket.emit("message_read", chatId);
  }
};

export const sendDeliveryReceipt = (chatId: string) => {
  if (socket && chatId) {
    socket.emit("message_delivered", chatId);
  }
};

export const subscribeToMessages = (callback: (message: Message) => void) => {
  if (socket) {
    socket.on("new_message", (message: Message) => {
      callback(message);
    });
  }
};

export const subscribeToNotifications = (callback: (notification: Notification) => void) => {
  if (socket) {
    socket.on("notification", (notification: Notification) => {
      const { message } = notification;
      
      // Show notification
      showNotification(
        message.chat.isGroupChat ? message.chat.chatName : message.sender.name,
        message.content,
        message.sender.name
      );
      
      // Pass to callback
      callback(notification);
    });
  }
};

export const subscribeToTyping = (callback: (data: { username: string }) => void) => {
  if (socket) {
    socket.on("typing", callback);
  }
};

export const subscribeToStopTyping = (callback: () => void) => {
  if (socket) {
    socket.on("stop_typing", callback);
  }
};

export const subscribeToMessageRead = (callback: (data: { chatId: string, userId: string }) => void) => {
  if (socket) {
    socket.on("message_read", callback);
  }
};

export const subscribeToMessageDelivered = (callback: (data: { chatId: string, userId: string }) => void) => {
  if (socket) {
    socket.on("message_delivered", callback);
  }
};

export const subscribeToMessageDeletion = (callback: (data: { messageId: string, chat: string }) => void) => {
  if (socket) {
    socket.on("message_deleted", callback);
  }
};

export const getSocket = () => socket;

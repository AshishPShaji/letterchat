
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

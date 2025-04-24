"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { 
  fetchAllChats, 
  fetchChat, 
  createGroupChat, 
  renameGroupChat,
  removeFromGroup,
  addToGroup,
  searchUsers, 
  sendMessage, 
  getMessages,
  deleteMessageForMe,
  deleteMessageForEveryone,
  markMessagesAsRead,
  markMessagesAsDelivered
} from "@/services/api";
import { 
  connectSocket, 
  disconnectSocket, 
  joinChatRoom, 
  subscribeToMessages, 
  subscribeToNotifications,
  subscribeToTyping,
  subscribeToStopTyping,
  sendTypingIndicator,
  stopTypingIndicator,
  sendReadReceipt,
  sendDeliveryReceipt,
  subscribeToMessageRead,
  subscribeToMessageDelivered,
  subscribeToMessageDeletion
} from "@/services/socketService";
import Link from "next/link";
import { toast } from "react-toastify";
import GroupChatModal from "@/components/GroupChatModal";
import FileUpload from "@/components/FileUpload";
import { FaEllipsisV, FaPaperPlane, FaSearch, FaTimes, FaCheck, FaCheckDouble, FaArrowLeft, FaPlus, FaTrashAlt, FaCopy, FaTrash, FaInfoCircle } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { MemoizedChildren } from '@/components/MemoizedComponent';
import UserAvatar from "@/components/UserAvatar";
import WhatsAppStyleMedia from "@/components/WhatsAppStyleMedia";

interface User {
  _id: string;
  name: string;
  email: string;
  profilePic: string;
  isAdmin?: boolean;
}

interface Chat {
  _id: string;
  chatName: string;
  isGroupChat: boolean;
  users: User[];
  groupAdmin?: User;
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  _id: string;
  sender: User;
  content: string;
  chat: Chat;
  createdAt: string;
  updatedAt: string;
  readBy?: string[];
  deliveredTo?: string[];
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
}

// Add a new component for message options
interface MessageOptionsProps {
  message: Message;
  onCopy: () => void;
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
  isOwnMessage: boolean;
}

const MessageOptions = ({ onCopy, onDeleteForMe, onDeleteForEveryone, isOwnMessage }: MessageOptionsProps) => {
  const [showOptions, setShowOptions] = useState(false);
  
  return (
    <div className="relative">
      <button 
        onClick={() => setShowOptions(!showOptions)}
        className="text-gray-400 hover:text-gray-600 p-1 rounded absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Message options"
      >
        <FaEllipsisV size={12} />
      </button>
      
      {showOptions && (
        <div className="absolute right-0 top-6 bg-white shadow-lg rounded-md py-1 z-10 w-48">
          <button
            onClick={() => {
              onCopy();
              setShowOptions(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
          >
            <FaCopy className="mr-2" size={14} />
            Copy Message
          </button>
          
          <button
            onClick={() => {
              onDeleteForMe();
              setShowOptions(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
          >
            <FaTrash className="mr-2" size={14} />
            Delete for me
          </button>
          
          {isOwnMessage && (
            <button
              onClick={() => {
                onDeleteForEveryone();
                setShowOptions(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
            >
              <FaTrashAlt className="mr-2" size={14} />
              Delete for everyone
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default function Chat() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatId = searchParams.get("id");
  
  // All state hooks
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [userSettings, setUserSettings] = useState({
    textMessageLengthLimit: 160,
    enforceLengthLimit: true
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // All ref hooks
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Add this message selection functionality
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  
  // Check if logged in, redirect if not
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      toast.error('Please log in to access the chat');
    }
  }, [user, loading, router]);

  // Fetch all chats on load - IMPORTANT: Do NOT use conditional hooks
  useEffect(() => {
    // Only execute the body of useEffect conditionally, not the useEffect itself
    if (user) {
      loadChats();
      // Connect to socket
      connectSocket(user);

      // Subscribe to notifications
      subscribeToNotifications(() => {
        // Update chats when a new message is received
        loadChats();
      });

      // Subscribe to message deletion
      subscribeToMessageDeletion((data: { messageId: string, chat: string }) => {
        setMessages((prevMessages) => 
          prevMessages.filter((m) => m._id !== data.messageId)
        );
      });

      // Subscribe to message read status
      subscribeToMessageRead((data: { chatId: string, userId: string }) => {
        if (selectedChat && selectedChat._id === data.chatId) {
          setMessages(prevMessages => 
            prevMessages.map(msg => {
              if (!msg.readBy?.includes(data.userId)) {
                return {
                  ...msg,
                  readBy: [...(msg.readBy || []), data.userId]
                };
              }
              return msg;
            })
          );
        }
      });

      // Subscribe to message delivered status
      subscribeToMessageDelivered((data: { chatId: string, userId: string }) => {
        if (selectedChat && selectedChat._id === data.chatId) {
          setMessages(prevMessages => 
            prevMessages.map(msg => {
              if (!msg.deliveredTo?.includes(data.userId)) {
                return {
                  ...msg,
                  deliveredTo: [...(msg.deliveredTo || []), data.userId]
                };
              }
              return msg;
            })
          );
        }
      });

      return () => {
        // Disconnect from socket
        disconnectSocket();
      };
    }
    // Empty return for when user is not available
    return () => {};
  }, [user, selectedChat]);

  // Fetch chat and messages when chat ID changes
  useEffect(() => {
    if (chatId && user) {
      loadChat(chatId);
    }
  }, [chatId, user]);

  // Subscribe to messages when selected chat changes
  useEffect(() => {
    if (selectedChat && user) {
      loadMessages();
      joinChatRoom(selectedChat._id);
      
      // Mark messages as delivered when entering chat
      markMessagesAsDelivered(selectedChat._id);
      sendDeliveryReceipt(selectedChat._id);
      
      // Set messages as read
      markMessagesAsRead(selectedChat._id);
      sendReadReceipt(selectedChat._id);
      
      // Subscribe to new messages
      subscribeToMessages((newMessage) => {
        if (newMessage.chat._id === selectedChat._id) {
          setMessages((prevMessages) => [...prevMessages, newMessage]);
          
          // Mark message as delivered
          markMessagesAsDelivered(selectedChat._id);
          sendDeliveryReceipt(selectedChat._id);
          
          // Mark message as read
          markMessagesAsRead(selectedChat._id);
          sendReadReceipt(selectedChat._id);
        }
      });
      
      // Subscribe to typing indicators
      subscribeToTyping((data: { username: string }) => {
        if (data.username !== user?.name) {
          setIsTyping(true);
          setTypingUser(data.username);
        }
      });
      
      subscribeToStopTyping(() => {
        setIsTyping(false);
      });
    }
  }, [selectedChat, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add useEffect to load user settings from localStorage
  useEffect(() => {
    // Load user settings from localStorage
    const loadUserSettings = () => {
      try {
        const settingsStr = localStorage.getItem("userSettings");
        if (settingsStr) {
          const settings = JSON.parse(settingsStr);
          setUserSettings({
            textMessageLengthLimit: settings.textMessageLengthLimit || 160,
            enforceLengthLimit: settings.enforceLengthLimit !== false
          });
        }
      } catch (error) {
        console.error("Error loading user settings:", error);
      }
    };
    
    loadUserSettings();
  }, []);

  const loadChats = async () => {
    try {
      setMessagesLoading(true);
      const data = await fetchAllChats();
      setChats(data);
      setMessagesLoading(false);
    } catch (error: any) {
      toast.error("Failed to load chats");
      console.error(error);
      setMessagesLoading(false);
    }
  };

  const loadChat = async (id: string) => {
    try {
      setMessagesLoading(true);
      const data = await fetchChat(id);
      setSelectedChat(data);
      setMessagesLoading(false);
    } catch (error) {
      toast.error("Failed to load chat");
      setMessagesLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!selectedChat) return;
    
    try {
      setMessagesLoading(true);
      const data = await getMessages(selectedChat._id);
      setMessages(data);
      setMessagesLoading(false);
      scrollToBottom();
    } catch (error) {
      toast.error("Failed to load messages");
      setMessagesLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    
    try {
      setIsSearching(true);
      console.log("Searching users with query:", searchQuery);
      const data = await searchUsers(searchQuery);
      console.log("Search results:", data);
      setSearchResults(data);
      setIsSearching(false);
    } catch (error) {
      console.error("Error searching for users:", error);
      toast.error('Error searching for users. Please try again.');
      setIsSearching(false);
    }
  };

  const createChat = async (userId: string) => {
    try {
      const data = await fetchChat(userId);
      setSelectedChat(data);
      router.push(`/chat?id=${data._id}`);
      setShowSearch(false);
      setSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      toast.error("Failed to create chat");
    }
  };

  const handleGroupCreation = async (users: User[], name: string) => {
    try {
      const data = await createGroupChat(users.map(u => u._id), name);
      setChats([data, ...chats]);
      setShowModal(false);
      router.push(`/chat?id=${data._id}`);
    } catch (error) {
      toast.error("Failed to create group chat");
    }
  };

  const handleRenameGroup = async (chatId: string, newName: string) => {
    try {
      const data = await renameGroupChat(chatId, newName);
      
      // Update chats list
      setChats(chats.map(c => c._id === chatId ? data : c));
      
      // Update selected chat if it's the renamed one
      if (selectedChat?._id === chatId) {
        setSelectedChat(data);
      }
      
      toast.success("Group renamed successfully");
    } catch (error) {
      toast.error("Failed to rename group");
    }
  };

  const handleRemoveUser = async (chatId: string, userId: string) => {
    try {
      const data = await removeFromGroup(chatId, userId);
      
      // If current user is removed, go back to chat list
      if (userId === user?._id) {
        setSelectedChat(null);
        router.push("/chat");
      } else {
        // Update chats list
        setChats(chats.map(c => c._id === chatId ? data : c));
        
        // Update selected chat if it's the modified one
        if (selectedChat?._id === chatId) {
          setSelectedChat(data);
        }
      }
      
      toast.success("User removed from group");
    } catch (error) {
      toast.error("Failed to remove user from group");
    }
  };

  const handleAddUser = async (chatId: string, userId: string) => {
    try {
      const data = await addToGroup(chatId, userId);
      
      // Update chats list
      setChats(chats.map(c => c._id === chatId ? data : c));
      
      // Update selected chat if it's the modified one
      if (selectedChat?._id === chatId) {
        setSelectedChat(data);
      }
      
      toast.success("User added to group");
    } catch (error) {
      toast.error("Failed to add user to group");
    }
  };

  const sendMessageHandler = async () => {
    if (message.trim() === "" && !selectedFile) return;
    
    // Check message length against user settings
    if (message.length > userSettings.textMessageLengthLimit && userSettings.enforceLengthLimit && !selectedFile) {
      toast.error(`Message cannot exceed ${userSettings.textMessageLengthLimit} characters based on your settings`);
      return;
    }
    
    if (!selectedChat) return;
    
    // Save local reference to the file to prevent race conditions
    const fileToSend = selectedFile;
    
    // Clear UI state immediately to make the app feel responsive
    setMessage("");
    setSelectedFile(null);
    
    try {
      // Show uploading toast for files
      let toastId: string | number | undefined;
      if (fileToSend) {
        const fileSize = (fileToSend.size / (1024 * 1024)).toFixed(1);
        const isVideo = fileToSend.type.startsWith('video/');
        
        toastId = toast.info(
          `Uploading ${isVideo ? 'video' : 'file'} (${fileSize} MB)...`, 
          { autoClose: false }
        );
      }
      
      // Make API call
      const data = await sendMessage(message, selectedChat._id, fileToSend || undefined);
      
      // Update UI with success
      if (toastId) {
        toast.update(toastId, { 
          type: 'success',
          render: "File uploaded successfully", 
          autoClose: 3000 
        });
      }
      
      setMessages(prevMessages => [...prevMessages, data as Message]);
      
      // Stop typing indicator when sending message
      stopTypingIndicator(selectedChat._id);
      
      // Refresh chats to update last message
      loadChats();
    } catch (error: unknown) {
      // Use specific error message if available, or fallback to generic one
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to send message";
      
      console.error("Send message error details:", error);
      toast.error(errorMessage);
      
      // Restore message and file if sending fails so user doesn't lose their input
      if (message) setMessage(message);
      if (fileToSend) setSelectedFile(fileToSend);
    }
  };

  const typingHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    if (!selectedChat) return;
    
    // If user is typing
    if (!typingTimeout.current) {
      sendTypingIndicator(selectedChat._id, user?.name || "");
      
      typingTimeout.current = setTimeout(() => {
        stopTypingIndicator(selectedChat._id);
        typingTimeout.current = null;
      }, 3000);
    } else {
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        if (selectedChat) {
          stopTypingIndicator(selectedChat._id);
        }
        typingTimeout.current = null;
      }, 3000);
    }
  };

  const deleteMessage = async (messageId: string, forEveryone: boolean) => {
    try {
      if (forEveryone) {
        await deleteMessageForEveryone(messageId);
      } else {
        await deleteMessageForMe(messageId);
        // Only remove from local messages if deleted just for me
        setMessages(messages.filter(m => m._id !== messageId));
      }
      setShowMessageMenu(false);
      toast.success("Message deleted");
    } catch (error) {
      toast.error("Failed to delete message");
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Message copied to clipboard");
    setShowMessageMenu(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (!showSearch) {
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  const getSenderName = (message: Message) => {
    return message.sender._id === user?._id ? "You" : message.sender.name;
  };

  const isSameSender = (messages: Message[], index: number) => {
    return (
      index > 0 &&
      messages[index].sender._id === messages[index - 1].sender._id
    );
  };

  // At the beginning of the component
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Add this message selection functionality
  const toggleMessageSelection = (messageId: string) => {
    if (selectedMessages.includes(messageId)) {
      setSelectedMessages(selectedMessages.filter(id => id !== messageId));
      // Exit selection mode if no messages are selected
      if (selectedMessages.length === 1) {
        setSelectionMode(false);
      }
    } else {
      setSelectedMessages([...selectedMessages, messageId]);
    }
  };

  const clearMessageSelection = () => {
    setSelectedMessages([]);
    setSelectionMode(false);
  };

  const handleBulkDelete = async (forEveryone: boolean) => {
    try {
      // Delete messages one by one
      for (const messageId of selectedMessages) {
        if (forEveryone) {
          await deleteMessageForEveryone(messageId);
        } else {
          await deleteMessageForMe(messageId);
        }
      }
      
      // Only remove locally deleted messages from UI
      if (!forEveryone) {
        setMessages(prev => prev.filter(m => !selectedMessages.includes(m._id)));
      }
      
      toast.success(`${selectedMessages.length} messages deleted`);
      clearMessageSelection();
    } catch (error) {
      toast.error("Failed to delete messages");
    }
  };

  // If loading or not logged in, show loading state
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Chat</h1>
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <MemoizedChildren>
      <div className="flex h-screen overflow-hidden bg-gray-100">
        {/* Sidebar */}
        <div className={`bg-white w-full md:w-80 flex-shrink-0 border-r ${selectedChat ? 'hidden md:flex' : 'flex'} flex-col`}>
          <div className="p-4 border-b flex justify-between items-center">
            <h1 className="text-xl font-medium">My Chats</h1>
            <div className="flex space-x-2">
              <button
                onClick={toggleSearch}
                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
              >
                <FaSearch />
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
              >
                <FaPlus />
              </button>
            </div>
          </div>
          
          {/* Search area */}
          {showSearch && (
            <div className="p-4 border-b">
              <div className="flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="w-full p-2 border rounded-l"
                />
                <button
                  onClick={handleSearch}
                  className="p-2 bg-blue-500 text-white rounded-r"
                  disabled={isSearching}
                >
                  <FaSearch />
                </button>
              </div>
              {searchResults.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto">
                  {searchResults.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => createChat(user._id)}
                      className="flex items-center p-2 hover:bg-gray-100 cursor-pointer rounded"
                    >
                      <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 mr-2">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Chats list */}
          <div className="flex-1 overflow-y-auto">
            {chats.map((chat) => (
              <Link
                key={chat._id}
                href={`/chat?id=${chat._id}`}
                className={`flex items-center p-4 border-b hover:bg-gray-50 transition-colors ${
                  selectedChat?._id === chat._id ? "bg-blue-50" : ""
                }`}
              >
                <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 mr-3">
                  {chat.isGroupChat
                    ? chat.chatName.charAt(0)
                    : chat.users.find((u) => u._id !== user?._id)?.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-gray-800 truncate">
                    {chat.isGroupChat
                      ? chat.chatName
                      : chat.users.find((u) => u._id !== user?._id)?.name}
                  </h2>
                  <p className="text-gray-500 text-sm truncate">
                    {chat.lastMessage?.content || "No messages yet"}
                  </p>
                </div>
                {chat.lastMessage && (
                  <span className="text-xs text-gray-400">
                    {formatTime(chat.lastMessage.createdAt)}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
        
        {/* Image Viewer Modal */}
        {selectedImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
            <button
              className="absolute top-4 right-4 text-white p-2 rounded-full bg-gray-800 hover:bg-gray-700"
              onClick={() => setSelectedImage(null)}
            >
              <IoClose size={24} />
            </button>
            <img
              src={selectedImage.startsWith('http') ? selectedImage : `/${selectedImage.replace(/^\//, '')}`}
              alt="Full size image"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${selectedChat ? 'flex' : 'hidden md:flex'}`}>
          {selectedChat ? (
            <>
              {/* Chat header */}
              <div className="bg-white p-4 border-b flex items-center">
                <button
                  onClick={() => {
                    setSelectedChat(null);
                    router.push("/chat");
                  }}
                  className="mr-3 md:hidden"
                >
                  <FaArrowLeft />
                </button>
                <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 mr-3">
                  {selectedChat.isGroupChat
                    ? selectedChat.chatName.charAt(0)
                    : selectedChat.users.find((u) => u._id !== user?._id)?.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold">
                    {selectedChat.isGroupChat
                      ? selectedChat.chatName
                      : selectedChat.users.find((u) => u._id !== user?._id)?.name}
                  </h2>
                  {isTyping && (
                    <div className="flex items-center text-sm text-gray-500">
                      <span>{typingUser} is typing</span>
                      <div className="typing-dot-animation ml-1">
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center">
                  {selectedChat.isGroupChat && (
                    <button
                      onClick={() => {/* Open group info */}}
                      className="p-2 text-gray-600 hover:text-gray-900"
                    >
                      <FaInfoCircle />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Messages container */}
              <div className="flex-1 overflow-y-auto p-4" ref={messagesContainerRef}>
                {/* Message selection toolbar */}
                {selectionMode && (
                  <div className="sticky top-0 z-10 flex justify-between items-center mb-2 p-2 bg-blue-100 rounded-md">
                    <div className="flex items-center">
                      <span className="font-medium">{selectedMessages.length} selected</span>
                      <button
                        onClick={clearMessageSelection}
                        className="ml-2 p-1 text-gray-600 hover:text-gray-800"
                        aria-label="Cancel selection"
                      >
                        <FaTimes />
                      </button>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleBulkDelete(false)}
                        className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                        aria-label="Delete for me"
                      >
                        <FaTrash size={14} />
                      </button>
                      <button
                        onClick={() => handleBulkDelete(true)}
                        className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                        aria-label="Delete for everyone"
                      >
                        <FaTrashAlt size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {messages.map((message, index) => {
                  const isOwnMessage = message.sender._id === user?._id;
                  const showSender = !isSameSender(messages, index);
                  
                  return (
                    <div
                      key={message._id}
                      className={`mb-4 ${isOwnMessage ? "flex flex-col items-end" : "flex flex-col items-start"}`}
                    >
                      {/* Sender Name (not shown for consecutive messages from same sender) */}
                      {showSender && !isOwnMessage && (
                        <span className="text-xs text-gray-500 ml-12 mb-1">{message.sender.name}</span>
                      )}
                      
                      {/* Message bubble */}
                      <div className="flex group items-end">
                        {/* Sender Avatar (only shown for first message or new sender) */}
                        {!isOwnMessage && showSender && (
                          <div className="mr-2 flex-shrink-0">
                            <UserAvatar name={message.sender.name} profilePic={message.sender.profilePic} size="sm" />
                          </div>
                        )}
                        
                        {/* Selection checkbox */}
                        {(selectionMode || message.sender._id === user?._id) && (
                          <div className={`mr-1 ${selectionMode ? 'block' : 'opacity-0 group-hover:opacity-100'}`}>
                            <input
                              type="checkbox"
                              checked={selectedMessages.includes(message._id)}
                              onChange={() => toggleMessageSelection(message._id)}
                              className="cursor-pointer"
                              onClick={(e) => {
                                if (!selectionMode) {
                                  setSelectionMode(true);
                                  // Don't toggle in this case, as we're entering selection mode
                                  e.preventDefault();
                                  setSelectedMessages([message._id]);
                                }
                              }}
                            />
                          </div>
                        )}
                        
                        {/* Message Content */}
                        <div 
                          className={`relative px-4 py-2 rounded-lg max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg group ${
                            isOwnMessage 
                              ? "bg-blue-500 text-white mr-2" 
                              : "bg-gray-200 text-gray-800 ml-2"
                          }`}
                        >
                          {/* Message Options Menu */}
                          <div className="absolute right-0 top-0 -mr-6 mt-1">
                            <MessageOptions 
                              message={message}
                              onCopy={() => copyMessage(message.content)}
                              onDeleteForMe={() => deleteMessage(message._id, false)}
                              onDeleteForEveryone={() => deleteMessage(message._id, true)}
                              isOwnMessage={isOwnMessage}
                            />
                          </div>
                          
                          {/* File Content */}
                          {message.fileUrl && (
                            <div className="mb-2">
                              <WhatsAppStyleMedia
                                fileUrl={message.fileUrl}
                                fileType={message.fileType || ''}
                                fileName={message.fileName || ''}
                                    onLoad={scrollToBottom}
                                isOwnMessage={isOwnMessage}
                              />
                            </div>
                          )}
                          
                          {/* Text Content */}
                          {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}
                          
                          {/* Timestamp and Read Status */}
                          <div className={`flex items-center mt-1 text-xs ${isOwnMessage ? "text-blue-100" : "text-gray-500"}`}>
                            <span>{formatTime(message.createdAt)}</span>
                            
                            {/* Only show read receipt for own messages and only one check mark */}
                            {isOwnMessage && (
                              <span className="ml-1">
                                {message.readBy && message.readBy.length > 0 ? (
                                  <FaCheckDouble size={12} />
                                ) : (
                                  <FaCheck size={12} />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex items-start mb-4">
                    <div className="flex-shrink-0 mr-2">
                      <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                    </div>
                    <div className="px-4 py-2 bg-gray-100 rounded-lg">
                      <div className="typing-dot-animation">
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <div className="dot"></div>
                      </div>
                      <div className="text-xs text-gray-500">{typingUser} is typing...</div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Message input */}
              <div className="bg-white border-t p-4">
                <div className="flex items-center">
                  <div className="flex flex-col w-full">
                    <div className="flex items-center px-3">
                      <input
                        type="text"
                        value={message}
                        onChange={typingHandler}
                        placeholder="Type a message..."
                        className="w-full p-2 rounded-full border focus:outline-none focus:border-blue-500"
                        maxLength={userSettings.enforceLengthLimit ? userSettings.textMessageLengthLimit : undefined}
                      />
                    </div>
                    <div className="px-3">
                      <FileUpload onFileSelect={(file) => setSelectedFile(file)} />
                    </div>
                  </div>
                  <button
                    onClick={sendMessageHandler}
                    className="ml-2 p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                  >
                    <FaPaperPlane />
                  </button>
                </div>
                {message.length > 0 && (
                  <div className="text-xs text-right mt-1 text-gray-500">
                    {message.length}/{userSettings.textMessageLengthLimit} characters
                    {userSettings.enforceLengthLimit ? '' : ' (limit disabled)'}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center p-8 max-w-md">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 mx-auto mb-4">
                  <FaPaperPlane className="text-3xl" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Your Messages</h2>
                <p className="text-gray-600 mb-6">
                  Select a chat to start messaging or create a new chat.
                </p>
                <button
                  onClick={() => toggleSearch()}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                  Start a Conversation
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Group chat modal */}
        {showModal && (
          <GroupChatModal
            onClose={() => setShowModal(false)}
            onCreateGroup={handleGroupCreation}
          />
        )}
      </div>
    </MemoizedChildren>
  );
}

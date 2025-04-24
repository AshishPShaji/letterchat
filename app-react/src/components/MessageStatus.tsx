"use client";

import { FaCheck, FaCheckDouble } from 'react-icons/fa';

interface User {
  _id: string;
  name?: string;
}

interface MessageStatusProps {
  readBy: string[];
  deliveredTo: string[];
  chatUsers: User[];
  currentUser: string;
}

const MessageStatus: React.FC<MessageStatusProps> = ({ 
  readBy, 
  deliveredTo, 
  chatUsers,
  currentUser
}) => {
  // Only show status for current user's messages
  const otherUsers = chatUsers.filter(user => user._id !== currentUser);
  
  // Count how many other users have read the message
  const readCount = readBy.filter(userId => 
    userId !== currentUser && 
    otherUsers.some(user => user._id === userId)
  ).length;
  
  // Count how many other users have received the message
  const deliveredCount = deliveredTo.filter(userId => 
    userId !== currentUser && 
    otherUsers.some(user => user._id === userId)
  ).length;
  
  // Get total number of other users
  const totalOtherUsers = otherUsers.length;
  
  // Determine message status
  let status = 'sent'; // default to sent
  
  if (deliveredCount > 0) {
    status = 'delivered';
  }
  
  if (readCount > 0) {
    status = 'read';
  }
  
  // For group chats, show status with counts
  const isGroup = totalOtherUsers > 1;
  
  return (
    <div className="flex items-center text-xs text-gray-500 ml-2">
      {status === 'sent' && (
        <FaCheck title="Sent" className="text-gray-400" />
      )}
      
      {status === 'delivered' && (
        <FaCheckDouble title="Delivered" className="text-gray-400" />
      )}
      
      {status === 'read' && (
        <FaCheckDouble title="Read" className="text-blue-500" />
      )}
      
      {isGroup && (status === 'read' || status === 'delivered') && (
        <span className="ml-1">
          {status === 'read' ? readCount : deliveredCount}/{totalOtherUsers}
        </span>
      )}
    </div>
  );
};

export default MessageStatus;

"use client";

import React from "react";
import { FaCheck, FaCheckDouble, FaEye } from "react-icons/fa";

interface MessageStatusProps {
  isOwnMessage: boolean;
  readBy: string[];
  deliveredTo: string[];
  chatUsers: any[]; // Using any[] to accommodate different types
  sent?: boolean;
  timestamp?: string;
  currentUser?: string;
}

const ChatMessageStatus: React.FC<MessageStatusProps> = ({ 
  isOwnMessage, 
  readBy, 
  deliveredTo, 
  chatUsers,
  sent,
  timestamp
}) => {
  if (!isOwnMessage) {
    return (
      <div className="text-xs text-gray-400">
        {timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
      </div>
    );
  }

  // Calculate the status
  let status = "Sending...";
  let statusColor = "text-gray-400";
  let icon = null;
  
  // Get counts
  const otherUsersCount = chatUsers.length - 1; // excluding sender
  const readCount = readBy ? readBy.filter(id => chatUsers.includes(id)).length : 0;
  const deliveredCount = deliveredTo ? deliveredTo.filter(id => chatUsers.includes(id)).length : 0;
  
  if (sent) {
    status = "Sent";
    statusColor = "text-gray-400";
    icon = <FaCheck className="mr-1" size={12} />;
    
    // If delivered to anyone
    if (deliveredCount > 0) {
      status = `Delivered${otherUsersCount > 1 ? ` (${deliveredCount}/${otherUsersCount})` : ''}`;
      statusColor = "text-blue-400";
      icon = <FaCheckDouble className="mr-1" size={12} />;
    }
    
    // If read by anyone
    if (readCount > 0) {
      status = `Read${otherUsersCount > 1 ? ` (${readCount}/${otherUsersCount})` : ''}`;
      statusColor = "text-green-500";
      icon = <FaEye className="mr-1" size={12} />;
    }
  }
  
  return (
    <div className="flex flex-col items-end">
      <div className="text-xs text-gray-400">
        {timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
      </div>
      <div className={`text-xs ${statusColor} flex items-center mt-1`}>
        {icon}
        {status}
      </div>
    </div>
  );
};

export default ChatMessageStatus; 
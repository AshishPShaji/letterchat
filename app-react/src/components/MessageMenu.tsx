"use client";

import { useEffect, useRef } from 'react';
import { FaTrash, FaCopy } from 'react-icons/fa';

interface Message {
  _id: string;
  sender: { _id: string; name: string };
  content: string;
  chat: { _id: string; isGroupChat: boolean };
  createdAt: string;
  updatedAt: string;
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
}

interface MessageMenuProps {
  message: Message;
  isOwnMessage: boolean;
  isGroupAdmin: boolean;
  onCopy: () => void;
  onDelete: (forEveryone: boolean) => void;
  onClose: () => void;
}

const MessageMenu: React.FC<MessageMenuProps> = ({
  message,
  isOwnMessage,
  isGroupAdmin,
  onCopy,
  onDelete,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute z-10 bg-white rounded-lg shadow-lg py-2 w-48"
      style={{
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      {message.content && (
        <button
          onClick={onCopy}
          className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
        >
          <FaCopy className="mr-2" />
          Copy Text
        </button>
      )}
      
      <button
        onClick={() => onDelete(false)}
        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
      >
        <FaTrash className="mr-2" />
        Delete for Me
      </button>
      
      {(isOwnMessage || isGroupAdmin) && (
        <button
          onClick={() => onDelete(true)}
          className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center text-red-500"
        >
          <FaTrash className="mr-2" />
          Delete for Everyone
        </button>
      )}
    </div>
  );
};

export default MessageMenu;

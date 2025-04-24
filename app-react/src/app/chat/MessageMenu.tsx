"use client";

import { useState, useRef, useEffect } from "react";
import { deleteMessageForMe, deleteMessageForEveryone } from "@/services/api";
import { toast } from "react-toastify";

interface MessageMenuProps {
  messageId: string;
  isOwnMessage: boolean;
  isGroupAdmin: boolean;
  onDelete: (messageId: string) => void;
}

const MessageMenu = ({ messageId, isOwnMessage, isGroupAdmin, onDelete }: MessageMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleDeleteForMe = async () => {
    try {
      await deleteMessageForMe(messageId);
      onDelete(messageId);
      toast.success("Message deleted");
    } catch (error) {
      console.error("Failed to delete message:", error);
      toast.error("Failed to delete message");
    }
    setIsOpen(false);
  };

  const handleDeleteForEveryone = async () => {
    try {
      await deleteMessageForEveryone(messageId);
      // Socket will handle the deletion for all users
      toast.success("Message deleted for everyone");
    } catch (error) {
      console.error("Failed to delete message for everyone:", error);
      toast.error("Failed to delete message for everyone");
    }
    setIsOpen(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10">
          <div className="py-1">
            <button
              onClick={handleDeleteForMe}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Delete for me
            </button>
            
            {(isOwnMessage || isGroupAdmin) && (
              <button
                onClick={handleDeleteForEveryone}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                Delete for everyone
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageMenu;

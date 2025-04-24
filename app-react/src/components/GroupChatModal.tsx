"use client";

import { useState } from 'react';
import { searchUsers } from '@/services/api';
import { FaTimes, FaSearch, FaUserPlus } from 'react-icons/fa';

interface User {
  _id: string;
  name: string;
  email: string;
  profilePic: string;
}

interface GroupChatModalProps {
  onClose: () => void;
  onCreateGroup: (selectedUsers: User[], chatName: string) => void;
}

const GroupChatModal: React.FC<GroupChatModalProps> = ({ onClose, onCreateGroup }) => {
  const [groupChatName, setGroupChatName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery) return;
    
    try {
      setLoading(true);
      const users = await searchUsers(searchQuery);
      // Filter out already selected users
      const filteredUsers = users.filter(
        user => !selectedUsers.some(selectedUser => selectedUser._id === user._id)
      );
      setSearchResults(filteredUsers);
      setLoading(false);
    } catch (error) {
      console.error('Error searching users:', error);
      setLoading(false);
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchResults(searchResults.filter(u => u._id !== user._id));
    setSearchQuery('');
  };

  const handleUserRemove = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(user => user._id !== userId));
  };

  const handleSubmit = () => {
    if (!groupChatName.trim()) {
      alert('Please enter a group name');
      return;
    }
    
    if (selectedUsers.length < 2) {
      alert('Please select at least 2 users');
      return;
    }
    
    onCreateGroup(selectedUsers, groupChatName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Create Group Chat</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-full"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Group Name
          </label>
          <input
            type="text"
            value={groupChatName}
            onChange={(e) => setGroupChatName(e.target.value)}
            placeholder="Enter group name"
            className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Add Users
          </label>
          <div className="flex">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="flex-1 p-2 border rounded-l focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleSearch}
              className="bg-blue-500 text-white p-2 rounded-r hover:bg-blue-600"
              disabled={loading}
            >
              <FaSearch />
            </button>
          </div>
        </div>
        
        {/* Selected users */}
        {selectedUsers.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-bold text-gray-700 mb-2">Selected Users:</p>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map(user => (
                <div
                  key={user._id}
                  className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                >
                  {user.name}
                  <button
                    onClick={() => handleUserRemove(user._id)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="mb-4 max-h-40 overflow-y-auto border rounded p-2">
            {searchResults.map(user => (
              <div
                key={user._id}
                onClick={() => handleUserSelect(user)}
                className="flex items-center p-2 hover:bg-gray-100 cursor-pointer rounded"
              >
                <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 mr-2">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <FaUserPlus className="ml-auto text-blue-500" />
              </div>
            ))}
          </div>
        )}
        
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded mr-2 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={loading || selectedUsers.length < 2 || !groupChatName.trim()}
          >
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupChatModal;

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { searchUsers, createSMSCampaign } from '@/services/api';
import { toast } from 'react-toastify';
import { FaPaperPlane, FaSearch, FaCheck, FaTimes } from 'react-icons/fa';

// Define proper types for users
interface User {
  _id: string;
  name: string;
  email: string;
  profilePic?: string;
}

export default function SMSCampaigns() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Check if admin
  useEffect(() => {
    if (!loading && (!user || !user._id)) {
      router.push('/login');
      toast.error('Please log in to access admin features');
    }
    // Here you would typically check if user has admin role
    // This is a simplified example
  }, [user, loading, router]);

  const handleSearch = async () => {
    if (!searchQuery) return;
    
    try {
      setIsSearching(true);
      const data = await searchUsers(searchQuery);
      setSearchResults(data);
      setIsSearching(false);
    } catch (error) {
      console.error("Error searching for users:", error);
      toast.error('Error searching for users. Please try again.');
      setIsSearching(false);
    }
  };

  const toggleUserSelection = (selectedUser: User) => {
    if (selectedUsers.some(u => u._id === selectedUser._id)) {
      setSelectedUsers(selectedUsers.filter(u => u._id !== selectedUser._id));
    } else {
      setSelectedUsers([...selectedUsers, selectedUser]);
    }
  };

  const sendCampaign = async () => {
    if (!title.trim()) {
      toast.error('Please enter a campaign title');
      return;
    }

    if (!content.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (content.length > 160) {
      toast.error('Message cannot exceed 160 characters');
      return;
    }

    if (selectedUsers.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }

    try {
      setIsSending(true);
      await createSMSCampaign(
        title,
        content,
        selectedUsers.map(u => u._id)
      );
      
      toast.success('SMS campaign sent successfully!');
      
      // Reset form
      setTitle('');
      setContent('');
      setSelectedUsers([]);
      
    } catch (error) {
      console.error('Error sending campaign:', error);
      toast.error('Failed to send SMS campaign. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // If loading, show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Admin Panel</h1>
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">SMS Campaigns</h1>
          <p className="text-gray-600 mb-6">
            Create and send SMS campaigns to targeted users
          </p>
          
          {/* Campaign Form */}
          <div className="mb-6">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Campaign Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                placeholder="Enter campaign title"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Message Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                placeholder="Enter your message (max 160 characters)"
                rows={4}
                maxLength={160}
              />
              <div className="text-xs text-right mt-1 text-gray-500">
                {content.length}/160 characters
              </div>
            </div>
          </div>
          
          {/* User Selection */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Select Recipients</h2>
            
            {/* Search Users */}
            <div className="flex mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 p-2 border rounded-l focus:outline-none focus:ring focus:border-blue-300"
                placeholder="Search users by name or email"
              />
              <button
                onClick={handleSearch}
                className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
                disabled={isSearching}
              >
                {isSearching ? 'Searching...' : <FaSearch />}
              </button>
            </div>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mb-4">
                <h3 className="text-md font-medium mb-2">Search Results</h3>
                <div className="max-h-60 overflow-y-auto border rounded">
                  {searchResults.map(user => (
                    <div
                      key={user._id}
                      className={`flex items-center justify-between p-3 border-b hover:bg-gray-50 cursor-pointer ${
                        selectedUsers.some(u => u._id === user._id) ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => toggleUserSelection(user)}
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 mr-3">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div>
                        {selectedUsers.some(u => u._id === user._id) ? (
                          <FaCheck className="text-green-500" />
                        ) : (
                          <FaTimes className="text-gray-300" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Selected Users */}
            <div>
              <h3 className="text-md font-medium mb-2">Selected Recipients ({selectedUsers.length})</h3>
              {selectedUsers.length > 0 ? (
                <div className="max-h-40 overflow-y-auto border rounded p-2">
                  <div className="flex flex-wrap">
                    {selectedUsers.map(user => (
                      <div
                        key={user._id}
                        className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm font-medium m-1 flex items-center"
                      >
                        {user.name}
                        <button
                          onClick={() => toggleUserSelection(user)}
                          className="ml-2 text-blue-500 hover:text-blue-700"
                        >
                          <FaTimes className="text-xs" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm italic">No recipients selected</p>
              )}
            </div>
          </div>
          
          {/* Send Button */}
          <div className="mt-6">
            <button
              onClick={sendCampaign}
              disabled={isSending}
              className="flex items-center justify-center w-full bg-blue-500 text-white px-4 py-3 rounded font-medium hover:bg-blue-600 disabled:bg-blue-300"
            >
              {isSending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <FaPaperPlane className="mr-2" />
                  Send Campaign
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
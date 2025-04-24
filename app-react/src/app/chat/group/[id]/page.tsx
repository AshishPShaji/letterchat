"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getChat, searchUsers, addToGroup, removeFromGroup, renameGroup } from "@/services/api";
import Link from "next/link";
import { toast } from "react-toastify";

interface User {
  _id: string;
  name: string;
  email: string;
  profilePic: string;
}

interface Chat {
  _id: string;
  chatName: string;
  isGroupChat: boolean;
  users: User[];
  groupAdmin?: User;
  createdAt: string;
  updatedAt: string;
}

interface PageProps {
  params: {
    id: string;
  };
}

export default function GroupInfoPage({ params }: PageProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [chat, setChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [newChatName, setNewChatName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
    }
  }, [user, router]);

  // Fetch chat info
  useEffect(() => {
    const fetchChatInfo = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const data = await getChat(params.id);
        
        if (!data.isGroupChat) {
          // Redirect back to chat if not a group chat
          router.push("/chat");
          return;
        }
        
        setChat(data);
        setNewChatName(data.chatName);
      } catch (error) {
        console.error("Failed to fetch chat info:", error);
        toast.error("Failed to load group info");
        router.push("/chat");
      } finally {
        setLoading(false);
      }
    };

    fetchChatInfo();
  }, [params.id, user, router]);

  // Search users
  useEffect(() => {
    const searchUsersFunc = async () => {
      if (!searchTerm) {
        setSearchResults([]);
        return;
      }
      
      setSearching(true);
      try {
        const data = await searchUsers(searchTerm);
        // Filter out users who are already in the group
        const filteredResults = data.filter(
          (searchUser: User) => !chat?.users.some(user => user._id === searchUser._id)
        );
        setSearchResults(filteredResults);
      } catch (error) {
        console.error("Failed to search users:", error);
      } finally {
        setSearching(false);
      }
    };

    const timeoutId = setTimeout(() => {
      searchUsersFunc();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, chat]);

  const handleAddUser = async (userId: string) => {
    if (!chat) return;
    
    setUpdating(true);
    try {
      const updatedChat = await addToGroup(chat._id, userId);
      setChat(updatedChat);
      setSearchTerm("");
      setSearchResults([]);
      toast.success("User added to group");
    } catch (error) {
      console.error("Failed to add user:", error);
      toast.error("Failed to add user to group");
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!chat) return;
    
    // Prevent removing yourself as admin
    if (userId === user?._id && chat.groupAdmin?._id === user?._id) {
      toast.error("Group admin cannot leave the group");
      return;
    }
    
    setUpdating(true);
    try {
      const updatedChat = await removeFromGroup(chat._id, userId);
      setChat(updatedChat);
      
      // If current user was removed, go back to chat list
      if (userId === user?._id) {
        router.push("/chat");
        toast.info("You have left the group");
      } else {
        toast.success("User removed from group");
      }
    } catch (error) {
      console.error("Failed to remove user:", error);
      toast.error("Failed to remove user from group");
    } finally {
      setUpdating(false);
    }
  };

  const handleRenameGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!chat || !newChatName.trim()) return;
    
    setUpdating(true);
    try {
      const updatedChat = await renameGroup(chat._id, newChatName);
      setChat(updatedChat);
      setIsEditing(false);
      toast.success("Group renamed successfully");
    } catch (error) {
      console.error("Failed to rename group:", error);
      toast.error("Failed to rename group");
    } finally {
      setUpdating(false);
    }
  };

  const isAdmin = chat?.groupAdmin?._id === user?._id;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading group info...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Header with back button */}
          <div className="flex items-center mb-6">
            <Link href="/chat" className="mr-4 p-2 hover:bg-gray-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold">Group Information</h1>
          </div>
          
          {/* Group Name */}
          <div className="mb-6">
            {isEditing ? (
              <form onSubmit={handleRenameGroup} className="flex items-center">
                <input
                  type="text"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  className="flex-1 p-2 border rounded mr-2"
                  placeholder="Enter new group name"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
                  disabled={updating}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setNewChatName(chat?.chatName || "");
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div className="flex items-center">
                <h2 className="text-xl font-semibold">{chat?.chatName}</h2>
                {isAdmin && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
              </div>
            )}
            <div className="text-sm text-gray-500 mt-1">
              {chat?.users.length} members • Created {new Date(chat?.createdAt || "").toLocaleDateString()}
            </div>
          </div>
          
          {/* Admin section */}
          <div className="mb-6">
            <h3 className="text-md font-medium mb-2">Admin</h3>
            <div className="flex items-center bg-gray-100 p-3 rounded-lg">
              <div className="w-10 h-10 bg-gray-300 rounded-full mr-3 flex-shrink-0">
                {chat?.groupAdmin?.profilePic ? (
                  <img
                    src={chat.groupAdmin.profilePic}
                    alt={chat.groupAdmin.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 font-semibold">
                    {chat?.groupAdmin?.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <div className="font-medium">{chat?.groupAdmin?.name}</div>
                <div className="text-xs text-gray-500">{chat?.groupAdmin?.email}</div>
              </div>
            </div>
          </div>
          
          {/* Add members section (admin only) */}
          {isAdmin && (
            <div className="mb-6">
              <h3 className="text-md font-medium mb-2">Add Members</h3>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users by name or email"
                className="w-full p-3 border rounded-lg mb-2"
              />
              
              {/* Search Results */}
              <div className="max-h-40 overflow-y-auto">
                {searching ? (
                  <div className="text-center p-2">Searching...</div>
                ) : (
                  searchResults.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded-lg mb-2"
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-300 rounded-full mr-2 flex-shrink-0">
                          {user.profilePic ? (
                            <img
                              src={user.profilePic}
                              alt={user.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddUser(user._id)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        disabled={updating}
                      >
                        Add
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          
          {/* Members list */}
          <div>
            <h3 className="text-md font-medium mb-2">Members</h3>
            <div className="space-y-2">
              {chat?.users.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-300 rounded-full mr-3 flex-shrink-0">
                      {member.profilePic ? (
                        <img
                          src={member.profilePic}
                          alt={member.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 font-semibold">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-xs text-gray-500">{member.email}</div>
                      {member._id === chat.groupAdmin?._id && (
                        <div className="text-xs font-semibold text-blue-600">Admin</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Remove button - admin can remove anyone, users can remove themselves */}
                  {(isAdmin || member._id === user?._id) && (
                    <button
                      onClick={() => handleRemoveUser(member._id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      disabled={updating}
                    >
                      {member._id === user?._id ? "Leave" : "Remove"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
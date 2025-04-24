"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FaUser, FaCog, FaSignOutAlt, FaComments, FaUserCog } from 'react-icons/fa';
import { toast } from 'react-toastify';
import UserAvatar from './UserAvatar';

// Define user interface with isAdmin property
interface UserWithAdmin {
  _id: string;
  name: string;
  email: string;
  profilePic?: string;
  isAdmin?: boolean;
}

const NavBar = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Type cast user to include isAdmin property
  const typedUser = user as UserWithAdmin | null;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
    toast.success('Logged out successfully');
  };

  return (
    <nav className="bg-white shadow-sm border-b px-4 py-2 flex justify-between items-center">
      <div className="flex items-center">
        <Link href="/chat" className="text-xl font-bold text-blue-600">
          LetterChat
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        <Link href="/chat" className="text-gray-700 hover:text-blue-600">
          <FaComments className="inline mr-1" /> Chats
        </Link>
        
        {typedUser?.isAdmin && (
          <Link href="/admin" className="text-gray-700 hover:text-blue-600">
            <FaUserCog className="inline mr-1" /> Admin
          </Link>
        )}
        
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-2 focus:outline-none"
          >
            {typedUser && (
              <UserAvatar 
                name={typedUser.name} 
                profilePic={typedUser.profilePic} 
                size="sm" 
              />
            )}
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
              <div className="px-4 py-2 border-b">
                <p className="text-sm font-semibold">{typedUser?.name}</p>
                <p className="text-xs text-gray-500 truncate">{typedUser?.email}</p>
              </div>
              
              <Link 
                href="/profile" 
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                onClick={() => setShowDropdown(false)}
              >
                <FaUser className="inline mr-2" /> Profile
              </Link>
              
              <Link 
                href="/settings" 
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                onClick={() => setShowDropdown(false)}
              >
                <FaCog className="inline mr-2" /> Settings
              </Link>
              
              <button 
                onClick={handleLogout} 
                className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
              >
                <FaSignOutAlt className="inline mr-2" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar; 
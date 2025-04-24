"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserProfile, updateProfilePicture } from '@/services/api';
import { toast } from 'react-toastify';
import UserAvatar from '@/components/UserAvatar';
import { FaUser, FaEnvelope, FaPhone, FaCamera } from 'react-icons/fa';

interface UserWithProfile {
  _id: string;
  name: string;
  email: string;
  profilePic?: string;
  phoneNumber?: string;
  isAdmin?: boolean;
}

export default function Profile() {
  const { user, loading, updateUser } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [originalData, setOriginalData] = useState({
    name: '',
    phoneNumber: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typedUser = user as UserWithProfile | null;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      toast.error('Please log in to access your profile');
    } else if (typedUser) {
      // Set form values
      setName(typedUser.name);
      setEmail(typedUser.email);
      setPhoneNumber(typedUser.phoneNumber || '');
      setProfilePic(typedUser.profilePic || '');
      
      // Store original values for comparison
      setOriginalData({
        name: typedUser.name,
        phoneNumber: typedUser.phoneNumber || ''
      });
    }
  }, [user, loading, router, typedUser]);

  const handleProfilePicClick = () => {
    // Trigger the hidden file input
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, WEBP)');
      return;
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    
    // Upload the image
    setIsUploading(true);
    try {
      // Create a preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          // Show preview immediately while the actual upload happens
          setProfilePic(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
      
      // Upload to server
      const response = await updateProfilePicture(file);
      
      // Update profile pic URL from server
      if (response.profilePic && updateUser && typedUser) {
        updateUser({
          ...typedUser,
          profilePic: response.profilePic
        });
        setProfilePic(response.profilePic);
      }
      
      toast.success('Profile picture updated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload profile picture';
      toast.error(errorMessage);
      // Reset to original profile pic
      setProfilePic(typedUser?.profilePic || '');
    } finally {
      setIsUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const hasChanges = () => {
    return name !== originalData.name || phoneNumber !== originalData.phoneNumber;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Add validation here
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    
    // Check if there are actual changes
    if (!hasChanges()) {
      toast.info('No changes to save');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Call API to update user profile
      await updateUserProfile({
        name: name !== originalData.name ? name : undefined,
        phoneNumber: phoneNumber !== originalData.phoneNumber ? phoneNumber : undefined
      });
      
      // Update user in context
      if (updateUser && typedUser) {
        updateUser({
          ...typedUser,
          name,
          phoneNumber
        });
      }
      
      // Update original data to match current
      setOriginalData({
        name,
        phoneNumber
      });
      
      toast.success('Profile updated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    setName(originalData.name);
    setPhoneNumber(originalData.phoneNumber);
    toast.info('Changes cancelled');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">My Profile</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row items-center mb-6">
          <div className="relative mb-4 sm:mb-0 sm:mr-6">
            <div className="w-24 h-24 relative overflow-hidden rounded-full">
              <div onClick={handleProfilePicClick} className="cursor-pointer">
                <UserAvatar 
                  name={name} 
                  profilePic={profilePic} 
                  size="lg" 
                  className="w-full h-full"
                />
              </div>
              {isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            
            {/* Hidden file input */}
            <input 
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            
            <button 
              onClick={handleProfilePicClick}
              className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full"
              title="Change profile picture"
              disabled={isUploading}
            >
              <FaCamera size={14} />
            </button>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold dark:text-white">{name}</h2>
            <p className="text-gray-600 dark:text-gray-300">{email}</p>
            {typedUser?.isAdmin && (
              <span className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs px-2 py-1 rounded mt-1">
                Admin
              </span>
            )}
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-gray-700 dark:text-gray-300 mb-1">
                <FaUser className="inline mr-2" size={14} />
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-gray-700 dark:text-gray-300 mb-1">
                <FaEnvelope className="inline mr-2" size={14} />
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                disabled
                className="w-full px-3 py-2 border bg-gray-100 text-gray-700 rounded-md cursor-not-allowed dark:bg-gray-600 dark:border-gray-700 dark:text-gray-300"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
            </div>
            
            <div>
              <label htmlFor="phoneNumber" className="block text-gray-700 dark:text-gray-300 mb-1">
                <FaPhone className="inline mr-2" size={14} />
                Phone Number (optional)
              </label>
              <input
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            {hasChanges() && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                disabled={isSubmitting}
              >
                Cancel
              </button>
            )}
            
            <button
              type="submit"
              className={`px-4 py-2 rounded-md text-white ${
                hasChanges() && !isSubmitting
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
              disabled={!hasChanges() || isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
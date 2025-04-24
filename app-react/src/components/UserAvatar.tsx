"use client";

import { useMemo } from 'react';
import OptimizedImage from './OptimizedImage';

interface UserAvatarProps {
  name: string;
  profilePic?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

// Get color based on name to ensure same user always gets same color
const getColorFromName = (name: string): string => {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];
  
  // Simple hash function 
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export default function UserAvatar({ name, profilePic, size = 'md', className = '', onClick }: UserAvatarProps) {
  // Size mapping
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
  };
  
  // Memoize the color to avoid recalculating on every render
  const bgColor = useMemo(() => getColorFromName(name), [name]);
  
  // Get first letter of name for avatar
  const initials = name.charAt(0).toUpperCase();
  
  if (!profilePic) {
    return (
      <div 
        className={`${sizeClasses[size]} ${bgColor} rounded-full flex items-center justify-center text-white font-semibold ${className}`}
        aria-label={name}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        style={onClick ? { cursor: 'pointer' } : undefined}
      >
        {initials}
      </div>
    );
  }
  
  return (
    <div 
      className="relative"
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
      role={onClick ? "button" : undefined}
    >
      <OptimizedImage
        src={profilePic}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
        fallbackSrc={`data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23${bgColor.replace('bg-', '')}'/%3E%3Ctext x='50%25' y='50%25' font-size='20' text-anchor='middle' dominant-baseline='middle' fill='white'%3E${initials}%3C/text%3E%3C/svg%3E`}
      />
    </div>
  );
} 
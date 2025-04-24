"use client";

import { useState } from 'react';
import { FaArrowUp, FaTimes } from 'react-icons/fa';

export default function SettingsGuide() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed top-16 right-4 p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-lg z-50 max-w-xs">
      <button 
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        aria-label="Close guide"
      >
        <FaTimes size={14} />
      </button>
      
      <h3 className="font-semibold text-blue-800 mb-2">Looking for settings?</h3>
      
      <div className="text-sm text-gray-700 mb-4">
        <p className="mb-2">
          Click on your profile icon in the top-right corner of the navigation bar to access:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Profile settings</li>
          <li>Application settings</li>
          <li>Logout button</li>
        </ul>
      </div>
      
      <div className="flex items-center justify-center text-blue-800">
        <FaArrowUp className="animate-bounce" size={20} />
        <span className="ml-2">Click your avatar up here</span>
      </div>
    </div>
  );
} 
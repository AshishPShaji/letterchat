"use client";

import { useState, useEffect } from 'react';

interface BlurredBackgroundImageProps {
  src: string;
  alt?: string;
  blurAmount?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  overlayColor?: string;
  overlayOpacity?: 'light' | 'medium' | 'dark';
  children?: React.ReactNode;
  fallbackSrc?: string;
}

export default function BlurredBackgroundImage({
  src,
  alt = 'Background image',
  blurAmount = 'md',
  className = '',
  overlayColor = 'bg-black',
  overlayOpacity = 'medium',
  children,
  fallbackSrc = '/images/placeholder.png'
}: BlurredBackgroundImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);

  // Update source when prop changes
  useEffect(() => {
    setImgSrc(src);
    setIsLoading(true);
  }, [src]);

  // Handle image load error
  const handleError = () => {
    console.error(`Failed to load background image: ${imgSrc}`);
    setImgSrc(fallbackSrc);
  };

  // Handle load complete
  const handleLoad = () => {
    setIsLoading(false);
  };

  // Map blur amount to Tailwind classes
  const blurClasses = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
  };

  // Map opacity to Tailwind classes
  const opacityClasses = {
    light: 'bg-opacity-30',
    medium: 'bg-opacity-50',
    dark: 'bg-opacity-70',
  };

  // Fix URL path if it's a relative path to the uploads folder
  const getProperImageUrl = (imagePath: string) => {
    // If it's already a full URL or a public asset, return as is
    if (imagePath.startsWith('http') || imagePath.startsWith('/images/') || imagePath.startsWith('data:')) {
      return imagePath;
    }
    
    // Handle local file paths (convert to fallback)
    if (imagePath.startsWith('C:') || imagePath.includes(':\\') || imagePath.includes(':/')) {
      return fallbackSrc;
    }
    
    // If it's a path from uploads directory but doesn't have the full URL
    if (imagePath.includes('/uploads/') || imagePath.startsWith('uploads/')) {
      // Extract the uploads part
      const uploadPath = imagePath.substring(imagePath.indexOf('uploads/'));
      // Use the path with a leading slash
      return `/${uploadPath}`;
    }
    
    return imagePath;
  };

  // Get the proper image URL
  const displaySrc = getProperImageUrl(imgSrc);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
      )}
      
      {/* Background image */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src={displaySrc}
          alt={alt}
          onError={handleError}
          onLoad={handleLoad}
          className={`w-full h-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        />
        
        {/* Overlay with blur effect */}
        <div className={`absolute inset-0 ${overlayColor} ${opacityClasses[overlayOpacity]} ${blurClasses[blurAmount]}`}></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
} 
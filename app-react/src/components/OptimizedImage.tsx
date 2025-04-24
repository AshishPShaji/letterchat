"use client";

import { useState, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fallbackSrc?: string;
}

export default function OptimizedImage({
  src,
  alt,
  width = 0,
  height = 0,
  className = '',
  priority = false,
  fallbackSrc = '/images/placeholder.png'
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);

  // Handle local file paths and convert them when needed
  useEffect(() => {
    // Reset when src changes
    setImgSrc(src);
    setIsLoading(true);
  }, [src]);

  // Handle image load error
  const handleError = () => {
    console.error(`Failed to load image: ${imgSrc}`);
    setImgSrc(fallbackSrc);
  };

  // Handle load complete
  const handleLoad = () => {
    setIsLoading(false);
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
      // Extract the uploads part - handle both absolute and relative paths
      const uploadPath = imagePath.substring(imagePath.indexOf('uploads/'));
      // Use the uploads path as is, without modifying it
      return `/${uploadPath}`;
    }
    
    return imagePath;
  };

  // Get the proper image URL
  const displaySrc = getProperImageUrl(imgSrc);

  // Use Image component for everything since we've properly handled the URLs
  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-md"></div>
      )}
      <img
        src={displaySrc}
        alt={alt}
        width={width || undefined}
        height={height || undefined}
        onError={handleError}
        onLoad={handleLoad}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        loading={priority ? 'eager' : 'lazy'}
      />
    </div>
  );
} 
"use client";

import { useState, useEffect, useMemo } from 'react';
import { 
  FaFile, 
  FaFilePdf, 
  FaFileWord, 
  FaFileExcel, 
  FaFilePowerpoint, 
  FaDownload,
  FaPlay,
  FaMusic
} from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';

interface WhatsAppStyleMediaProps {
  fileUrl: string;
  fileType: string;
  fileName: string;
  onLoad?: () => void;
  isOwnMessage: boolean;
}

const WhatsAppStyleMedia: React.FC<WhatsAppStyleMediaProps> = ({ 
  fileUrl, 
  fileType, 
  fileName, 
  onLoad, 
  isOwnMessage
}) => {
  const [showModal, setShowModal] = useState(false);
  const [videoPlayback, setVideoPlayback] = useState(false);
  const [fileExists, setFileExists] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  const normalizedUrl = useMemo(() => {
    console.log('Original fileUrl:', fileUrl);
    
    let url = fileUrl;
    
    url = url.replace(/([^:]\/)\/+/g, "$1");
    
    if (url.startsWith('http')) {
      console.log('Using absolute URL:', url);
      return url;
    } else {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const finalUrl = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
      console.log('Constructed full URL:', finalUrl);
      return finalUrl;
    }
  }, [fileUrl]);
  
  useEffect(() => {
    const checkFileExistence = async () => {
      setIsLoading(true);
      try {
        // For images, we can try to load them directly
        if (fileType === 'image' || fileType?.startsWith('image/')) {
          console.log('Checking image existence by preloading:', normalizedUrl);
          const img = new Image();
          img.onload = () => {
            console.log('Image loaded successfully:', normalizedUrl);
            setFileExists(true);
            setIsLoading(false);
            if (onLoad) onLoad();
          };
          img.onerror = () => {
            console.error('Failed to load image:', normalizedUrl);
            setFileExists(false);
            setIsLoading(false);
          };
          img.src = normalizedUrl;
          return; // Return early as we'll handle state in callbacks
        }
        
        // For other file types, use HEAD request
        const exists = await verifyFileExists(normalizedUrl);
        setFileExists(exists);
      } catch (error) {
        console.error('Error checking file:', error);
        setFileExists(false);
      } finally {
        if (fileType !== 'image' && !fileType?.startsWith('image/')) {
          setIsLoading(false);
        }
      }
    };
    
    checkFileExistence();
  }, [normalizedUrl, fileType, onLoad]);
  
  const verifyFileExists = async (url: string): Promise<boolean> => {
    try {
      console.log('Checking file existence at:', url);
      const response = await fetch(url, { 
        method: 'HEAD',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      console.log('File existence check result:', response.ok, response.status);
      return response.ok;
    } catch (error) {
      console.error('Error checking file existence:', error);
      return false;
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const fullUrl = normalizedUrl.startsWith('http') 
        ? normalizedUrl 
        : window.location.origin + (normalizedUrl.startsWith('/') ? normalizedUrl : `/${normalizedUrl}`);
      
      const link = document.createElement('a');
      
      link.href = fullUrl;
      link.download = fileName || 'download';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      window.open(normalizedUrl, '_blank');
    }
  };

  const getFileTypeText = () => {
    if (fileType === 'image' || fileType?.startsWith('image/')) return 'Photo';
    if (fileType === 'video' || fileType?.startsWith('video/')) return 'Video';
    if (fileType === 'audio' || fileType?.startsWith('audio/')) return 'Audio';
    
    const extension = fileName?.split('.').pop()?.toLowerCase();
    if (extension === 'pdf' || fileType === 'application/pdf') return 'PDF';
    if (['doc', 'docx'].includes(extension || '') || fileType?.includes('word')) return 'DOC';
    if (['xls', 'xlsx'].includes(extension || '') || fileType?.includes('excel')) return 'XLS';
    if (['ppt', 'pptx'].includes(extension || '') || fileType?.includes('powerpoint')) return 'PPT';
    
    return 'FILE';
  };

  const getFileIcon = () => {
    if (fileType === 'document' || !fileType?.startsWith('image/') && !fileType?.startsWith('video/') && !fileType?.startsWith('audio/')) {
      const extension = fileName?.split('.').pop()?.toLowerCase();
      
      if (extension === 'pdf' || fileType === 'application/pdf') {
        return <FaFilePdf className="text-red-600" />;
      } else if (['doc', 'docx'].includes(extension || '') || fileType === 'application/msword' || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return <FaFileWord className="text-blue-600" />;
      } else if (['xls', 'xlsx'].includes(extension || '') || fileType === 'application/vnd.ms-excel' || fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        return <FaFileExcel className="text-green-600" />;
      } else if (['ppt', 'pptx'].includes(extension || '') || fileType === 'application/vnd.ms-powerpoint' || fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
        return <FaFilePowerpoint className="text-orange-600" />;
      }
      
      return <FaFile className="text-gray-600" />;
    }
    
    return null;
  };

  if (fileType === 'image' || fileType?.startsWith('image/')) {
    return (
      <>
        <div className="relative rounded-lg overflow-hidden group">
          <img
            src={normalizedUrl}
            alt={fileName || "Image"}
            className="max-w-full max-h-[180px] object-cover cursor-pointer"
            onClick={() => setShowModal(true)}
            onLoad={onLoad}
          />
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              className="bg-black bg-opacity-60 text-white p-1.5 rounded-full"
              onClick={(e) => handleDownload(e)}
            >
              <FaDownload size={14} />
            </button>
          </div>
        </div>
        
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
            <div className="relative max-w-4xl max-h-screen p-4">
              <button
                className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-full p-2"
                onClick={() => setShowModal(false)}
              >
                <IoClose className="w-6 h-6" />
              </button>
              <img
                src={normalizedUrl}
                alt={fileName || "Image"}
                className="max-w-full max-h-[90vh] object-contain"
              />
              <div className="absolute bottom-4 right-4">
                <button 
                  className="bg-white dark:bg-gray-800 p-2 rounded-full"
                  onClick={(e) => handleDownload(e)}
                >
                  <FaDownload size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
  
  if (fileType === 'video' || fileType?.startsWith('video/')) {
    return (
      <div className={`rounded-lg overflow-hidden ${!videoPlayback ? 'relative' : ''}`}>
        {!videoPlayback ? (
          <div 
            className="cursor-pointer relative group"
            onClick={() => setVideoPlayback(true)}
          >
            <div className="w-full h-[150px] flex items-center justify-center bg-gray-800">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-white bg-opacity-75 rounded-full flex items-center justify-center">
                  <FaPlay className="text-gray-900 ml-1" />
                </div>
              </div>
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-70 rounded text-white text-xs flex items-center">
                <span className="mr-1">Video</span>
              </div>
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  className="bg-black bg-opacity-60 text-white p-1.5 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(e);
                  }}
                >
                  <FaDownload size={14} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            <video 
              src={normalizedUrl}
              controls 
              autoPlay
              className="max-w-full max-h-[250px] w-full"
              onLoadedMetadata={onLoad}
            >
              Your browser does not support the video tag.
            </video>
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 rounded-full p-1.5">
              <button 
                className="text-white"
                onClick={(e) => handleDownload(e)}
              >
                <FaDownload size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  if (fileType === 'audio' || fileType?.startsWith('audio/')) {
    return (
      <div className={`rounded-lg p-3 ${isOwnMessage ? 'bg-blue-500' : 'bg-white dark:bg-gray-700'}`}>
        <div className="flex items-center">
          <div className={`flex-shrink-0 w-10 h-10 rounded-lg mr-3 flex items-center justify-center ${isOwnMessage ? 'bg-blue-400' : 'bg-gray-200 dark:bg-gray-600'}`}>
            <FaMusic className={isOwnMessage ? 'text-white' : 'text-gray-600 dark:text-gray-300'} size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-medium truncate ${isOwnMessage ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
              {fileName || "Audio"}
            </div>
            <div className={`text-xs ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
              Audio
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              className={`p-2 rounded-full ${isOwnMessage ? 'hover:bg-blue-400 text-white' : 'hover:bg-gray-200 text-gray-500'}`}
              onClick={(e) => {
                e.stopPropagation();
                const audio = new Audio(normalizedUrl);
                audio.play().catch(err => console.error('Error playing audio:', err));
              }}
            >
              <FaPlay size={14} />
            </button>
            <button 
              className={`p-2 rounded-full ${isOwnMessage ? 'hover:bg-blue-400 text-white' : 'hover:bg-gray-200 text-gray-500'}`}
              onClick={(e) => handleDownload(e)}
            >
              <FaDownload size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  const fileTypeLabel = getFileTypeText();
  const fileIcon = getFileIcon();
  
  // Error fallback component with retry option
  const FileErrorDisplay = () => {
    const handleRetry = () => {
      setIsLoading(true);
      setFileExists(true); // Assume it exists for now
      
      // Wait a moment then try again
      setTimeout(() => {
        const checkFileExistence = async () => {
          try {
            const exists = await verifyFileExists(normalizedUrl);
            setFileExists(exists);
          } finally {
            setIsLoading(false);
          }
        };
        checkFileExistence();
      }, 1000);
    };
    
    return (
      <div className={`rounded-lg p-3 ${isOwnMessage ? 'bg-blue-500' : 'bg-white dark:bg-gray-700'}`}>
        <div className="flex items-center">
          <div className={`flex-shrink-0 w-10 h-10 rounded-lg mr-3 flex items-center justify-center ${isOwnMessage ? 'bg-blue-400' : 'bg-gray-200 dark:bg-gray-600'}`}>
            {fileIcon}
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-medium truncate ${isOwnMessage ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
              {fileName || "File unavailable"}
            </div>
            <div className={`text-xs ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
              File could not be loaded
            </div>
            <button 
              onClick={handleRetry}
              className={`text-xs mt-1 ${isOwnMessage ? 'text-white hover:text-blue-100' : 'text-blue-500 hover:text-blue-700'}`}
            >
              Try again
            </button>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              window.open(normalizedUrl, '_blank');
            }}
            className={`p-2 rounded-full ${isOwnMessage ? 'text-white hover:bg-blue-400' : 'text-gray-500 hover:bg-gray-200'}`}
            title="Open directly"
          >
            <FaDownload size={16} />
          </button>
        </div>
      </div>
    );
  };
  
  // Show loading or error state
  if (isLoading) {
    return (
      <div className={`rounded-lg p-3 ${isOwnMessage ? 'bg-blue-500' : 'bg-white dark:bg-gray-700'}`}>
        <div className="flex items-center">
          <div className="animate-pulse w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg mr-3"></div>
          <div className="flex-1">
            <div className="animate-pulse h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
            <div className="animate-pulse h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!fileExists) {
    return <FileErrorDisplay />;
  }

  return (
    <div 
      className={`rounded-lg p-3 ${isOwnMessage ? 'bg-blue-500' : 'bg-white dark:bg-gray-700'}`}
      onClick={(e) => {
        e.preventDefault();
        handleDownload(e);
      }}
    >
      <div className="flex items-center">
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg mr-3 flex items-center justify-center ${isOwnMessage ? 'bg-blue-400' : 'bg-gray-200 dark:bg-gray-600'}`}>
          {fileIcon}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium truncate ${isOwnMessage ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
            {fileName || "Document"}
          </div>
          <div className={`text-xs ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
            {fileTypeLabel}
          </div>
        </div>
        <FaDownload 
          className={`flex-shrink-0 ${isOwnMessage ? 'text-white' : 'text-gray-500'} cursor-pointer`} 
          size={16}
          onClick={(e) => {
            e.stopPropagation();
            handleDownload(e);
          }}
        />
      </div>
    </div>
  );
};

export default WhatsAppStyleMedia; 
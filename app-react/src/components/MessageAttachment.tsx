"use client";

import { useState } from 'react';
import { FaFile, FaImage, FaVideo, FaMusic, FaFilePdf, FaFileWord, FaFileExcel, FaFilePowerpoint, FaDownload } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';

interface MessageAttachmentProps {
  fileUrl: string;
  fileType: string;
  fileName: string;
}

const MessageAttachment: React.FC<MessageAttachmentProps> = ({ fileUrl, fileType, fileName }) => {
  const [showModal, setShowModal] = useState(false);
  
  const getFileIcon = () => {
    switch (fileType) {
      case 'image':
        return <FaImage className="text-blue-500 text-xl" />;
      case 'video':
        return <FaVideo className="text-red-500 text-xl" />;
      case 'audio':
        return <FaMusic className="text-purple-500 text-xl" />;
      case 'document':
        const extension = fileName.split('.').pop()?.toLowerCase();
        if (extension === 'pdf') {
          return <FaFilePdf className="text-red-600 text-xl" />;
        } else if (['doc', 'docx'].includes(extension || '')) {
          return <FaFileWord className="text-blue-600 text-xl" />;
        } else if (['xls', 'xlsx'].includes(extension || '')) {
          return <FaFileExcel className="text-green-600 text-xl" />;
        } else if (['ppt', 'pptx'].includes(extension || '')) {
          return <FaFilePowerpoint className="text-orange-600 text-xl" />;
        }
        return <FaFile className="text-gray-500 text-xl" />;
      default:
        return <FaFile className="text-gray-500 text-xl" />;
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    const fileUrlWithLeadingSlash = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
    link.href = fileUrl.startsWith('http') ? fileUrl : fileUrlWithLeadingSlash;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderAttachment = () => {
    const fullUrl = fileUrl.startsWith('http') 
      ? fileUrl 
      : fileUrl.startsWith('/') 
        ? fileUrl 
        : `/${fileUrl}`;
    
    switch (fileType) {
      case 'image':
        return (
          <div className="relative max-w-xs">
            <img
              src={fullUrl}
              alt={fileName}
              className="rounded-md max-h-56 cursor-pointer"
              onClick={() => setShowModal(true)}
            />
          </div>
        );
      case 'video':
        return (
          <div className="rounded-md overflow-hidden max-w-xs">
            <video
              controls
              className="max-h-56 w-full"
              src={fullUrl}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );
      case 'audio':
        return (
          <div className="rounded-md overflow-hidden max-w-xs w-full">
            <audio
              controls
              className="w-full"
              src={fullUrl}
            >
              Your browser does not support the audio tag.
            </audio>
          </div>
        );
      default:
        return (
          <div className="flex items-center p-2 bg-gray-100 rounded-md max-w-xs">
            <div className="flex items-center justify-center w-10 h-10 mr-2 bg-gray-200 rounded">
              {getFileIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {fileName}
              </p>
            </div>
            <button
              onClick={handleDownload}
              className="ml-2 flex-shrink-0 p-1 text-gray-500 rounded-full hover:text-gray-700 focus:outline-none"
            >
              <FaDownload className="w-4 h-4" />
            </button>
          </div>
        );
    }
  };

  return (
    <>
      {renderAttachment()}
      
      {/* Image Modal */}
      {showModal && fileType === 'image' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="relative max-w-4xl max-h-screen p-4">
            <button
              className="absolute top-2 right-2 bg-white rounded-full p-2"
              onClick={() => setShowModal(false)}
            >
              <IoClose className="w-6 h-6" />
            </button>
            <img
              src={fileUrl.startsWith('http') ? fileUrl : `/${fileUrl.replace(/^\//, '')}`}
              alt={fileName}
              className="max-w-full max-h-screen object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default MessageAttachment;

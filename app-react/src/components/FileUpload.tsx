"use client";

import { useState, useRef } from 'react';
import { FaFile, FaImage, FaVideo, FaMusic, FaFilePdf, FaFileWord, FaFileExcel, FaFilePowerpoint } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      setFileName(file.name);
      
      // Determine file type
      if (file.type.startsWith('image/')) {
        setFileType('image');
        // Create preview for images
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        setFileType('video');
        setPreviewUrl(null);
      } else if (file.type.startsWith('audio/')) {
        setFileType('audio');
        setPreviewUrl(null);
      } else {
        setFileType('document');
        setPreviewUrl(null);
      }
      
      onFileSelect(file);
    } else {
      clearFile();
    }
  };

  const clearFile = () => {
    setPreviewUrl(null);
    setFileName(null);
    setFileType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileSelect(null);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = () => {
    if (!fileType) return null;
    
    switch (fileType) {
      case 'image':
        return <FaImage className="text-blue-500 text-xl" />;
      case 'video':
        return <FaVideo className="text-red-500 text-xl" />;
      case 'audio':
        return <FaMusic className="text-purple-500 text-xl" />;
      case 'document':
        if (fileName) {
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
        }
        return <FaFile className="text-gray-500 text-xl" />;
      default:
        return <FaFile className="text-gray-500 text-xl" />;
    }
  };

  return (
    <div className="my-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
      />
      
      {!fileName ? (
        <button
          onClick={triggerFileInput}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Attach File
        </button>
      ) : (
        <div className="flex items-center p-2 bg-gray-100 rounded-md">
          {previewUrl && fileType === 'image' ? (
            <div className="relative w-16 h-16 mr-2">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover rounded"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center w-16 h-16 mr-2 bg-gray-200 rounded">
              {getFileIcon()}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {fileName}
            </p>
          </div>
          
          <button
            onClick={clearFile}
            className="ml-2 flex-shrink-0 p-1 text-gray-500 rounded-full hover:text-gray-700 focus:outline-none"
          >
            <IoClose className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;

// Define API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Define types for request bodies that fix TypeScript errors
type RequestBodyValue = string | number | boolean | string[] | Record<string, unknown> | undefined;

interface RequestBody {
  [key: string]: RequestBodyValue;
}

// Define custom fetch options type that correctly handles our body type
interface CustomRequestOptions extends Omit<RequestInit, 'body'> {
  body?: RequestBody;
}

// Add these imports at the top
import { apiCache } from './cache';

// Add these cache-related constants
const CACHE_GET_REQUESTS = true; // Enable caching for GET requests
const DISABLE_CACHE_QUERY_PARAM = '_nocache';

// Define fetch wrapper with error handling
const fetchAPI = async (endpoint: string, options?: CustomRequestOptions) => {
  try {
    // Check if we should use cache (only for GET requests)
    const method = options?.method || 'GET';
    const shouldUseCache = CACHE_GET_REQUESTS && method === 'GET' && !endpoint.includes(DISABLE_CACHE_QUERY_PARAM);
    
    // Try to get from cache first if it's a GET request
    if (shouldUseCache) {
      const cachedData = apiCache.get(endpoint);
      if (cachedData) {
        console.log(`API Cache hit: ${endpoint}`);
        return cachedData;
      }
    }
    
    // Get JWT token from localStorage (safely)
    let token = null;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem("jwt");
    }
    
    // Add debug logging
    console.log(`API Request: ${endpoint}`, { hasToken: !!token, method });

    // Create headers with auth token
    const headers = new Headers({
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });

    // Add any custom headers from options
    if (options?.headers) {
      const customHeaders = options.headers as Record<string, string>;
      Object.keys(customHeaders).forEach(key => {
        headers.append(key, customHeaders[key]);
      });
    }

    // Extract the body if present
    const { body, ...restOptions } = options || {};

    // Build request options without the body
    const requestInit: RequestInit = {
      ...restOptions,
      headers,
    };

    // Add body if present as a JSON string
    if (body) {
      requestInit.body = JSON.stringify(body);
    }

    // Call the API
    const response = await fetch(`${API_URL}${endpoint}`, requestInit);

    // Handle non-2xx responses
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Something went wrong");
    }

    // Parse response JSON
    const data = await response.json();
    
    // Store in cache if it's a cacheable request
    if (shouldUseCache) {
      apiCache.set(endpoint, data);
    }
    
    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// Auth API
export const loginUser = (email: string, password: string) =>
  fetchAPI("/auth/login", { method: "POST", body: { email, password } });

export const registerUser = (name: string, email: string, password: string) =>
  fetchAPI("/auth/register", { method: "POST", body: { name, email, password } });

export const getProfile = () => fetchAPI("/auth/profile");

// Chat API
export const fetchAllChats = () => fetchAPI("/chats");

export const fetchChat = (id: string) => fetchAPI(`/chats/${id}`);

export const getChat = (id: string) => fetchAPI(`/chats/${id}`);

export const createGroupChat = (userIds: string[], name: string) =>
  fetchAPI("/chats/group", { method: "POST", body: { users: userIds, name } });

export const renameGroupChat = (chatId: string, chatName: string) =>
  fetchAPI(`/chats/rename`, { method: "PUT", body: { chatId, chatName } });

export const renameGroup = (chatId: string, chatName: string) =>
  fetchAPI(`/chats/rename`, { method: "PUT", body: { chatId, chatName } });

export const addToGroup = (chatId: string, userId: string) =>
  fetchAPI("/chats/group/add", { method: "PUT", body: { chatId, userId } });

export const removeFromGroup = (chatId: string, userId: string) =>
  fetchAPI("/chats/group/remove", { method: "PUT", body: { chatId, userId } });

// Message API
export const sendMessage = async (content: string, chatId: string, file?: File) => {
  if (!file) {
    return fetchAPI("/messages", { method: "POST", body: { content, chatId } });
  } else {
    const formData = new FormData();
    formData.append("content", content || "");
    formData.append("chatId", chatId);
    
    try {
      // Log detailed file information for debugging
      console.log("File details:", {
        name: file.name,
        type: file.type,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        lastModified: new Date(file.lastModified).toISOString()
      });
      
      // Validate file size based on type
      const fileSizeMB = file.size / (1024 * 1024);
      let maxSizeMB = 10; // Default 10MB
      
      if (file.type.startsWith('image/')) {
        maxSizeMB = 10; // 10MB for images
      } else if (file.type.startsWith('video/')) {
        maxSizeMB = 50; // 50MB for videos
      } else if (file.type.startsWith('audio/')) {
        maxSizeMB = 20; // 20MB for audio
      } else {
        maxSizeMB = 25; // 25MB for documents
      }
      
      if (fileSizeMB > maxSizeMB) {
        throw new Error(`File size exceeds the ${maxSizeMB}MB limit for this type of file.`);
      }
      
      // Validate file types for videos
      if (file.type.startsWith('video/')) {
        const supportedVideoFormats = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
        if (!supportedVideoFormats.includes(file.type)) {
          throw new Error(`Unsupported video format. Please use ${supportedVideoFormats.map(f => f.replace('video/', '')).join(', ')}`);
        }
        // For large videos, provide better user feedback
        if (file.size > 10 * 1024 * 1024) { // 10MB
          console.warn(`Large video file (${(file.size / (1024 * 1024)).toFixed(1)} MB) - upload may take some time`);
        }
      }
      
      // Append file with a more specific name for the server to process correctly
      if (file.type.startsWith('video/')) {
        formData.append("videoFile", file); // Use a specific field name for videos
      } else {
        formData.append("file", file);
      }
      
      // Get the token from localStorage (safely)
      let token = null;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem("jwt");
      }
      
      // Create a controller to allow aborting the upload if it takes too long
      // Increase timeout based on file size - 10 minutes base + 5 minutes per 100MB for large files
      const controller = new AbortController();
      const baseTimeout = 600000; // 10 minutes base timeout (up from 4 minutes)
      let extraTime = 0;
      
      // For videos, add extra time based on size
      if (file.type.startsWith('video/')) {
        // Add 5 minutes per 100MB for videos
        const fileSizeMB = file.size / (1024 * 1024);
        extraTime = Math.floor(fileSizeMB / 100) * 300000;
      }
      
      const totalTimeout = baseTimeout + extraTime;
      console.log(`Setting upload timeout to ${totalTimeout/1000/60} minutes`);
      
      const timeoutId = setTimeout(() => {
        console.error(`Upload timed out after ${totalTimeout/1000/60} minutes`);
        controller.abort();
      }, totalTimeout);
      
      console.log("Starting file upload...");
      
      // Add progress tracking if browser supports it
      const trackUploadProgress = (file.size > 5 * 1024 * 1024); // Only for files > 5MB
      let progressIntervalId: NodeJS.Timeout | null = null;
      
      if (trackUploadProgress) {
        // Create a simple progress tracker based on time since we don't have actual progress events
        const startTime = Date.now();
        progressIntervalId = setInterval(() => {
          const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
          console.log(`Upload in progress... (${elapsedSeconds}s elapsed)`);
        }, 3000); // Log every 3 seconds
      }
      
      try {
        const response = await fetch(`${API_URL}/messages`, {
          method: "POST",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: formData,
          signal: controller.signal
        });
        
        // Clear timers
        clearTimeout(timeoutId);
        if (progressIntervalId) clearInterval(progressIntervalId);
        
        if (!response.ok) {
          let errorMessage = "Failed to send message";
          
          // Handle specific HTTP status codes
          if (response.status === 413) {
            errorMessage = "File is too large. Please use a smaller file.";
          } else if (response.status === 415) {
            errorMessage = "File type not supported.";
          } else if (response.status === 401) {
            errorMessage = "Session expired. Please log in again.";
          } else if (response.status === 500) {
            errorMessage = "Server error processing the file. Try a different format or smaller file.";
          } else {
            // Try to parse error response as JSON
            try {
              const errorData = await response.json();
              errorMessage = errorData.message || errorMessage;
            } catch {
              // If parsing JSON fails, use text response or default message
              try {
                const textError = await response.text();
                errorMessage = textError || errorMessage;
              } catch {
                // Use default error message if everything fails
              }
            }
          }
          
          console.error("API Error during file upload:", {
            status: response.status,
            statusText: response.statusText,
            errorMessage
          });
          throw new Error(errorMessage);
        }
        
        // Handle successful response
        const data = await response.json();
        console.log("File upload completed successfully");
        return data;
      } catch (fetchError) {
        // Make sure to clear interval if there was an error
        if (progressIntervalId) clearInterval(progressIntervalId);
        throw fetchError; // Re-throw to be caught by outer catch
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.error("Upload timeout");
        throw new Error("Upload took too long and was canceled. For video files, try using a smaller file size, lower resolution, or different format (MP4 recommended).");
      }
      
      // For network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error("Network error during upload:", error);
        throw new Error("Network error. Please check your internet connection and try again.");
      }
      
      console.error("Error sending message with file:", error);
      
      // Re-throw with clear message
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error("Failed to send message. Please try again.");
      }
    }
  }
};

export const getMessages = (chatId: string) => fetchAPI(`/messages/${chatId}`);

// Campaign API
export const createSMSCampaign = (title: string, content: string, users: string[]) => 
  fetchAPI("/campaigns", { method: "POST", body: { title, content, users } });

export const getCampaigns = () => fetchAPI("/campaigns");

export const getCampaignById = (id: string) => fetchAPI(`/campaigns/${id}`);

// Message deletion API
export const deleteMessageForMe = (messageId: string) => 
  fetchAPI(`/messages/${messageId}/forMe`, { method: "DELETE" });

export const deleteMessageForEveryone = (messageId: string) => 
  fetchAPI(`/messages/${messageId}/forEveryone`, { method: "DELETE" });

// Message read status API
export const markMessagesAsRead = (chatId: string) => 
  fetchAPI("/messages/read", { method: "PUT", body: { chatId } });

// Message delivered status API
export const markMessagesAsDelivered = (chatId: string) => 
  fetchAPI("/messages/deliver", { method: "PUT", body: { chatId } });

// User API
export const searchUsers = (search: string) => fetchAPI(`/users?search=${search}`);

// User profile functions
export const updateUserProfile = (userData: { name?: string; email?: string; phoneNumber?: string }) => 
  fetchAPI("/users/profile", { method: "PUT", body: userData });

export const updatePassword = (currentPassword: string, newPassword: string) => 
  fetchAPI("/users/password", { method: "PUT", body: { currentPassword, newPassword } });

export const updateProfilePicture = async (file: File) => {
  // Create form data
  const formData = new FormData();
  formData.append("profilePic", file);
  
  try {
    // Get token
    let token = null;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem("jwt");
    }
    
    const response = await fetch(`${API_URL}/users/profile-picture`, {
      method: "PUT",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: formData
    });
    
    if (!response.ok) {
      let errorMessage = "Failed to update profile picture";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Use default message
      }
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error updating profile picture:", error);
    throw error;
  }
};

// User settings functions
export const getUserSettings = () => fetchAPI("/users/settings");

export const updateUserSettings = (settings: { 
  notifications?: boolean; 
  darkMode?: boolean;
  language?: string;
  messagePreview?: boolean;
  soundEnabled?: boolean;
  textMessageLengthLimit?: number;
  enforceLengthLimit?: boolean;
}) => fetchAPI("/users/settings", { method: "PUT", body: settings });

// Add these utility functions

// Helper to invalidate cache for a specific endpoint
export const invalidateCache = (endpoint: string) => {
  apiCache.invalidate(endpoint);
};

// Helper to invalidate all cache related to a specific resource
export const invalidateCacheForResource = (resource: string) => {
  apiCache.invalidateByPrefix(`/${resource}`);
};

// Helper to clear all cache (useful after logout)
export const clearCache = () => {
  apiCache.clear();
};

// Update the logout function to clear cache
export const logout = () => {
  console.log("Logging out");
  if (typeof window !== 'undefined') {
    localStorage.removeItem("jwt");
  }
  // Clear API cache when logging out
  clearCache();
};

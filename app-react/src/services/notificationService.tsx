import React from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Check if notifications are enabled in user settings
const areNotificationsEnabled = () => {
  try {
    // Check localStorage for user settings
    const settingsStr = localStorage.getItem("userSettings");
    if (settingsStr) {
      const settings = JSON.parse(settingsStr);
      return settings.notifications !== false; // Default to true if not specified
    }
    return true; // Default to enabled if no settings found
  } catch (error) {
    console.error("Error checking notification settings:", error);
    return true; // Default to enabled on error
  }
};

// Check if message preview is enabled in user settings
const isMessagePreviewEnabled = () => {
  try {
    const settingsStr = localStorage.getItem("userSettings");
    if (settingsStr) {
      const settings = JSON.parse(settingsStr);
      return settings.messagePreview !== false; // Default to true if not specified
    }
    return true; // Default to enabled if no settings found
  } catch (error) {
    console.error("Error checking message preview settings:", error);
    return true; // Default to enabled on error
  }
};

// Request browser notification permissions
export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.log("This browser does not support desktop notifications");
    return false;
  }
  
  if (Notification.permission === "granted") {
    return true;
  }
  
  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  
  return false;
};

// Show a browser notification
const showBrowserNotification = (title: string, message: string, sender: string, profilePic?: string) => {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }
  
  // Don't show content in notification if message preview is disabled
  const notificationMessage = isMessagePreviewEnabled() ? message : "New message received";
  
  // Create notification
  const notification = new Notification(title, {
    body: notificationMessage,
    icon: profilePic || "/favicon.ico", // Default to app icon if no profile pic
    tag: "message-notification",
    silent: false
  });
  
  // Handle notification click
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
  
  // Auto close after 5 seconds
  setTimeout(() => {
    notification.close();
  }, 5000);
};

// Play notification sound if enabled
const playNotificationSound = () => {
  try {
    const settingsStr = localStorage.getItem("userSettings");
    if (settingsStr) {
      const settings = JSON.parse(settingsStr);
      if (settings.soundEnabled) {
        const audio = new Audio("/notification-sound.mp3");
        audio.play().catch(err => console.error("Error playing notification sound:", err));
      }
    }
  } catch (error) {
    console.error("Error playing notification sound:", error);
  }
};

export const showNotification = (title: string, message: string, sender: string, profilePic?: string) => {
  // Check if notifications are enabled in user settings
  if (!areNotificationsEnabled()) {
    return;
  }
  
  // Show toast notification
  toast.info(
    <div>
      <div className="font-bold">{title}</div>
      <div className="text-sm text-gray-600">{sender}</div>
      <div className="mt-1">{isMessagePreviewEnabled() ? message : "New message received"}</div>
    </div>,
    {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    }
  );
  
  // Show browser notification
  showBrowserNotification(title, message, sender, profilePic);
  
  // Play notification sound
  playNotificationSound();
};

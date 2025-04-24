"use client";

import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import dynamic from 'next/dynamic';
import { Suspense, useEffect, useState } from 'react';
import LanguageProvider from '@/components/LanguageProvider';

// Lazily load the ToastContainer to improve initial load time
const ToastContainer = dynamic(
  () => import('react-toastify').then(mod => mod.ToastContainer),
  { 
    ssr: false, 
    loading: () => null,
  }
);

// Dynamically load NavBar to improve initial load time
const NavBar = dynamic(
  () => import('@/components/NavBar'),
  { 
    ssr: false,
    loading: () => null 
  }
);

// Dynamically load SettingsGuide
const SettingsGuide = dynamic(
  () => import('@/components/SettingsGuide'),
  { 
    ssr: false,
    loading: () => null 
  }
);

// Add a loading spinner for the page content
const LoadingSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// Add CSS for the navbar
function RootLayoutInner({ children }: { children: React.ReactNode }) {
  const [hideNavbar, setHideNavbar] = useState(false);
  const [showSettingsGuide, setShowSettingsGuide] = useState(false);
  
  useEffect(() => {
    // Initialize dark mode from user settings
    try {
      const settingsStr = localStorage.getItem("userSettings");
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        if (settings.darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } catch (error) {
      console.error("Error initializing dark mode:", error);
    }
    
    // Check if we're on login or register page
    const path = window.location.pathname;
    if (path === '/login' || path === '/register') {
      setHideNavbar(true);
    } else {
      setHideNavbar(false);
      
      // Show settings guide if we're on a page that might need settings
      // (and not on settings or profile page)
      const needsGuide = path === '/chat' || path === '/' || path.includes('/admin');
      const alreadyOnSettings = path.includes('/settings') || path.includes('/profile');
      
      setShowSettingsGuide(needsGuide && !alreadyOnSettings);
    }
    
    // Listen for route changes
    const handleRouteChange = () => {
      const newPath = window.location.pathname;
      if (newPath === '/login' || newPath === '/register') {
        setHideNavbar(true);
      } else {
        setHideNavbar(false);
      }
    };
    
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);
  
  return (
    <div className="flex flex-col min-h-screen">
      {!hideNavbar && <NavBar />}
      {!hideNavbar && showSettingsGuide && <SettingsGuide />}
      <div className={`flex-1 ${!hideNavbar ? 'pt-2' : ''}`}>
        {children}
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<string>('en');
  
  useEffect(() => {
    // Initialize settings from localStorage
    try {
      const settingsStr = localStorage.getItem("userSettings");
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        setThemeMode(settings.darkMode ? 'dark' : 'light');
        if (settings.language) {
          setLanguage(settings.language);
        }
      }
    } catch (error) {
      console.error("Error loading settings in root layout:", error);
    }
  }, []);

  return (
    <html lang={language}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="description" content="LetterChat - Real-time messaging application" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body className="font-sans">
        <AuthProvider>
          <LanguageProvider>
            <Suspense fallback={<LoadingSpinner />}>
              <RootLayoutInner>
                {children}
              </RootLayoutInner>
            </Suspense>
            <ToastContainer 
              position="top-right" 
              autoClose={3000} 
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={['ar'].includes(language)}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme={themeMode}
            />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

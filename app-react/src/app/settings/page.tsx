"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getUserSettings, updateUserSettings } from '@/services/api';
import { toast } from 'react-toastify';
import { useLanguage } from '@/components/LanguageProvider';
import { 
  FaCog, 
  FaBell, 
  FaPalette, 
  FaSignOutAlt
} from 'react-icons/fa';

interface UserSettings {
  notifications: boolean;
  darkMode: boolean;
  language: string;
  messagePreview: boolean;
  soundEnabled: boolean;
  textMessageLengthLimit: number;
  enforceLengthLimit: boolean;
}

const defaultSettings: UserSettings = {
  notifications: true,
  darkMode: false,
  language: 'en',
  messagePreview: true,
  soundEnabled: true,
  textMessageLengthLimit: 160,
  enforceLengthLimit: true
};

export default function Settings() {
  const { user, loading, logout } = useAuth();
  const { setLanguage, t } = useLanguage();
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [originalSettings, setOriginalSettings] = useState<UserSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load user settings on mount
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      toast.error('Please log in to access settings');
      return;
    }

    const loadSettings = async () => {
      try {
        setIsLoading(true);
        // Try to get user settings from API
        const data = await getUserSettings();
        const loadedSettings = {
          ...defaultSettings,
          ...data
        };
        setSettings(loadedSettings);
        setOriginalSettings(loadedSettings);
      } catch (error) {
        console.error('Failed to load settings:', error);
        // Fall back to defaults if API fails
        toast.warning('Using default settings');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadSettings();
    }
  }, [user, loading, router]);

  // Check if settings have changed from original
  const hasChanges = () => {
    return (
      settings.notifications !== originalSettings.notifications ||
      settings.darkMode !== originalSettings.darkMode ||
      settings.language !== originalSettings.language ||
      settings.messagePreview !== originalSettings.messagePreview ||
      settings.soundEnabled !== originalSettings.soundEnabled ||
      settings.textMessageLengthLimit !== originalSettings.textMessageLengthLimit ||
      settings.enforceLengthLimit !== originalSettings.enforceLengthLimit
    );
  };

  // Handle updates to settings
  const handleToggle = (setting: keyof UserSettings) => {
    setSettings({
      ...settings,
      [setting]: !settings[setting]
    });
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings({
      ...settings,
      language: e.target.value
    });
    setLanguage(e.target.value);  // Update language in the provider too
  };

  // Reset settings to original values
  const handleCancel = () => {
    setSettings(originalSettings);
    toast.info('Changes cancelled');
  };

  // Save settings to server
  const saveSettings = async () => {
    if (!hasChanges()) {
      toast.info(t('No changes to save'));
      return;
    }

    setIsSaving(true);
    try {
      await updateUserSettings(settings);
      
      // Update original settings to match current
      setOriginalSettings(settings);
      
      // Store settings in localStorage for other components to access
      localStorage.setItem("userSettings", JSON.stringify(settings));
      
      // Apply theme if dark mode changed
      if (settings.darkMode !== originalSettings.darkMode) {
        document.documentElement.classList.toggle('dark', settings.darkMode);
      }
      
      toast.success(t('Settings saved successfully'));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('Failed to save settings');
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
    toast.success('Logged out successfully');
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6 flex items-center">
          <FaCog className="mr-2" /> {t('Settings')}
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {/* Notification Settings Section */}
          <div className="p-6 border-b dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FaBell className="mr-2" /> {t('Notifications')}
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t('Notifications')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('Enable notifications')}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.notifications}
                    onChange={() => handleToggle('notifications')}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>
        
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t('Message Previews')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('Show message content in notifications')}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.messagePreview}
                    onChange={() => handleToggle('messagePreview')}
                    disabled={!settings.notifications}
                  />
                  <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                    settings.notifications
                      ? 'bg-gray-200 peer-checked:bg-blue-500 dark:bg-gray-700'
                      : 'bg-gray-300 cursor-not-allowed dark:bg-gray-600'
                  }`}></div>
                </label>
              </div>
            
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t('Sound Effects')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('Play sounds for messages and notifications')}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.soundEnabled}
                    onChange={() => handleToggle('soundEnabled')}
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>
            </div>
          </div>
          
          {/* Appearance Section */}
          <div className="p-6 border-b dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FaPalette className="mr-2" /> {t('Appearance')}
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t('Dark Mode')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('Switch to dark theme')}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.darkMode}
                    onChange={() => handleToggle('darkMode')}
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t('Language')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('Select your preferred language')}</p>
                </div>
                <select
                  value={settings.language}
                  onChange={handleLanguageChange}
                  className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="pt">Português</option>
                  <option value="ar">العربية</option>
                  <option value="zh">中文</option>
                  <option value="ja">日本語</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="p-6 flex justify-end gap-4">
            <button
              onClick={handleCancel}
              disabled={!hasChanges() || isSaving}
              className={`px-4 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 dark:border-gray-600 ${
                hasChanges() && !isSaving
                  ? 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              {t('Cancel')}
            </button>
            
            <button
              onClick={saveSettings}
              disabled={!hasChanges() || isSaving}
              className={`px-4 py-2 bg-blue-500 text-white rounded-md ${
                hasChanges() && !isSaving
                  ? 'hover:bg-blue-600'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <span className="flex items-center">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  {t('Saving...')}
                </span>
              ) : (
                t('Save Changes')
              )}
            </button>
          </div>
          
          {/* Logout Button */}
          <div className="p-6 border-t dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center text-red-500 hover:text-red-700"
            >
              <FaSignOutAlt className="mr-2" /> {t('Logout')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
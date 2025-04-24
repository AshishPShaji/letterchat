"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

// Define available languages
const availableLanguages = ['en', 'es', 'fr', 'de', 'ar', 'pt', 'zh', 'ja'];

// Initialize translations object
const translations: Record<string, Record<string, string>> = {
  en: {
    // Default language, use as keys
  },
  es: {
    'Settings': 'Configuración',
    'Dark Mode': 'Modo oscuro',
    'Language': 'Idioma',
    'Notifications': 'Notificaciones',
    'Sound Effects': 'Efectos de sonido',
    'Message Previews': 'Vista previa de mensajes',
    'Save Changes': 'Guardar cambios',
    'Cancel': 'Cancelar',
    'Logout': 'Cerrar sesión'
    // Add more translations as needed
  },
  fr: {
    'Settings': 'Paramètres',
    'Dark Mode': 'Mode sombre',
    'Language': 'Langue',
    'Notifications': 'Notifications',
    'Sound Effects': 'Effets sonores',
    'Message Previews': 'Aperçus des messages',
    'Save Changes': 'Enregistrer les modifications',
    'Cancel': 'Annuler',
    'Logout': 'Déconnexion'
    // Add more translations as needed
  },
  de: {
    'Settings': 'Einstellungen',
    'Dark Mode': 'Dunkelmodus',
    'Language': 'Sprache',
    'Notifications': 'Benachrichtigungen',
    'Sound Effects': 'Soundeffekte',
    'Message Previews': 'Nachrichtenvorschau',
    'Save Changes': 'Änderungen speichern',
    'Cancel': 'Abbrechen',
    'Logout': 'Abmelden'
    // Add more translations as needed
  },
  ar: {
    'Settings': 'الإعدادات',
    'Dark Mode': 'الوضع المظلم',
    'Language': 'اللغة',
    'Notifications': 'الإشعارات',
    'Sound Effects': 'المؤثرات الصوتية',
    'Message Previews': 'معاينة الرسائل',
    'Save Changes': 'حفظ التغييرات',
    'Cancel': 'إلغاء',
    'Logout': 'تسجيل الخروج'
    // Add more translations as needed
  },
  // Add Japanese translations
  ja: {
    'Settings': '設定',
    'Dark Mode': 'ダークモード',
    'Language': '言語',
    'Notifications': '通知',
    'Sound Effects': '効果音',
    'Message Previews': 'メッセージプレビュー',
    'Save Changes': '変更を保存',
    'Cancel': 'キャンセル',
    'Logout': 'ログアウト',
    'No changes to save': '保存する変更はありません',
    'Settings saved successfully': '設定が正常に保存されました',
    'Failed to save settings': '設定の保存に失敗しました',
    'Appearance': '外観',
    'Switch to dark theme': 'ダークテーマに切り替える',
    'Select your preferred language': '希望の言語を選択してください',
    'Enable notifications': '通知を有効にする',
    'Show message content in notifications': '通知にメッセージの内容を表示する',
    'Play sounds for messages and notifications': 'メッセージと通知のサウンドを再生する',
    'Saving...': '保存中...'
  },
  // Add more languages as needed
};

// Create context
interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key
});

export const useLanguage = () => useContext(LanguageContext);

// Provider component
export const LanguageProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [language, setLanguage] = useState('en');

  // Load language from localStorage on mount
  useEffect(() => {
    try {
      const settingsStr = localStorage.getItem("userSettings");
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        if (settings.language && availableLanguages.includes(settings.language)) {
          setLanguage(settings.language);
        }
      }
    } catch (error) {
      console.error("Error loading language setting:", error);
    }
  }, []);

  // Update language in localStorage when it changes
  useEffect(() => {
    try {
      const settingsStr = localStorage.getItem("userSettings");
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        settings.language = language;
        localStorage.setItem("userSettings", JSON.stringify(settings));
      }
    } catch (error) {
      console.error("Error saving language setting:", error);
    }
  }, [language]);

  // Translation function
  const t = (key: string): string => {
    if (language === 'en') return key;
    return translations[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageProvider; 
'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import enMessages from '@/i18n/messages/en.json';
import amMessages from '@/i18n/messages/am.json';
import omMessages from '@/i18n/messages/om.json';

const TranslationContext = createContext();
const TRANSLATIONS = {
  en: enMessages,
  am: amMessages,
  om: omMessages,
};
const SUPPORTED_LOCALES = ['en', 'am', 'om'];

function resolveKey(strings, key) {
  // ✅ FIX: Return undefined if key is not valid
  if (!key || typeof key !== 'string') {
    return undefined;
  }
  
  try {
    return key.split('.').reduce((current, segment) => {
      if (current && typeof current === 'object') {
        return current[segment];
      }
      return undefined;
    }, strings);
  } catch (error) {
    console.warn(`Error resolving key "${key}":`, error);
    return undefined;
  }
}

function formatString(template, params) {
  if (typeof template !== 'string' || !params) return template;
  return template.replace(/\{(\w+)\}/g, (_, name) => {
    return params[name] != null ? params[name] : `{${name}}`;
  });
}

export function TranslationProvider({ children }) {
  const [locale, setLocale] = useState('en');
  const [messages, setMessages] = useState(TRANSLATIONS.en);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') || 'en';
    const normalized = SUPPORTED_LOCALES.includes(savedLocale) ? savedLocale : 'en';
    setLocale(normalized);
    setMessages(TRANSLATIONS[normalized] || TRANSLATIONS.en);
    document.documentElement.lang = normalized;
    setLoading(false);
  }, []);

  const changeLanguage = async (newLocale) => {
    if (!SUPPORTED_LOCALES.includes(newLocale)) return;

    setLocale(newLocale);
    setMessages(TRANSLATIONS[newLocale] || TRANSLATIONS.en);
    localStorage.setItem('locale', newLocale);
    document.documentElement.lang = newLocale;

    try {
      await fetch('/api/set-local', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locale: newLocale }),
      });
    } catch (error) {
      console.warn('Unable to persist locale cookie:', error);
    }
  };

  const t = (key, params) => {
    // ✅ FIX: Return a fallback if key is invalid
    if (!key || typeof key !== 'string') {
      return key || '';
    }
    
    const matchedMessage = resolveKey(messages, key);
    if (matchedMessage != null && typeof matchedMessage === 'string') {
      return formatString(matchedMessage, params);
    }

    const fallbackMessage = resolveKey(TRANSLATIONS.en, key);
    if (fallbackMessage != null && typeof fallbackMessage === 'string') {
      return formatString(fallbackMessage, params);
    }

    // Return a readable fallback from the key itself
    const keyParts = key.split('.');
    const fallbackKey = keyParts[keyParts.length - 1];
    return fallbackKey || key;
  };

  return (
    <TranslationContext.Provider value={{ t, locale, changeLanguage, loading }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}
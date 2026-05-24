'use client';

import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { FaGlobe, FaCheckCircle } from 'react-icons/fa';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'am', name: 'አማርኛ', flag: '🇪🇹' },
  { code: 'om', name: 'Afan Oromoo', flag: '🇪🇹' }
];

export default function LanguageSwitcher() {
  const { locale, changeLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = locale || 'en';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
      >
        <FaGlobe className="text-gray-600" />
        <span className="text-sm font-medium">
          {languages.find(l => l.code === currentLang)?.flag} {languages.find(l => l.code === currentLang)?.name}
        </span>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                changeLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg flex items-center gap-2 ${
                currentLang === lang.code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
              {currentLang === lang.code && <FaCheckCircle className="ml-auto text-xs" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
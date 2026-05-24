'use client';
import { useTranslation } from '@/hooks/useTranslation';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { FaArrowRight, FaGlobe } from 'react-icons/fa';
import { FaCheckCircle } from 'react-icons/fa';
import { useState } from 'react';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'am', name: 'አማርኛ', flag: '🇪🇹' },
  { code: 'om', name: 'Afan Oromoo', flag: '🇪🇹' }
];

const ROLE_LABELS = {
  'System Administrator': 'roles.systemAdministrator',
  'Kebele Manager': 'roles.kebeleManager',
  'Record Officer': 'roles.recordOfficer',
  Resident: 'roles.resident',
};

function LayoutContent({ children, role }) {
  const { t, locale, changeLanguage, loading } = useTranslation();
  const [isLangOpen, setIsLangOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      <div className="fixed left-0 top-0 h-screen z-20 shadow-2xl">
        <Sidebar role={role} />
      </div>

      <div className="flex-1 ml-72">
        <Navbar />
        
        <div className="p-8 animate-[fadeIn_0.5s_ease-out] mt-20">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="hover:text-blue-600 transition-colors cursor-pointer">
                  {t('nav.dashboard')}
                </span>
                <FaArrowRight className="text-xs" />
                <span className="text-gray-700 font-medium">{t(ROLE_LABELS[role] || role)}</span>
              </div>
              
              {/* Language Switcher */}
              <div className="relative">
                <button
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white hover:bg-gray-50 transition shadow-sm border border-gray-200"
                >
                  <FaGlobe className="text-gray-500" />
                  <span className="text-sm font-medium">
                    {languages.find(l => l.code === locale)?.flag} {languages.find(l => l.code === locale)?.name}
                  </span>
                  <svg className={`w-4 h-4 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                
                {isLangOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsLangOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 overflow-hidden">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => changeLanguage(lang.code)}
                          className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 transition flex items-center gap-3 ${
                            locale === lang.code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                          }`}
                        >
                          <span className="text-lg">{lang.flag}</span>
                          <span className="flex-1 text-sm font-medium">{lang.name}</span>
                          {locale === lang.code && <FaCheckCircle className="text-xs text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Layout({ children, role }) {
  return (
    <LayoutContent role={role}>
      {children}
    </LayoutContent>
  );
}
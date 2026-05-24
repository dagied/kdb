'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import Image from 'next/image';
import { 
  FaUserPlus, FaUsers, FaUserCog, FaCity, FaEye, 
  FaIdCard, FaSyncAlt, FaGavel, FaNewspaper, FaUserFriends,
  FaBaby, FaSkull, FaRing, FaChartBar,
  FaUser, FaClipboardList, FaTachometerAlt, FaCog, FaSignOutAlt,
  FaHome, FaUserCircle, FaBullhorn, FaTools, FaChartLine,
  FaExchangeAlt  // ✅ Added for Transfer feature
} from 'react-icons/fa';
import { MdAdminPanelSettings, MdDashboard } from 'react-icons/md';
import { GiConfirmed, GiFamilyHouse } from 'react-icons/gi';
import { IoDocumentText } from 'react-icons/io5';

export default function Sidebar({ role }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [userRole, setUserRole] = useState(null);
  const [isClient, setIsClient] = useState(false);

  // Safe translation helper - prevents errors from breaking the UI
  const safeT = (key, fallback = '') => {
    if (!key || typeof key !== 'string') {
      return fallback || '';
    }
    try {
      const result = t(key);
      if (result && typeof result === 'string') {
        return result;
      }
      // Fallback: extract last part of the key
      const parts = key.split('.');
      return parts[parts.length - 1] || key;
    } catch (error) {
      console.warn(`Translation error for key: ${key}`, error);
      const parts = key.split('.');
      return parts[parts.length - 1] || key;
    }
  };

  // Set role from prop first, then try localStorage
  useEffect(() => {
    setIsClient(true);
    
    if (role) {
      console.log('Sidebar received role prop:', role);
      setUserRole(role);
    } else {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          console.log('Sidebar got role from localStorage:', user.role);
          setUserRole(user.role);
        } catch (e) {
          console.error('Error parsing user:', e);
        }
      }
    }
  }, [role]);

  const menu = {
    "System Administrator": [
      { nameKey: 'sidebar.dashboard', path: "/dashboard/admin", icon: FaTachometerAlt },
      { nameKey: 'sidebar.myProfile', path: "/dashboard/profile", icon: FaUserCircle },
      { nameKey: 'sidebar.createStaff', path: "/dashboard/admin/add-staf", icon: FaUserPlus },
      { nameKey: 'sidebar.manageStaff', path: "/dashboard/admin/staff", icon: FaUsers },
      { nameKey: 'sidebar.manageKebele', path: "/dashboard/admin/manage-kebele", icon: FaCity },
      { nameKey: 'sidebar.manageJudges', path: "/dashboard/admin/judges", icon: FaGavel },
      { nameKey: 'sidebar.viewResidents', path: "/dashboard/admin/users", icon: FaEye },
      { nameKey: 'sidebar.makeAnnouncement', path: "/dashboard/admin/announcement", icon: FaBullhorn },
    ],

    "Kebele Manager": [
      { nameKey: 'sidebar.dashboard', path: "/dashboard/manager", icon: FaTachometerAlt },
      { nameKey: 'sidebar.myProfile', path: "/dashboard/profile", icon: FaUserCircle },
      { nameKey: 'sidebar.addResidents', path: "/dashboard/manager/add-resident", icon: FaUserPlus },
      { nameKey: 'sidebar.viewResidents', path: "/dashboard/manager/residents", icon: FaUserFriends },
      { nameKey: 'sidebar.socialCourt', path: "/dashboard/manager/social-court", icon: FaGavel },
      // In your sidebar.js, add to Kebele Manager menu:
      { nameKey: 'sidebar.lostId', path: "/dashboard/manager/lost-id", icon: FaIdCard },
      { nameKey: 'sidebar.Transfer Resident', path: "/dashboard/manager/transfer", icon: FaExchangeAlt },  // ✅ Added Transfer menu item
      { nameKey: 'sidebar.Transferred Residents', path: "/dashboard/manager/transferred-residents", icon: FaExchangeAlt },
      // { nameKey: 'sidebar.serviceAnalytics', path: "/dashboard/manager/service-analytics", icon: FaChartLine },
      // { nameKey: 'sidebar.postNews', path: "/dashboard/manager/news", icon: FaNewspaper },
    ],

    "Record Officer": [
      { nameKey: 'sidebar.dashboard', path: "/dashboard/officer", icon: FaTachometerAlt },
      { nameKey: 'sidebar.myProfile', path: "/dashboard/profile", icon: FaUserCircle },
      { nameKey: 'sidebar.giveID', path: "/dashboard/officer/give-id", icon: FaIdCard },
      { nameKey: 'sidebar.renewID', path: "/dashboard/officer/renew-id", icon: FaSyncAlt },
      { nameKey: 'sidebar.birthCertificate', path: "/dashboard/officer/birth-certificate", icon: FaBaby },
      { nameKey: 'sidebar.deathCertificate', path: "/dashboard/officer/death-certificate", icon: FaSkull },
      { nameKey: 'sidebar.marriageCertificate', path: "/dashboard/officer/marriage-certificate", icon: FaRing },
      { nameKey: 'sidebar.viewResidents', path: "/dashboard/officer/residents", icon: FaUserFriends },
      // { nameKey: 'sidebar.reports', path: "/dashboard/officer/reports", icon: FaChartBar },
    ],

    "Resident": [
      { nameKey: 'sidebar.dashboard', path: "/dashboard/resident", icon: FaTachometerAlt },
      { nameKey: 'sidebar.myProfile', path: "/dashboard/profile", icon: FaUserCircle },
      { nameKey: 'sidebar.requestService', path: "/dashboard/resident/request-service", icon: FaClipboardList },
      { nameKey: 'sidebar.viewStatus', path: "/dashboard/resident/status", icon: FaTachometerAlt }
    ]
  };

  const handleLogout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    }
    
    window.location.href = '/login';
  };

  // Show loading state while determining role
  if (!isClient || !userRole) {
    return (
      <div className="w-72 bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 text-white shadow-2xl flex flex-col h-screen">
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse text-sm text-gray-400">{safeT('sidebar.loadingMenu', 'Loading menu...')}</div>
        </div>
      </div>
    );
  }

  const currentMenu = menu[userRole];
  
  // If role not found in menu, show error
  if (!currentMenu) {
    console.error('Unknown role:', userRole);
    return (
      <div className="w-72 bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 text-white shadow-2xl flex flex-col h-screen">
        <div className="flex items-center justify-center h-full">
          <div className="text-sm text-red-400">{`Unknown role "${userRole}"`}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 text-white shadow-2xl flex flex-col h-screen">
      {/* Header */}
      <div className="p-6 border-b border-blue-700">
        <div className="flex items-center gap-3 mb-3">
          {/* Ethiopian Flag - Local Image */}
          <div className="flex flex-col items-center group">
            <div className="w-10 h-6 rounded shadow-lg overflow-hidden bg-gray-200 relative">
              <img 
                src="/et.png"
                alt="Ethiopian Flag"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://flagcdn.com/et.png";
                }}
              />
            </div>
            <span className="text-[8px] mt-0.5 text-gray-400 group-hover:text-white transition">Ethiopia</span>
          </div>
          
          {/* Oromia Flag - Local Image */}
          <div className="flex flex-col items-center group">
            <div className="w-10 h-6 rounded shadow-lg overflow-hidden bg-gray-200 relative">
              <img 
                src="/or.png"
                alt="Oromia Flag"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Flag_of_Oromia_Region.svg/1200px-Flag_of_Oromia_Region.svg.png";
                }}
              />
            </div>
            <span className="text-[8px] mt-0.5 text-gray-400 group-hover:text-white transition">Oromia</span>
          </div>
          
          <div className="flex-1 text-right">
            <h2 className="text-sm font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {safeT('dashboard.kebeleName', 'Bossa Addis Kebele')}
            </h2>
            <p className="text-[10px] text-gray-400 mt-0.5 flex items-center justify-end gap-1">
              <MdAdminPanelSettings className="text-[10px]" />
              {safeT(`roles.${userRole}`, userRole)}
            </p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="mb-4 px-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <MdDashboard />
            {safeT('sidebar.mainMenu', 'Main Menu')}
          </p>
        </div>
        
        <ul className="space-y-1.5">
          {currentMenu.map((item, index) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            
            return (
              <li key={index}>
                <Link
                  href={item.path}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                    ${isActive 
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg' 
                      : 'text-gray-300 hover:bg-blue-800 hover:text-white'
                    }
                  `}
                >
                  <Icon className={`text-xl transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  <span className="text-sm font-medium">
                    {safeT(item.nameKey, item.nameKey?.split('.').pop() || '')}
                  </span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-8 bg-white rounded-full"></div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Footer - Logout Button */}
      <div className="p-4 border-t border-blue-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group hover:bg-red-600 hover:bg-opacity-20 text-gray-300 hover:text-white"
        >
          <div className="w-8 h-8 bg-red-600 bg-opacity-20 rounded-full flex items-center justify-center group-hover:bg-red-600 group-hover:bg-opacity-30 transition-all">
            <FaSignOutAlt className="text-red-400 text-sm group-hover:text-red-300" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-gray-300 group-hover:text-white">{safeT('nav.logout', 'Logout')}</p>
            <p className="text-xs text-gray-400 group-hover:text-gray-300">Sign out of your account</p>
          </div>
        </button>
      </div>
    </div>
  );
}
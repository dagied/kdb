'use client';

import { withAuth } from '@/components/withAuth';
import Layout from '@/components/Layout';
import { useTranslation } from '@/hooks/useTranslation';
import { useState, useEffect } from 'react';
import { 
  FaUserCheck, FaIdCard, FaGavel, FaUsers, 
  FaFileAlt, FaBell, FaCalendarAlt, FaChartLine,
  FaArrowUp, FaArrowDown, FaEye, FaDownload,
  FaHome, FaBalanceScale, FaUserPlus, FaUserFriends,
  FaSpinner
} from 'react-icons/fa';
import { MdPending, MdVerified } from 'react-icons/md';
import { GiFamilyHouse } from 'react-icons/gi';

function ManagerDashboard() {
  const { t, locale } = useTranslation();
  const [stats, setStats] = useState({
    totalResidents: 0,
    idIssued: 0,
    pendingRequests: 0,
    activeCases: 0,
    male: 0,
    female: 0,
    weeklyGrowth: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [recentCases, setRecentCases] = useState([]);
  const [upcomingHearings, setUpcomingHearings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard/manager/stats');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch data');
      }
      
      setStats(data.stats);
      setRecentActivities(data.recentActivities || []);
      setRecentCases(data.recentCases || []);
      setUpcomingHearings(data.upcomingHearings || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to parse and format activity description
  const parseActivityDescription = (activity) => {
    try {
      if (activity.description && typeof activity.description === 'string') {
        if (activity.description.startsWith('{') || activity.description.startsWith('"')) {
          const parsed = JSON.parse(activity.description);
          if (parsed.name && parsed.action) {
            return `${parsed.action}: ${parsed.name} (${parsed.role || t('socialCourt.resident')})`;
          }
          if (parsed.action) {
            return parsed.action;
          }
        }
        if (activity.description.length > 80) {
          return activity.description.substring(0, 77) + '...';
        }
        return activity.description;
      }
      return activity.action || t('dashboard.activityRecorded');
    } catch (e) {
      if (activity.description && activity.description.length > 80) {
        return activity.description.substring(0, 77) + '...';
      }
      return activity.description || activity.action || t('dashboard.activityRecorded');
    }
  };

  // Get icon based on action type
  const getActivityIcon = (activity) => {
    const action = (activity.action || '').toLowerCase();
    const description = (activity.description || '').toLowerCase();
    
    if (action.includes('insert') || description.includes('register') || description.includes('new resident')) {
      return FaUserPlus;
    }
    if (action.includes('update') || description.includes('update')) {
      return FaUserCheck;
    }
    if (description.includes('id card') || description.includes('id issued')) {
      return FaIdCard;
    }
    if (description.includes('case') || description.includes('court')) {
      return FaGavel;
    }
    return FaFileAlt;
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-${color}-100`}>
          <Icon className={`text-${color}-600 text-xl`} />
        </div>
      </div>
      <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-800">{value.toLocaleString()}</p>
    </div>
  );

  if (loading) {
    return (
      <Layout role="Kebele Manager">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
            <p className="text-gray-500">{t('common.loading')}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout role="Kebele Manager">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-md mx-auto mt-20">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <p className="text-red-600 font-medium mb-2">{t('common.error')}</p>
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button 
            onClick={fetchDashboardData} 
            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
          >
            {t('common.retry')}
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="Kebele Manager">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{t('nav.dashboard')}</h1>
            <p className="text-gray-500 text-sm mt-1">{t('dashboard.managerWelcome')}</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition flex items-center gap-2 shadow-sm">
              <FaDownload size={14} /> {t('dashboard.exportReport')}
            </button>
            <button className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-medium transition flex items-center gap-2">
              <FaEye size={14} /> {t('dashboard.viewDetails')}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard title={t('dashboard.totalResidents')} value={stats.totalResidents} icon={FaUsers} color="blue" />
          <StatCard title={t('dashboard.idIssued')} value={stats.idIssued} icon={FaIdCard} color="green" />
          <StatCard title={t('dashboard.pendingRequests')} value={stats.pendingRequests} icon={MdPending} color="yellow" />
          <StatCard title={t('dashboard.activeCourtCases')} value={stats.activeCases} icon={FaGavel} color="purple" />
        </div>

        {/* Gender Distribution & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gender Distribution */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-700">{t('dashboard.genderDistribution')}</h2>
              <FaChartLine className="text-gray-400" />
            </div>
            <div className="flex items-center justify-around">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto shadow-inner">
                  <span className="text-2xl font-bold text-blue-600">{stats.male}</span>
                </div>
                <p className="mt-2 text-sm font-medium text-gray-700">{t('dashboard.male')}</p>
                <p className="text-lg font-semibold text-blue-600">
                  {stats.totalResidents ? Math.round((stats.male / stats.totalResidents) * 100) : 0}%
                </p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-pink-100 flex items-center justify-center mx-auto shadow-inner">
                  <span className="text-2xl font-bold text-pink-600">{stats.female}</span>
                </div>
                <p className="mt-2 text-sm font-medium text-gray-700">{t('dashboard.female')}</p>
                <p className="text-lg font-semibold text-pink-600">
                  {stats.totalResidents ? Math.round((stats.female / stats.totalResidents) * 100) : 0}%
                </p>
              </div>
            </div>
            <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${stats.totalResidents ? (stats.male / stats.totalResidents) * 100 : 0}%` }}></div>
            </div>
            <p className="text-center text-xs text-gray-400 mt-3">{t('dashboard.totalPopulation')}: {stats.totalResidents}</p>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white p-6">
            <h2 className="font-semibold text-lg mb-4">{t('dashboard.quickActions')}</h2>
            <div className="grid grid-cols-2 gap-3">
              <a href="/dashboard/manager/add-resident" className="bg-white text-blue-600 bg-opacity-20 hover:bg-opacity-30 rounded-xl p-3 text-sm font-medium transition flex items-center gap-2 justify-center backdrop-blur-sm">
                <FaUserPlus /> {t('dashboard.addResident')}
              </a>
              <a href="/dashboard/manager/give-id" className="bg-white text-blue-600 bg-opacity-20 hover:bg-opacity-30 rounded-xl p-3 text-sm font-medium transition flex items-center gap-2 justify-center backdrop-blur-sm">
                <FaIdCard /> {t('dashboard.issueID')}
              </a>
              <a href="/dashboard/manager/social-court" className="bg-white text-blue-600 bg-opacity-20 hover:bg-opacity-30 rounded-xl p-3 text-sm font-medium transition flex items-center gap-2 justify-center backdrop-blur-sm">
                <FaGavel /> {t('dashboard.fileCase')}
              </a>
              <button className="bg-white text-blue-600 bg-opacity-20 hover:bg-opacity-30 rounded-xl p-3 text-sm font-medium transition flex items-center gap-2 justify-center backdrop-blur-sm">
                <FaFileAlt /> {t('dashboard.generateReport')}
              </button>
            </div>
            <div className="mt-6 pt-4 border-t border-white border-opacity-20">
              <p className="text-xs text-blue-100">📅 {new Date().toLocaleDateString(locale === 'am' ? 'am-ET' : locale === 'om' ? 'om-ET' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          {/* Upcoming Hearings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-700">{t('dashboard.upcomingHearings')}</h2>
              <FaCalendarAlt className="text-gray-400" />
            </div>
            {upcomingHearings.length === 0 ? (
              <div className="text-center py-8">
                <FaCalendarAlt className="text-gray-300 text-4xl mx-auto mb-3" />
                <p className="text-gray-400 text-sm">{t('dashboard.noUpcomingHearings')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingHearings.map((hearing, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg transition">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{hearing.case_number || `Case #${hearing.case_id}`}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{hearing.location || t('dashboard.kebeleSocialCourt')}</p>
                    </div>
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
                      {new Date(hearing.hearing_date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <button className="mt-4 w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium transition">{t('dashboard.viewAllHearings')} →</button>
          </div>
        </div>

        {/* Recent Activities & Recent Cases */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-700">{t('dashboard.recentActivities')}</h2>
              <FaBell className="text-gray-400" />
            </div>
            {recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <FaBell className="text-gray-300 text-4xl mx-auto mb-3" />
                <p className="text-gray-400 text-sm">{t('dashboard.noRecentActivities')}</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {recentActivities.map((activity, idx) => {
                  const Icon = getActivityIcon(activity);
                  const description = parseActivityDescription(activity);
                  return (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Icon className="text-blue-500 text-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          👤 {activity.performed_by || 'System'} • 🕐 {activity.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Social Court Cases */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-700">{t('dashboard.recentCourtCases')}</h2>
              <FaBalanceScale className="text-gray-400" />
            </div>
            {recentCases.length === 0 ? (
              <div className="text-center py-8">
                <FaBalanceScale className="text-gray-300 text-4xl mx-auto mb-3" />
                <p className="text-gray-400 text-sm">{t('dashboard.noCourtCases')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-600 font-medium rounded-tl-lg">{t('socialCourt.caseNumber')}</th>
                      <th className="px-3 py-2 text-left text-gray-600 font-medium">{t('dashboard.parties')}</th>
                      <th className="px-3 py-2 text-left text-gray-600 font-medium">{t('socialCourt.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentCases.map((caseItem) => (
                      <tr key={caseItem.case_id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                        <td className="px-3 py-3 font-mono text-gray-600 text-xs">{caseItem.case_number || caseItem.case_id}</td>
                        <td className="px-3 py-2">
                          <div className="text-xs">
                            <span className="text-gray-500">{t('socialCourt.plaintiff')}:</span> 
                            <span className="text-gray-700 ml-1">{caseItem.plaintiff_name || '—'}</span>
                          </div>
                          <div className="text-xs mt-1">
                            <span className="text-gray-500">{t('socialCourt.defendant')}:</span> 
                            <span className="text-gray-700 ml-1">{caseItem.defendant_name || '—'}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            caseItem.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                            caseItem.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                            caseItem.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {t(`status.${caseItem.status}`) || caseItem.status || 'Unknown'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button className="mt-4 w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium transition">{t('dashboard.viewAllCases')} →</button>
          </div>
        </div>

        {/* Footer Info Card */}
        <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-5 border border-green-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <GiFamilyHouse className="text-green-600 text-2xl" />
            </div>
            <div>
              <p className="text-sm text-green-800 font-medium">{t('app.name')}</p>
              <p className="text-xs text-green-600">{t('dashboard.version')} • {t('dashboard.kebeleName')}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-green-700">✓ {t('dashboard.lastUpdated')}: {new Date().toLocaleString()}</p>
            <p className="text-xs text-green-600">✓ {t('dashboard.dataSynced')}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// ✅ ADD THIS - Wrap with auth HOC to restrict access to Kebele Manager only
export default withAuth(ManagerDashboard, ['Kebele Manager']);
'use client';
import { withAuth } from '@/components/withAuth';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useTranslation } from '@/hooks/useTranslation';
import { 
  FaUsers, FaUserCheck, FaBuilding, FaChartLine, 
  FaSpinner, FaUserPlus, FaDatabase, FaCalendarAlt, 
  FaCheckCircle, FaExclamationTriangle, FaGlobe,
  FaInfoCircle, FaShieldAlt, FaRegClock
} from 'react-icons/fa';

function AdminDashboard() {
  const { t, locale } = useTranslation();
  const [stats, setStats] = useState({
    totalStaff: 0,
    totalResidents: 0,
    totalKebeles: 0,
    activeUsers: 0,
    totalCertificates: 0,
    pendingRequests: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchJson = async (url) => {
    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 200)}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Expected JSON but received ${contentType}: ${text.slice(0, 200)}`);
    }

    return response.json();
  };

  const fetchData = async () => {
    try {
      const [staffData, residentsData, kebelesData, certificatesData, requestsData] = await Promise.all([
        fetchJson('/api/auth/admin/get-staff'),
        fetchJson('/api/residents'),
        fetchJson('/api/kebeles'),
        fetchJson('/api/certificates?limit=5'),
        fetchJson('/api/service-requests')
      ]);

      let activities = [];
      try {
        const auditRes = await fetch('/api/audit/recent?limit=5');
        if (auditRes.ok && auditRes.headers.get('content-type')?.includes('application/json')) {
          const auditData = await auditRes.json();
          activities = Array.isArray(auditData) ? auditData : auditData.activities || [];
        }
      } catch (e) {
        console.log('Could not fetch audit logs', e);
      }

      setStats({
        totalStaff: Array.isArray(staffData) ? staffData.length : 0,
        totalResidents: residentsData.residents?.length || 0,
        totalKebeles: kebelesData.kebeles?.length || 0,
        activeUsers: Array.isArray(staffData) ? staffData.filter(s => s.is_active === true).length : 0,
        totalCertificates: certificatesData.certificates?.length || 0,
        pendingRequests: requestsData.requests?.filter(r => r.status === 'pending').length || 0
      });

      setRecentActivities(activities.slice(0, 5));
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (activity) => {
    const action = (activity.action || '').toLowerCase();
    if (action.includes('staff') || action.includes('user')) return FaUsers;
    if (action.includes('kebele')) return FaBuilding;
    if (action.includes('certificate')) return FaCheckCircle;
    return FaInfoCircle;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'am' ? 'am-ET' : locale === 'om' ? 'om-ET' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Layout role="System Administrator">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
            <p className="text-gray-500">
              {locale === 'am' ? 'በመጫን ላይ...' : locale === 'om' ? 'Yaa’uu...' : 'Loading...'}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout role="System Administrator">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-md mx-auto mt-20">
          <FaExclamationTriangle className="text-red-500 text-5xl mx-auto mb-4" />
          <p className="text-red-600 font-medium mb-2">
            {locale === 'am' ? 'ስህተት ተከስቷል' : locale === 'om' ? 'Dogoggorri uumaame' : 'An error occurred'}
          </p>
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button 
            onClick={fetchData} 
            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
          >
            {locale === 'am' ? 'ደግሞ ሞክር' : locale === 'om' ? 'Itti yaali' : 'Retry'}
          </button>
        </div>
      </Layout>
    );
  }

  const statCards = [
    { 
      title: locale === 'am' ? 'ጠቅላላ ሰራተኞች' : locale === 'om' ? 'Hojjetttoota Waligalaa' : 'Total Staff', 
      value: stats.totalStaff, 
      icon: FaUsers, 
      color: 'blue',
      description: locale === 'am' ? 'በስርዓቱ ውስጥ ያሉ ሰራተኞች' : locale === 'om' ? 'Hojjetttoota sirna keessatti' : 'Staff members in the system'
    },
    { 
      title: locale === 'am' ? 'ጠቅላላ ነዋሪዎች' : locale === 'om' ? 'Jiraattoota Waligalaa' : 'Total Residents', 
      value: stats.totalResidents, 
      icon: FaUserCheck, 
      color: 'green',
      description: locale === 'am' ? 'የተመዘገቡ ነዋሪዎች' : locale === 'om' ? 'Jiraattoota galmeeffaman' : 'Registered residents'
    },
    { 
      title: locale === 'am' ? 'ጠቅላላ ቀበሌዎች' : locale === 'om' ? 'Gabalee Waligalaa' : 'Total Kebeles', 
      value: stats.totalKebeles, 
      icon: FaBuilding, 
      color: 'purple',
      description: locale === 'am' ? 'በስርዓቱ ውስጥ ያሉ ቀበሌዎች' : locale === 'om' ? 'Gabalee sirna keessatti' : 'Kebeles in the system'
    },
    { 
      title: locale === 'am' ? 'ንቁ ተጠቃሚዎች' : locale === 'om' ? 'Fayyadamtoota Aktiivii' : 'Active Users', 
      value: stats.activeUsers, 
      icon: FaCheckCircle, 
      color: 'teal',
      description: locale === 'am' ? 'በንቃት የሚሳተፉ ተጠቃሚዎች' : locale === 'om' ? 'Fayyadamtoota hojii irra jiran' : 'Currently active users'
    },
    { 
      title: locale === 'am' ? 'ጠቅላላ የምስክር ወረቀቶች' : locale === 'om' ? 'Raawwattoota Waligalaa' : 'Total Certificates', 
      value: stats.totalCertificates, 
      icon: FaDatabase, 
      color: 'indigo',
      description: locale === 'am' ? 'የተሰጡ የምስክር ወረቀቶች' : locale === 'om' ? 'Raggaalee kenname' : 'Certificates issued'
    },
    { 
      title: locale === 'am' ? 'በመጠባበቅ ላይ' : locale === 'om' ? 'Eega' : 'Pending Requests', 
      value: stats.pendingRequests, 
      icon: FaRegClock, 
      color: 'orange',
      description: locale === 'am' ? 'አገልግሎት መጠየቂያዎች' : locale === 'om' ? 'Yyannoo tajaajilaa' : 'Service requests waiting'
    }
  ];

  return (
    <Layout role="System Administrator">
      <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
        {/* Header with Language Indicator */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              📊 {locale === 'am' ? 'የአስተዳዳሪ ዳሽቦርድ' : locale === 'om' ? 'Daashboordii Bulchaa' : 'Admin Dashboard'}
            </h1>
            <p className="text-gray-500 mt-1 flex items-center gap-1">
              <FaGlobe className="text-sm" />
              {locale === 'am' ? 'እንኳን ደህና መጡ! የስርዓቱ አጠቃላይ እይታ እዚህ ይታያል' : 
                locale === 'om' ? 'Bagga! Ilaalchi sirnaa asitti mul’ata' : 
                'Welcome! Here\'s an overview of your system'}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
              <span className="text-sm text-gray-500">
                {locale === 'am' ? 'የዛሬው ቀን:' : locale === 'om' ? 'Guyyaa har\'aa:' : 'Today:'}
              </span>
              <span className="ml-2 font-medium text-gray-700">
                {new Date().toLocaleDateString(locale === 'am' ? 'am-ET' : locale === 'om' ? 'om-ET' : 'en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            const colorClasses = {
              blue: 'from-blue-500 to-blue-600',
              green: 'from-green-500 to-green-600',
              purple: 'from-purple-500 to-purple-600',
              teal: 'from-teal-500 to-teal-600',
              indigo: 'from-indigo-500 to-indigo-600',
              orange: 'from-orange-500 to-orange-600'
            };
            return (
              <div key={index} className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-14 h-14 bg-gradient-to-br ${colorClasses[stat.color]} rounded-xl flex items-center justify-center shadow-lg`}>
                      <Icon className="text-2xl text-white" />
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-bold text-gray-800">{stat.value}</span>
                      <div className="text-xs text-gray-400 mt-1">{stat.description}</div>
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-gray-700 border-t pt-3">{stat.title}</h3>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions Section */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
            <h2 className="font-semibold text-white text-lg flex items-center gap-2">
              <FaShieldAlt className="text-xl" />
              {locale === 'am' ? 'ፈጣን ድርጊቶች' : locale === 'om' ? 'Gochi Golchi' : 'Quick Actions'}
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => window.location.href = '/dashboard/admin/create-staff'}
                className="flex items-center gap-3 px-4 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 group"
              >
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FaUserPlus className="text-white text-lg" />
                </div>
                <div className="text-left">
                  <span className="font-semibold block">
                    {locale === 'am' ? 'ሰራተኛ ፍጠር' : locale === 'om' ? 'Hojjetaa Uumi' : 'Create Staff'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {locale === 'am' ? 'አዲስ የሰራተኛ መለያ ይፍጠሩ' : locale === 'om' ? 'Akaawuntii hojjetaa haaraa uumi' : 'Create a new staff account'}
                  </span>
                </div>
              </button>
              <button 
                onClick={() => window.location.href = '/dashboard/admin/manage-kebele'}
                className="flex items-center gap-3 px-4 py-4 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-all duration-200 group"
              >
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FaBuilding className="text-white text-lg" />
                </div>
                <div className="text-left">
                  <span className="font-semibold block">
                    {locale === 'am' ? 'ቀበሌ ጨምር' : locale === 'om' ? 'Gabalee Iddu' : 'Add Kebele'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {locale === 'am' ? 'አዲስ ቀበሌ ይመዝግቡ' : locale === 'om' ? 'Gabalee haaraa galmeessi' : 'Register a new kebele'}
                  </span>
                </div>
              </button>
              <button 
                onClick={() => window.location.href = '/dashboard/admin/reports'}
                className="flex items-center gap-3 px-4 py-4 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 rounded-xl hover:from-purple-100 hover:to-pink-100 transition-all duration-200 group"
              >
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FaChartLine className="text-white text-lg" />
                </div>
                <div className="text-left">
                  <span className="font-semibold block">
                    {locale === 'am' ? 'ሪፖርት አዘጋጅ' : locale === 'om' ? 'Ripporti Qopheessi' : 'Generate Report'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {locale === 'am' ? 'የስርዓት ሪፖርቶችን ይመልከቱ' : locale === 'om' ? 'Ripportii sirnaa ilaali' : 'View system reports'}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4">
            <h2 className="font-semibold text-white text-lg flex items-center gap-2">
              <FaRegClock className="text-xl" />
              {locale === 'am' ? 'የቅርብ ጊዜ እንቅስቃሴዎች' : locale === 'om' ? 'Gochaalee Amaanti' : 'Recent Activities'}
            </h2>
          </div>
          <div className="p-6">
            {recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaInfoCircle className="text-gray-400 text-3xl" />
                </div>
                <p className="text-gray-400 text-sm">
                  {locale === 'am' ? 'ምንም የቅርብ ጊዜ እንቅስቃሴ የለም' : 
                    locale === 'om' ? 'Gochaalee ammaantii hin jiran' : 
                    'No recent activities'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((activity, idx) => {
                  const Icon = getActivityIcon(activity);
                  return (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                        <Icon className="text-white text-sm" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{activity.description || activity.action}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400">
                            {formatDate(activity.created_at || activity.time)}
                          </span>
                          {activity.userName && (
                            <>
                              <span className="text-xs text-gray-300">•</span>
                              <span className="text-xs text-gray-400">
                                {locale === 'am' ? 'ተጠቃሚ' : locale === 'om' ? 'Fayyadamaa' : 'User'}: {activity.userName}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {activity.status && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          activity.status === 'completed' ? 'bg-green-100 text-green-600' :
                          activity.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {activity.status === 'completed' ? (locale === 'am' ? 'ተጠናቋል' : locale === 'om' ? 'Xumurame' : 'Completed') :
                           activity.status === 'pending' ? (locale === 'am' ? 'በመጠባበቅ ላይ' : locale === 'om' ? 'Eega' : 'Pending') :
                           activity.status}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* System Info Footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-5 border border-indigo-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
                <FaDatabase className="text-white text-xl" />
              </div>
              <div>
                <p className="text-sm font-semibold text-indigo-800">
                  {locale === 'am' ? 'የስርዓት ሁኔታ' : locale === 'om' ? 'Haala Sirnaa' : 'System Status'}
                </p>
                <p className="text-xs text-indigo-600">
                  {locale === 'am' ? 'ስርዓቱ በመደበኛነት እየሰራ ነው' : 
                    locale === 'om' ? 'Sirni adaan hojjataa jira' : 
                    'System is operating normally'}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl p-5 border border-teal-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center">
                <FaCalendarAlt className="text-white text-xl" />
              </div>
              <div>
                <p className="text-sm font-semibold text-teal-800">
                  {locale === 'am' ? 'የመጨረሻ ዝመና' : locale === 'om' ? 'Yeroo Dhuma' : 'Last Updated'}
                </p>
                <p className="text-xs text-teal-600">
                  {new Date().toLocaleString(locale === 'am' ? 'am-ET' : locale === 'om' ? 'om-ET' : 'en-US')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default withAuth(AdminDashboard, ['System Administrator']);
'use client';
import { withAuth } from '@/components/withAuth';
import Layout from '@/components/Layout';
import { useTranslation } from '@/hooks/useTranslation';
import { useState, useEffect } from 'react';
import { 
  FaIdCard, FaSyncAlt, FaBirthdayCake, 
  FaSkull, FaRing, FaChartBar, FaSpinner,
  FaFileAlt, FaUsers, FaCheckCircle, FaExclamationTriangle,
  FaDownload, FaEye, FaBell, FaCalendarAlt, FaGlobe,
  FaInfoCircle, FaSearch, FaUserCheck, FaRegClock
} from 'react-icons/fa';
import { MdPending, MdVerified } from 'react-icons/md';
import { GiFamilyHouse } from 'react-icons/gi';

function OfficerDashboard() {
  const { t, locale } = useTranslation();
  const [stats, setStats] = useState({
    idRequests: 0,
    idRenewals: 0,
    birthCertificates: 0,
    deathCertificates: 0,
    marriageCertificates: 0,
    totalProcessed: 0,
    totalPending: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  // In OfficerDashboard component, replace the fetchData function with this:

const fetchData = async () => {
  setLoading(true);
  setError(null);
  
  try {
    // Fetch service requests
    const requestsRes = await fetch('/api/service-requests');
    
    if (!requestsRes.ok) {
      throw new Error(`HTTP error! status: ${requestsRes.status}`);
    }
    
    const responseData = await requestsRes.json();
    console.log('Full API Response:', responseData);
    
    // Extract requests array correctly
    let requests = [];
    if (responseData.requests && Array.isArray(responseData.requests)) {
      requests = responseData.requests;
    } else if (Array.isArray(responseData)) {
      requests = responseData;
    }
    
    console.log('Total requests found:', requests.length);
    
    // Log each request for debugging
    requests.forEach(req => {
      console.log(`📋 Request: ${req.service_name} - Status: ${req.status}`);
    });
    
    // Calculate statistics using exact matches
    const idRequests = requests.filter(r => 
      r.service_name === 'New ID Registration' && 
      (r.status === 'pending' || r.status === 'PENDING')
    ).length;
    
    const idRenewals = requests.filter(r => 
      r.service_name === 'ID Renewal' && 
      (r.status === 'pending' || r.status === 'PENDING')
    ).length;
    
    const birthCertificates = requests.filter(r => 
      r.service_name === 'Birth Certificate Issuance' && 
      (r.status === 'pending' || r.status === 'PENDING')
    ).length;
    
    const deathCertificates = requests.filter(r => 
      r.service_name === 'Death Certificate Registration' && 
      (r.status === 'pending' || r.status === 'PENDING')
    ).length;
    
    const marriageCertificates = requests.filter(r => 
      r.service_name === 'Marriage Certificate Issuance' && 
      (r.status === 'pending' || r.status === 'PENDING')
    ).length;
    
    const totalProcessed = requests.filter(r => 
      r.status === 'completed' || r.status === 'COMPLETED'
    ).length;
    
    const totalPending = idRequests + idRenewals + birthCertificates + deathCertificates + marriageCertificates;
    
    console.log('Calculated Stats:', {
      idRequests,
      idRenewals,
      birthCertificates,
      deathCertificates,
      marriageCertificates,
      totalProcessed,
      totalPending
    });
    
    setStats({
      idRequests,
      idRenewals,
      birthCertificates,
      deathCertificates,
      marriageCertificates,
      totalProcessed,
      totalPending
    });
    
    // Get recent activities (first 5 requests sorted by date)
    const recentRequests = [...requests]
      .sort((a, b) => new Date(b.request_date) - new Date(a.request_date))
      .slice(0, 5)
      .map(req => ({
        action: req.service_name,
        description: `${req.service_name} - ${req.status}`,
        time: req.request_date,
        created_at: req.request_date,
        status: req.status,
        resident_name: req.resident_name
      }));
    
    setRecentActivities(recentRequests);
    
  } catch (error) {
    console.error('Error fetching data:', error);
    setError(error.message || 'Failed to load dashboard data');
    
    setStats({
      idRequests: 0,
      idRenewals: 0,
      birthCertificates: 0,
      deathCertificates: 0,
      marriageCertificates: 0,
      totalProcessed: 0,
      totalPending: 0
    });
  } finally {
    setLoading(false);
  }
};

  const getActivityIcon = (activity) => {
    const action = (activity.action || activity.description || '').toLowerCase();
    if (action.includes('birth')) return FaBirthdayCake;
    if (action.includes('death')) return FaSkull;
    if (action.includes('marriage')) return FaRing;
    if (action.includes('id')) return FaIdCard;
    if (action.includes('renew')) return FaSyncAlt;
    return FaFileAlt;
  };

  const getStatusText = (status) => {
    if (!status) return 'Pending';
    
    if (locale === 'am') {
      const statusMap = {
        'pending': 'በመጠባበቅ ላይ',
        'processing': 'በሂደት ላይ',
        'completed': 'ተጠናቋል',
        'approved': 'ጸድቋል',
        'rejected': 'ውድቅ ተደርጓል',
        'PENDING': 'በመጠባበቅ ላይ',
        'COMPLETED': 'ተጠናቋል'
      };
      return statusMap[status] || status;
    } else if (locale === 'om') {
      const statusMap = {
        'pending': 'Eega',
        'processing': 'Adeemsa irra',
        'completed': 'Xumurame',
        'approved': 'Mirkanaa\'e',
        'rejected': 'Kufaafame',
        'PENDING': 'Eega',
        'COMPLETED': 'Xumurame'
      };
      return statusMap[status] || status;
    }
    return status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleString();
    } catch (e) {
      return 'N/A';
    }
  };

  const ServiceCard = ({ title, value, icon: Icon, color }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600',
      green: 'from-green-500 to-green-600',
      gray: 'from-gray-500 to-gray-600',
      pink: 'from-pink-500 to-pink-600'
    };
    
    return (
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
        <div className="flex items-center justify-between mb-3">
          <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center shadow-md`}>
            <Icon className="text-xl text-white" />
          </div>
          <span className="text-3xl font-bold text-gray-800">{value || 0}</span>
        </div>
        <h3 className="text-sm font-semibold text-gray-600 border-t pt-3">{title}</h3>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout role="Record Officer">
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
      <Layout role="Record Officer">
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

  const pendingTotal = stats.totalPending;

  const serviceCards = [
    { title: locale === 'am' ? 'የመታወቂያ ጥያቄዎች' : 'ID Card Requests', value: stats.idRequests, icon: FaIdCard, color: 'blue' },
    { title: locale === 'am' ? 'የመታወቂያ እድሳት' : 'ID Renewals', value: stats.idRenewals, icon: FaSyncAlt, color: 'purple' },
    { title: locale === 'am' ? 'የልደት ማስረጃ' : 'Birth Certificates', value: stats.birthCertificates, icon: FaBirthdayCake, color: 'green' },
    { title: locale === 'am' ? 'የሞት ማስረጃ' : 'Death Certificates', value: stats.deathCertificates, icon: FaSkull, color: 'gray' },
    { title: locale === 'am' ? 'የጋብቻ ማስረጃ' : 'Marriage Certificates', value: stats.marriageCertificates, icon: FaRing, color: 'pink' },
  ];

  return (
    <Layout role="Record Officer">
      <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
        {/* Header with Language Indicator */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              📋 {locale === 'am' ? 'የመዝገብ ኃላፊ ዳሽቦርድ' : locale === 'om' ? 'Daashboordii Galmeessaa' : 'Record Officer Dashboard'}
            </h1>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
              <FaUserCheck className="text-sm" />
              {locale === 'am' ? 'እንኳን ደህና መጡ! የአገልግሎት ጥያቄዎች እዚህ ይታያሉ' : 
                locale === 'om' ? 'Bagga! Yyannoon tajaajila asitti mul’ata' : 
                'Welcome! Service requests are shown here'}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <FaGlobe className="text-xs" />
                {locale === 'am' ? 'ቋንቋ:' : locale === 'om' ? 'Afaan:' : 'Language:'}
              </span>
              <span className="ml-1 font-medium text-gray-700">
                {locale === 'am' ? 'አማርኛ' : locale === 'om' ? 'Oromoo' : 'English'}
              </span>
            </div>
            <button 
              onClick={fetchData}
              className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 text-gray-600 hover:bg-gray-50 transition"
              title={locale === 'am' ? 'አድስ' : 'Refresh'}
            >
              <FaSyncAlt className="text-sm" />
            </button>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 flex items-center gap-1">
                  <FaCheckCircle className="text-sm" />
                  {locale === 'am' ? 'የተጠናቀቁ አገልግሎቶች' : locale === 'om' ? 'Tajaajilawwan Xumuraman' : 'Completed Services'}
                </p>
                <p className="text-4xl font-bold mt-2">{stats.totalProcessed}</p>
                <p className="text-xs opacity-75 mt-1">
                  {locale === 'am' ? 'እስካሁን የተከናወኑ' : locale === 'om' ? 'Hanga ammaa xumuraman' : 'Processed so far'}
                </p>
              </div>
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
                <MdVerified className="text-4xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 flex items-center gap-1">
                  <MdPending className="text-sm" />
                  {locale === 'am' ? 'በመጠባበቅ ላይ' : locale === 'om' ? 'Eega' : 'Pending Requests'}
                </p>
                <p className="text-4xl font-bold mt-2">{pendingTotal}</p>
                <p className="text-xs opacity-75 mt-1">
                  {locale === 'am' ? 'ምላሽ የሚፈልጉ' : locale === 'om' ? 'Deebisaa barbaadu' : 'Awaiting response'}
                </p>
              </div>
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
                <MdPending className="text-4xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Service Cards Grid */}
        <div>
          <h2 className="font-semibold text-gray-700 text-lg mb-4 flex items-center gap-2">
            <FaSearch className="text-blue-600" />
            {locale === 'am' ? 'የአገልግሎት ጥያቄዎች አሀዛዊ መረጃ' : 
              locale === 'om' ? 'Ibsa lakkoofsa yyaannoo tajaajila' : 
              'Service Request Statistics'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {serviceCards.map((card, index) => (
              <ServiceCard key={index} {...card} />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <FaRegClock className="text-xl" />
            {locale === 'am' ?'ፈጣን ድርጊቶች' : locale === 'om' ? 'Gochi Golchi' : 'Quick Actions'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <a href="/dashboard/officer/give-id" className="group bg-white text-blue-600 bg-opacity-20 hover:bg-opacity-30 rounded-xl p-3 text-center text-sm transition-all duration-200 hover:scale-105">
              <FaIdCard className="inline mr-2 text-lg" /> 
              {locale === 'am' ? 'መታወቂያ ስጥ' : locale === 'om' ? 'Eenyummaa Keni' : 'Issue ID'}
            </a>
            <a href="/dashboard/officer/renew-id" className="group bg-white text-blue-600 bg-opacity-20 hover:bg-opacity-30 rounded-xl p-3 text-center text-sm transition-all duration-200 hover:scale-105">
              <FaSyncAlt className="inline mr-2 text-lg" /> 
              {locale === 'am' ? 'መታወቂያ አድስ' : locale === 'om' ? 'Eenyummaa Haaraa' : 'Renew ID'}
            </a>
            <a href="/dashboard/officer/birth-certificate" className="group bg-white text-blue-600 bg-opacity-20 hover:bg-opacity-30 rounded-xl p-3 text-center text-sm transition-all duration-200 hover:scale-105">
              <FaBirthdayCake className="inline mr-2 text-lg" /> 
              {locale === 'am' ? 'የልደት ማስረጃ' : locale === 'om' ? 'Raga Dhalootaa' : 'Birth Cert'}
            </a>
            <a href="/dashboard/officer/death-certificate" className="group bg-white text-blue-600 bg-opacity-20 hover:bg-opacity-30 rounded-xl p-3 text-center text-sm transition-all duration-200 hover:scale-105">
              <FaSkull className="inline mr-2 text-lg" /> 
              {locale === 'am' ? 'የሞት ማስረጃ' : locale === 'om' ? 'Raga Duuti' : 'Death Cert'}
            </a>
          </div>
          <div className="mt-5 pt-3 border-t border-white border-opacity-20">
            <p className="text-xs text-blue-100 flex items-center gap-1">
              <FaCalendarAlt className="text-sm" />
              {new Date().toLocaleDateString(locale === 'am' ? 'am-ET' : locale === 'om' ? 'om-ET' : 'en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white text-lg flex items-center gap-2">
                <FaBell className="text-xl" />
                {locale === 'am' ? 'የቅርብ ጊዜ እንቅስቃሴዎች' : locale === 'om' ? 'Gochaalee Amaantii' : 'Recent Activities'}
              </h2>
              <FaBell className="text-white text-lg opacity-70" />
            </div>
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
                <p className="text-xs text-gray-300 mt-1">
                  {locale === 'am' ? 'አዳዲስ እንቅስቃሴዎች እዚህ ይታያሉ' : 
                    locale === 'om' ? 'Gochaalee haaraa asitti mul’atu' : 
                    'New activities will appear here'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.slice(0, 5).map((activity, idx) => {
                  const Icon = getActivityIcon(activity);
                  return (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                        <Icon className="text-white text-sm" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{activity.description || activity.action || 'Activity'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <FaRegClock className="text-xs" />
                            {formatDate(activity.time || activity.created_at)}
                          </span>
                          {activity.status && (
                            <>
                              <span className="text-xs text-gray-300">•</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                activity.status === 'completed' || activity.status === 'COMPLETED' ? 'bg-green-100 text-green-600' :
                                activity.status === 'pending' || activity.status === 'PENDING' ? 'bg-yellow-100 text-yellow-600' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {getStatusText(activity.status)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Info Card */}
        <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-5 border border-green-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <GiFamilyHouse className="text-green-600 text-2xl" />
            </div>
            <div>
              <p className="text-sm text-green-800 font-medium">
                {locale === 'am' ? 'ቦሳ አዲስ ቀበሌ' : locale === 'om' ? 'Gabala Boosa Addiis' : 'Bosa Addis Kebele'}
              </p>
              <p className="text-xs text-green-600">
                {locale === 'am' ? 'አገልግሎት ሰጪ ክፍል' : locale === 'om' ? 'Madda Tajaajilaa' : 'Service Provider'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-green-700 flex items-center gap-1">
              <FaCheckCircle className="text-xs" />
              {locale === 'am' ? 'የመጨረሻ ዝመና:' : locale === 'om' ? 'Yeroo Dhuma:' : 'Last Updated:'} {formatDate(new Date())}
            </p>
            <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
              <FaCheckCircle className="text-xs" />
              {locale === 'am' ? 'ውሂብ ተመሳስሏል' : locale === 'om' ? 'Caalaan wal qabata' : 'Data Synced'}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// ✅ Only ONE default export - the wrapped component
export default withAuth(OfficerDashboard, ['Record Officer']);
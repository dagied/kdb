'use client';

import { withAuth } from '@/components/withAuth';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useTranslation } from '@/hooks/useTranslation';
import { 
  FaSearch, FaEye, FaUser, FaPhone, FaBriefcase,
  FaCalendarAlt, FaUsers, FaCheckCircle,
  FaTimesCircle, FaSpinner, FaChevronLeft, FaChevronRight,
  FaSort, FaVenusMars, FaUserCheck, FaGlobe,
  FaInfoCircle, FaHome, FaRegClock
} from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';
import { GiFamilyHouse } from 'react-icons/gi';

function ResidentsPage() {
  const { t, locale } = useTranslation();
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResident, setSelectedResident] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filterRole, setFilterRole] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [stats, setStats] = useState({
    total: 0,
    male: 0,
    female: 0,
    heads: 0,
    active: 0
  });

  // Fetch residents
  useEffect(() => {
    fetchResidents();
  }, []);

  const fetchResidents = async () => {
    try {
      const response = await fetch('/api/residents');
      const data = await response.json();
      if (data.success) {
        setResidents(data.residents);
        calculateStats(data.residents);
      }
    } catch (error) {
      console.error('Error fetching residents:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const male = data.filter(r => r.sex === 'M' || r.gender === 'Male').length;
    const female = data.filter(r => r.sex === 'F' || r.gender === 'Female').length;
    const heads = data.filter(r => r.is_head === true).length;
    const active = data.filter(r => r.is_active !== false).length;
    
    setStats({
      total: data.length,
      male,
      female,
      heads,
      active
    });
  };

  // Filter and sort residents
  const filteredResidents = residents
    .filter(resident => {
      const searchLower = searchTerm.toLowerCase();
      const fullName = `${resident.fname} ${resident.lname} ${resident.grandfather_name || ''}`.toLowerCase();
      const matchesSearch = fullName.includes(searchLower) ||
        (resident.national_id && resident.national_id.toLowerCase().includes(searchLower)) ||
        (resident.household_code && resident.household_code.toLowerCase().includes(searchLower));
      
      const matchesRole = filterRole === 'all' || 
        (filterRole === 'head' && resident.is_head === true) ||
        (filterRole === 'member' && resident.is_head !== true);
      
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      let aVal, bVal;
      switch(sortBy) {
        case 'name':
          aVal = `${a.fname} ${a.lname}`;
          bVal = `${b.fname} ${b.lname}`;
          break;
        case 'date':
          aVal = new Date(a.birthdate || a.created_at);
          bVal = new Date(b.birthdate || b.created_at);
          break;
        case 'household':
          aVal = a.household_code || '';
          bVal = b.household_code || '';
          break;
        default:
          aVal = `${a.fname} ${a.lname}`;
          bVal = `${b.fname} ${b.lname}`;
      }
      if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

  // Pagination
  const totalPages = Math.ceil(filteredResidents.length / itemsPerPage);
  const paginatedResidents = filteredResidents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getRoleBadge = (resident) => {
    const headText = locale === 'am' ? 'የቤት ኃላፊ' : locale === 'om' ? 'Hoogganaa Mana' : 'Head';
    const memberText = locale === 'am' ? 'አባል' : locale === 'om' ? 'Miseensa' : 'Member';
    
    if (resident.is_head) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">{headText}</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">{resident.household_role || memberText}</span>;
  };

  const getGenderIcon = (sex) => {
    if (sex === 'M') return <FaVenusMars className="text-blue-500" />;
    return <FaVenusMars className="text-pink-500" />;
  };

  const getGenderText = (sex) => {
    if (locale === 'am') {
      return sex === 'M' ? 'ወንድ' : 'ሴት';
    } else if (locale === 'om') {
      return sex === 'M' ? 'Dhiira' : 'Dhalaa';
    }
    return sex === 'M' ? 'Male' : 'Female';
  };

  const getMaritalStatusText = (status) => {
    if (locale === 'am') {
      const statusMap = {
        'Single': 'ያላገባ/ያላገባች',
        'Married': 'ያገባ/ያገባች',
        'Divorced': 'የተፋታ',
        'Widowed': 'ባል/ሚስት የሞተባቸው'
      };
      return statusMap[status] || status;
    } else if (locale === 'om') {
      const statusMap = {
        'Single': 'Heera Hinqabne',
        'Married': 'Heera Qaba',
        'Divorced': 'Hiike',
        'Widowed': 'Hiyyeeffate'
      };
      return statusMap[status] || status;
    }
    return status;
  };

  const ResidentModal = ({ resident, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            {locale === 'am' ? 'የነዋሪ ዝርዝሮች' : locale === 'om' ? 'Gadifageenya Jiraataa' : 'Resident Details'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimesCircle size={24} />
          </button>
        </div>
        
        <div className="p-6">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
                <FaUser className="text-4xl" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">{resident.fname} {resident.lname} {resident.grandfather_name || ''}</h3>
                <p className="text-blue-100 mt-1">
                  {resident.household_role || (locale === 'am' ? 'አባል' : 'Miseensa')} • 
                  {locale === 'am' ? 'የነዋሪ መለያ:' : locale === 'om' ? 'ID Jiraataa:' : 'Resident ID:'} {resident.resident_id}
                </p>
                <div className="flex gap-2 mt-2">
                  {getRoleBadge(resident)}
                  {resident.is_active !== false && (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500 text-white">
                      {locale === 'am' ? 'ንቁ' : locale === 'om' ? 'Aktiivii' : 'Active'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FaUser className="text-blue-600" /> 
                {locale === 'am' ? 'የግል መረጃ' : locale === 'om' ? 'Odeeffannoo Dhuunfaa' : 'Personal Information'}
              </h4>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">{locale === 'am' ? 'ሙሉ ስም:' : locale === 'om' ? 'Maqaa Guutuu:' : 'Full Name:'}</span> {resident.fname} {resident.lname} {resident.grandfather_name || ''}</p>
                <p><span className="text-gray-500">{locale === 'am' ? 'የትውልድ ቀን:' : locale === 'om' ? 'Guyyaa Dhalootaa:' : 'Date of Birth:'}</span> {resident.birthdate || resident.date_of_birth || 'N/A'}</p>
                <p><span className="text-gray-500">{locale === 'am' ? 'ጾታ:' : locale === 'om' ? 'Saala:' : 'Gender:'}</span> {getGenderText(resident.sex)}</p>
                <p><span className="text-gray-500">{locale === 'am' ? 'የጋብቻ ሁኔታ:' : locale === 'om' ? 'Haala Heera:' : 'Marital Status:'}</span> {getMaritalStatusText(resident.marital_status) || 'N/A'}</p>
                <p><span className="text-gray-500">{locale === 'am' ? 'ዜግነት:' : locale === 'om' ? 'Biyeessummaa:' : 'Nationality:'}</span> {resident.nationality || (locale === 'am' ? 'ኢትዮጵያዊ' : 'Itoophiyaa')}</p>
                <p><span className="text-gray-500">{locale === 'am' ? 'ብሔራዊ መታወቂያ:' : locale === 'om' ? 'Eenyummaa Biyyaa:' : 'National ID:'}</span> {resident.national_id || 'N/A'}</p>
              </div>
            </div>

            {/* Household Information */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <GiFamilyHouse className="text-green-600" /> 
                {locale === 'am' ? 'የቤት መረጃ' : locale === 'om' ? 'Odeeffannoo Mana' : 'Household Information'}
              </h4>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">{locale === 'am' ? 'የቤት መለያ:' : locale === 'om' ? 'ID Mana:' : 'House ID:'}</span> {resident.house_id || 'N/A'}</p>
                <p><span className="text-gray-500">{locale === 'am' ? 'የቤት ኮድ:' : locale === 'om' ? 'Koodii Mana:' : 'Household Code:'}</span> <span className="font-mono">{resident.household_code || 'N/A'}</span></p>
                <p><span className="text-gray-500">{locale === 'am' ? 'የቤት ሚና:' : locale === 'om' ? 'Gahee Mana:' : 'Household Role:'}</span> {resident.is_head ? (locale === 'am' ? 'ኃላፊ' : 'Hoogganaa') : (resident.household_role || (locale === 'am' ? 'አባል' : 'Miseensa'))}</p>
                <p><span className="text-gray-500">{locale === 'am' ? 'የምዝገባ ቀን:' : locale === 'om' ? 'Guyyaa Galmeeffamaa:' : 'Registration Date:'}</span> {new Date(resident.registration_date || resident.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FaPhone className="text-yellow-600" /> 
                {locale === 'am' ? 'የመገናኛ መረጃ' : locale === 'om' ? 'Odeeffannoo Qunnamtii' : 'Contact Information'}
              </h4>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">{locale === 'am' ? 'ስልክ ቁጥሮች:' : locale === 'om' ? 'Lakkoofsa Bilbilaa:' : 'Phone Numbers:'}</span> {resident.phones?.length > 0 ? resident.phones.join(', ') : 'N/A'}</p>
                <p><span className="text-gray-500">{locale === 'am' ? 'የትውልድ ቦታ:' : locale === 'om' ? 'Iddoo Dhalootaa:' : 'Place of Birth:'}</span> {resident.place_of_birth || 'N/A'}</p>
                <p><span className="text-gray-500">{locale === 'am' ? 'ቀዳሚ ቀበሌ:' : locale === 'om' ? 'Gabalee Duraa:' : 'Previous Kebele:'}</span> {resident.previous_kebele || 'N/A'}</p>
              </div>
            </div>

            {/* Employment & Education */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FaBriefcase className="text-indigo-600" /> 
                {locale === 'am' ? 'የሥራ እና ትምህርት' : locale === 'om' ? 'Hojii fi Barumsa' : 'Employment & Education'}
              </h4>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">{locale === 'am' ? 'ሙያ:' : locale === 'om' ? 'Hojii:' : 'Occupation:'}</span> {resident.job_title || 'N/A'}</p>
                <p><span className="text-gray-500">{locale === 'am' ? 'አሠሪ:' : locale === 'om' ? 'Absinjoota:' : 'Employer:'}</span> {resident.employer || 'N/A'}</p>
                <p><span className="text-gray-500">{locale === 'am' ? 'የትምህርት ደረጃ:' : locale === 'om' ? 'Sadarkaa Barnootaa:' : 'Education Level:'}</span> {resident.education_level || 'N/A'}</p>
                <p><span className="text-gray-500">{locale === 'am' ? 'ሃይማኖት:' : locale === 'om' ? 'Amantii:' : 'Religion:'}</span> {resident.religion || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Verification Information */}
          {(resident.verified_by || resident.verification_note) && (
            <div className="mt-6 bg-green-50 rounded-xl p-4 border border-green-200">
              <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                <MdVerified /> 
                {locale === 'am' ? 'የማህበረሰብ ማረጋገጫ' : locale === 'om' ? 'Mirkaneessa Hawaasa' : 'Community Verification'}
              </h4>
              <div className="text-sm space-y-1">
                <p><span className="text-gray-600">{locale === 'am' ? 'አረጋጋጅ:' : locale === 'om' ? 'Mirkaneessaa:' : 'Verified By:'}</span> {resident.verified_by || 'N/A'}</p>
                <p><span className="text-gray-600">{locale === 'am' ? 'የማረጋገጫ ቀን:' : locale === 'om' ? 'Guyyaa Mirkaneessaa:' : 'Verification Date:'}</span> {resident.verification_date || 'N/A'}</p>
                <p><span className="text-gray-600">{locale === 'am' ? 'ማስታወሻ:' : locale === 'om' ? 'Hubanno:' : 'Notes:'}</span> {resident.verification_note || 'N/A'}</p>
              </div>
            </div>
          )}

          {/* Notes */}
          {resident.notes && (
            <div className="mt-4 bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <h4 className="font-semibold text-yellow-700 mb-2">
                {locale === 'am' ? 'ተጨማሪ ማስታወሻ' : locale === 'om' ? 'Hubannoo Dabalataa' : 'Additional Notes'}
              </h4>
              <p className="text-sm text-gray-700">{resident.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role="Record Officer" />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <FaUsers className="text-blue-600" /> 
              {locale === 'am' ? 'የነዋሪዎች አስተዳደር' : locale === 'om' ? 'Bulchiinsa Jiraato' : 'Resident Management'}
            </h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <FaGlobe className="text-xs" />
              {locale === 'am' ? 'በቀበሌው ውስጥ የተመዘገቡ ነዋሪዎችን ይመልከቱ እና ያስተዳድሩ' : 
                locale === 'om' ? 'Jiraattoota gabalee keessatti galmeessaman ilaaliifi bulchi' : 
                'View and manage all registered residents in the kebele'}
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                  <p className="text-xs text-gray-500">
                    {locale === 'am' ? 'ጠቅላላ ነዋሪዎች' : locale === 'om' ? 'Jiraattoota Waligala' : 'Total Residents'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FaUsers className="text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{stats.male}</p>
                  <p className="text-xs text-gray-500">
                    {locale === 'am' ? 'ወንድ' : locale === 'om' ? 'Dhiira' : 'Male'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FaVenusMars className="text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-pink-600">{stats.female}</p>
                  <p className="text-xs text-gray-500">
                    {locale === 'am' ? 'ሴት' : locale === 'om' ? 'Dhalaa' : 'Female'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                  <FaVenusMars className="text-pink-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-purple-600">{stats.heads}</p>
                  <p className="text-xs text-gray-500">
                    {locale === 'am' ? 'የቤት ኃላፊዎች' : locale === 'om' ? 'Hoogganoota Mana' : 'Household Heads'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <FaUserCheck className="text-purple-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                  <p className="text-xs text-gray-500">
                    {locale === 'am' ? 'ንቁ ነዋሪዎች' : locale === 'om' ? 'Jiraattoota Aktiivii' : 'Active Residents'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <FaCheckCircle className="text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={locale === 'am' ? 'በስም፣ ብሄራዊ መታወቂያ ወይም የቤት ኮድ ይፈልጉ...' : 
                    locale === 'om' ? 'Maqaa, Eenyummaa Biyyaa ykn Koodii Manaan barbaadi...' : 
                    'Search by name, national ID, or household code...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">{locale === 'am' ? 'ሁሉም አባላት' : locale === 'om' ? 'Miseensota Hunda' : 'All Members'}</option>
                  <option value="head">{locale === 'am' ? 'ኃላፊዎች ብቻ' : locale === 'om' ? 'Hoogganota Qofa' : 'Heads Only'}</option>
                  <option value="member">{locale === 'am' ? 'አባላት ብቻ' : locale === 'om' ? 'Miseensota Qofa' : 'Members Only'}</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name">{locale === 'am' ? 'በስም ደርድር' : locale === 'om' ? 'Gara Maqaa' : 'Sort by Name'}</option>
                  <option value="date">{locale === 'am' ? 'በቀን ደርድር' : locale === 'om' ? 'Gara Guyyaa' : 'Sort by Date'}</option>
                  <option value="household">{locale === 'am' ? 'በቤት ደርድር' : locale === 'om' ? 'Gara Mana' : 'Sort by Household'}</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-2"
                >
                  <FaSort /> {sortOrder === 'asc' ? (locale === 'am' ? 'ወጣ' : 'Ol') : (locale === 'am' ? 'ወረደ' : 'Gadi')}
                </button>
              </div>
            </div>
          </div>

          {/* Residents Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <FaSpinner className="animate-spin text-4xl text-blue-600" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                          {locale === 'am' ? 'መለያ' : locale === 'om' ? 'ID' : 'ID'}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                          {locale === 'am' ? 'ሙሉ ስም' : locale === 'om' ? 'Maqaa Guutuu' : 'Full Name'}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                          {locale === 'am' ? 'ጾታ' : locale === 'om' ? 'Saala' : 'Gender'}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                          {locale === 'am' ? 'የቤት ኮድ' : locale === 'om' ? 'Koodii Mana' : 'Household Code'}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                          {locale === 'am' ? 'ሚና' : locale === 'om' ? 'Gahee' : 'Role'}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                          {locale === 'am' ? 'ሁኔታ' : locale === 'om' ? 'Haala' : 'Status'}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                          {locale === 'am' ? 'ድርጊቶች' : locale === 'om' ? 'Gocha' : 'Actions'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paginatedResidents.map((resident) => (
                        <tr key={resident.resident_id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-mono text-gray-600">{resident.resident_id}</td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">{resident.fname} {resident.lname}</p>
                              <p className="text-xs text-gray-500">{resident.grandfather_name || ''}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {getGenderIcon(resident.sex)}
                              <span>{getGenderText(resident.sex)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                              {resident.household_code || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4">{getRoleBadge(resident)}</td>
                          <td className="px-6 py-4">
                            {resident.is_active !== false ? (
                              <span className="flex items-center gap-1 text-green-600 text-sm">
                                <FaCheckCircle className="text-xs" /> 
                                {locale === 'am' ? 'ንቁ' : locale === 'om' ? 'Aktiivii' : 'Active'}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-red-600 text-sm">
                                <FaTimesCircle className="text-xs" /> 
                                {locale === 'am' ? 'ንቁ ያልሆነ' : locale === 'om' ? 'Aktiivii miti' : 'Inactive'}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => {
                                setSelectedResident(resident);
                                setShowModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
                            >
                              <FaEye /> {locale === 'am' ? 'ዝርዝሮች' : locale === 'om' ? 'Ilaali' : 'View'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                    >
                      <FaChevronLeft />
                    </button>
                    <span className="text-sm text-gray-600">
                      {locale === 'am' ? 'ገጽ' : locale === 'om' ? 'Fuula' : 'Page'} {currentPage} {locale === 'am' ? 'የ' : locale === 'om' ? 'keessaa' : 'of'} {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                    >
                      <FaChevronRight />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Resident Details Modal */}
      {showModal && selectedResident && (
        <ResidentModal resident={selectedResident} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

export default withAuth(ResidentsPage, ['Record Officer']);
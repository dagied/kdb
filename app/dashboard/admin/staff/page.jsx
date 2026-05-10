'use client';

import { withAuth } from '@/components/withAuth';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useTranslation } from '@/hooks/useTranslation';
import { 
  FaUsers, FaUserPlus, FaEdit, FaTrash, FaEye, 
  FaSpinner, FaSearch, FaFilter, FaChevronLeft, 
  FaChevronRight, FaCheckCircle, FaTimesCircle,
  FaUser, FaEnvelope, FaPhone, FaCalendarAlt, FaVenusMars,
  FaUserGraduate, FaBriefcase, FaClock, FaBan, FaPause,
  FaPlay, FaInfoCircle
} from 'react-icons/fa';
import { MdVerified, MdPending } from 'react-icons/md';

function ManageStaff() {
  const { t, locale } = useTranslation();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [actionStaff, setActionStaff] = useState(null);
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editingStaff, setEditingStaff] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    gender: '',
    role_id: ''
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/auth/admin/get-staff');
      const data = await response.json();
      console.log('Fetched staff:', data);
      setStaff(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching staff:', error);
      setStaff([]);
      showMessage('error', locale === 'am' ? 'ሰራተኞችን ማምጣት አልተቻለም' : locale === 'om' ? 'Hojjettoonni fiduun hin danda\'amne' : 'Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // Filter and search staff
  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.phone?.includes(searchTerm);
    const matchesRole = filterRole === 'all' || member.role_name === filterRole;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && member.is_active === true) ||
                         (filterStatus === 'suspended' && member.is_suspended === true);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const paginatedStaff = filteredStaff.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getRoleBadge = (role) => {
    const colors = {
      'System Administrator': 'bg-purple-100 text-purple-700',
      'Kebele Manager': 'bg-blue-100 text-blue-700',
      'Record Officer': 'bg-green-100 text-green-700',
      'Resident': 'bg-gray-100 text-gray-700'
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  const getRoleNameInLanguage = (role) => {
    if (locale === 'am') {
      const roles = {
        'System Administrator': 'ሲስተም አስተዳዳሪ',
        'Kebele Manager': 'ቀበሌ ሥራ አስኪያጅ',
        'Record Officer': 'መዝገብ ኃላፊ',
        'Resident': 'ነዋሪ'
      };
      return roles[role] || role;
    } else if (locale === 'om') {
      const roles = {
        'System Administrator': 'Bulchaa Sistimii',
        'Kebele Manager': 'Mangaagaa Gabalaa',
        'Record Officer': 'Qindeessaa Galmeessaa',
        'Resident': 'Jiraataa'
      };
      return roles[role] || role;
    }
    return role;
  };

  const getStatusBadge = (member) => {
    if (!member.is_active) {
      return (
        <span className="flex items-center gap-1 text-red-600 text-sm">
          <FaTimesCircle className="text-xs" />
          {locale === 'am' ? 'ንቁ ያልሆነ' : locale === 'om' ? 'Aktiivii miti' : 'Inactive'}
        </span>
      );
    }
    if (member.is_suspended) {
      return (
        <span className="flex items-center gap-1 text-orange-600 text-sm">
          <FaBan className="text-xs" />
          {locale === 'am' ? 'ታግዷል' : locale === 'om' ? 'Dhaabame' : 'Suspended'}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-green-600 text-sm">
        <FaCheckCircle className="text-xs" />
        {locale === 'am' ? 'ንቁ' : locale === 'om' ? 'Aktiivii' : 'Active'}
      </span>
    );
  };

  const handleSuspendStaff = async (staffMember) => {
    try {
      const response = await fetch(`/api/auth/admin/suspend-staff/${staffMember.staff_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_suspended: true, is_active: false })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showMessage('success', locale === 'am' ? 'ሰራተኛ ታግዷል' : locale === 'om' ? 'Hojjetaan dhaabame' : 'Staff suspended');
        fetchStaff();
      } else {
        showMessage('error', data.error || 'Failed to suspend staff');
      }
    } catch (error) {
      console.error('Error suspending staff:', error);
      showMessage('error', 'Network error. Please try again.');
    }
    setShowActionModal(false);
    setActionStaff(null);
  };

  const handleActivateStaff = async (staffMember) => {
    try {
      const response = await fetch(`/api/auth/admin/activate-staff/${staffMember.staff_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: true, is_suspended: false })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showMessage('success', locale === 'am' ? 'ሰራተኛ ነቅቷል' : locale === 'om' ? 'Hojjetaan aktivaye' : 'Staff activated');
        fetchStaff();
      } else {
        showMessage('error', data.error || 'Failed to activate staff');
      }
    } catch (error) {
      console.error('Error activating staff:', error);
      showMessage('error', 'Network error. Please try again.');
    }
    setShowActionModal(false);
    setActionStaff(null);
  };

  const handleDeleteStaff = async (staffMember) => {
    if (confirm(locale === 'am' ? 'ሰራተኛውን ለማስወገድ እርግጠኛ ነዎት? ይህ እርምጃ ሊቀለበስ አይችልም።' : locale === 'om' ? 'Hojjetaa fixuuf mirkanaa’aa? Adeemsi kun irra deebi’uu hin danda’u.' : 'Are you sure you want to delete this staff? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/auth/admin/delete-staff/${staffMember.staff_id}`, {
          method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
          showMessage('success', locale === 'am' ? 'ሰራተኛ ተሰርዟል' : locale === 'om' ? 'Hojjetaan haqame' : 'Staff deleted');
          fetchStaff();
        } else {
          showMessage('error', data.error || 'Failed to delete staff');
        }
      } catch (error) {
        console.error('Error deleting staff:', error);
        showMessage('error', 'Network error. Please try again.');
      }
    }
  };

  const handleEditStaff = async (staffMember) => {
    setEditingStaff(staffMember);
    setEditFormData({
      full_name: staffMember.full_name || '',
      phone: staffMember.phone || '',
      email: staffMember.email || '',
      gender: staffMember.gender || '',
      role_id: staffMember.role_id || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/auth/admin/update-staff/${editingStaff.staff_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showMessage('success', locale === 'am' ? 'ሰራተኛ ተሻሽሏል' : locale === 'om' ? 'Hojjetaan fooyya\'e' : 'Staff updated');
        setShowEditModal(false);
        fetchStaff();
      } else {
        showMessage('error', data.error || 'Failed to update staff');
      }
    } catch (error) {
      console.error('Error updating staff:', error);
      showMessage('error', 'Network error. Please try again.');
    }
  };

  const StaffModal = ({ staff: member, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            {locale === 'am' ? 'የሰራተኛ ዝርዝሮች' : locale === 'om' ? 'Gadifageenya Hojjetaa' : 'Staff Details'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimesCircle size={24} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
                <FaUser className="text-4xl" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">{member.full_name}</h3>
                <p className="text-blue-100 mt-1">
                  {locale === 'am' ? 'የሰራተኛ መለያ:' : locale === 'om' ? 'ID Hojjetaa:' : 'Staff ID:'} {member.staff_id}
                </p>
                <div className="flex gap-2 mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleBadge(member.role_name)} bg-opacity-20 text-white`}>
                    {getRoleNameInLanguage(member.role_name)}
                  </span>
                  {member.is_active && !member.is_suspended && (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-500 text-white">
                      {locale === 'am' ? 'ንቁ' : locale === 'om' ? 'Aktiivii' : 'Active'}
                    </span>
                  )}
                  {member.is_suspended && (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-orange-500 text-white">
                      {locale === 'am' ? 'ታግዷል' : locale === 'om' ? 'Dhaabame' : 'Suspended'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FaUser className="text-blue-600" /> 
                {locale === 'am' ? 'የግል መረጃ' : locale === 'om' ? 'Odeeffannoo Dhuunfaa' : 'Personal Information'}
              </h4>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">{locale === 'am' ? 'ሙሉ ስም:' : locale === 'om' ? 'Maqaa Guutuu:' : 'Full Name:'}</span> {member.full_name}</p>
                <p><span className="text-gray-500">{locale === 'am' ? 'ጾታ:' : locale === 'om' ? 'Saala:' : 'Gender:'}</span> {member.gender || 'N/A'}</p>
                <p><span className="text-gray-500">{locale === 'am' ? 'ስልክ:' : locale === 'om' ? 'Bilbilaa:' : 'Phone:'}</span> {member.phone || 'N/A'}</p>
                <p><span className="text-gray-500">{locale === 'am' ? 'ኢሜል:' : locale === 'om' ? 'Imeeili:' : 'Email:'}</span> {member.email || 'N/A'}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FaBriefcase className="text-green-600" /> 
                {locale === 'am' ? 'የአካውንት መረጃ' : locale === 'om' ? 'Odeeffannoo Akaawuntii' : 'Account Information'}
              </h4>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">{locale === 'am' ? 'ሚና:' : locale === 'om' ? 'Gahee:' : 'Role:'}</span> {getRoleNameInLanguage(member.role_name)}</p>
                <p><span className="text-gray-500">{locale === 'am' ? 'ሁኔታ:' : locale === 'om' ? 'Haala:' : 'Status:'}</span> {member.is_active ? (member.is_suspended ? 'Suspended' : 'Active') : 'Inactive'}</p>
                <p><span className="text-gray-500">{locale === 'am' ? 'የተቀላቀሉበት:' : locale === 'om' ? 'Bara Makuu:' : 'Joined:'}</span> {member.created_at ? new Date(member.created_at).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ActionModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-800">
            {actionType === 'suspend' && (locale === 'am' ? 'ሰራተኛ ማገድ' : locale === 'om' ? 'Hojjetaa Dhaabuu' : 'Suspend Staff')}
            {actionType === 'activate' && (locale === 'am' ? 'ሰራተኛ ማንቃት' : locale === 'om' ? 'Hojjetaa Aktivaasuu' : 'Activate Staff')}
          </h2>
        </div>
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            {actionType === 'suspend' && (locale === 'am' ? `"${actionStaff?.full_name}" ን ማገድ ይፈልጋሉ?` : locale === 'om' ? `"${actionStaff?.full_name}" dhaabuuf barbaaddu?` : `Are you sure you want to suspend "${actionStaff?.full_name}"?`)}
            {actionType === 'activate' && (locale === 'am' ? `"${actionStaff?.full_name}" ን ማንቃት ይፈልጋሉ?` : locale === 'om' ? `"${actionStaff?.full_name}" aktivaasuu barbaaddu?` : `Are you sure you want to activate "${actionStaff?.full_name}"?`)}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowActionModal(false)}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50"
            >
              {locale === 'am' ? 'ሰርዝ' : locale === 'om' ? 'Haqi' : 'Cancel'}
            </button>
            <button
              onClick={() => {
                if (actionType === 'suspend') handleSuspendStaff(actionStaff);
                if (actionType === 'activate') handleActivateStaff(actionStaff);
              }}
              className={`flex-1 px-4 py-2 rounded-xl text-white ${
                actionType === 'suspend' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {actionType === 'suspend' ? (locale === 'am' ? 'አግድ' : locale === 'om' ? 'Dhaabi' : 'Suspend') : (locale === 'am' ? 'አንቃ' : locale === 'om' ? 'Aktivaasi' : 'Activate')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const EditModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            {locale === 'am' ? 'ሰራተኛ ማስተካከያ' : locale === 'om' ? 'Hojjetaa Fooyyeessi' : 'Edit Staff'}
          </h2>
          <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
            <FaTimesCircle size={24} />
          </button>
        </div>
        <form onSubmit={handleUpdateStaff} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {locale === 'am' ? 'ሙሉ ስም' : locale === 'om' ? 'Maqaa Guutuu' : 'Full Name'}
            </label>
            <input
              type="text"
              value={editFormData.full_name}
              onChange={(e) => setEditFormData({...editFormData, full_name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {locale === 'am' ? 'ስልክ' : locale === 'om' ? 'Bilbilaa' : 'Phone'}
            </label>
            <input
              type="tel"
              value={editFormData.phone}
              onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {locale === 'am' ? 'ኢሜል' : locale === 'om' ? 'Imeeili' : 'Email'}
            </label>
            <input
              type="email"
              value={editFormData.email}
              onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {locale === 'am' ? 'ጾታ' : locale === 'om' ? 'Saala' : 'Gender'}
            </label>
            <select
              value={editFormData.gender}
              onChange={(e) => setEditFormData({...editFormData, gender: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{locale === 'am' ? 'ይምረጡ' : locale === 'om' ? 'Filadhu' : 'Select'}</option>
              <option value="Male">{locale === 'am' ? 'ወንድ' : locale === 'om' ? 'Dhiira' : 'Male'}</option>
              <option value="Female">{locale === 'am' ? 'ሴት' : locale === 'om' ? 'Dhalaa' : 'Female'}</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50"
            >
              {locale === 'am' ? 'ሰርዝ' : locale === 'om' ? 'Haqi' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            >
              {locale === 'am' ? 'አስቀምጥ' : locale === 'om' ? 'Eegi' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar role="System Administrator" />
        <div className="flex-1 flex items-center justify-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role="System Administrator" />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <FaUsers className="text-blue-600" /> 
              {locale === 'am' ? 'ሰራተኞችን ያስተዳድሩ' : locale === 'om' ? 'Hojjetttoota Bulchuu' : 'Manage Staff'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {locale === 'am' ? 'በስርዓቱ ውስጥ ያሉ ሁሉንም የሰራተኛ መለያዎች ይመልከቱ እና ያስተዳድሩ' : locale === 'om' ? 'Akaawuntii hojjetaa hunda sistimii keessatti ilaaliifi bulchi' : 'View and manage all staff accounts in the system'}
            </p>
          </div>

          {/* Message Alert */}
          {message.text && (
            <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {message.type === 'success' ? <FaCheckCircle /> : <FaTimesCircle />}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-800">{staff.length}</p>
                  <p className="text-xs text-gray-500">{locale === 'am' ? 'ጠቅላላ ሰራተኞች' : locale === 'om' ? 'Hojjetttoota Waligalaa' : 'Total Staff'}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FaUsers className="text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    {staff.filter(s => s.role_name === 'System Administrator').length}
                  </p>
                  <p className="text-xs text-gray-500">{locale === 'am' ? 'አስተዳዳሪዎች' : locale === 'om' ? 'Bulchitoota' : 'Admins'}</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <FaUserGraduate className="text-purple-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {staff.filter(s => s.role_name === 'Kebele Manager').length}
                  </p>
                  <p className="text-xs text-gray-500">{locale === 'am' ? 'አስተዳዳሪዎች' : locale === 'om' ? 'Mangaagota' : 'Managers'}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FaBriefcase className="text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {staff.filter(s => s.role_name === 'Record Officer').length}
                  </p>
                  <p className="text-xs text-gray-500">{locale === 'am' ? 'መዝገብ ኃላፊዎች' : locale === 'om' ? 'Galmeessitoota' : 'Officers'}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <MdVerified className="text-green-600" />
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
                  placeholder={locale === 'am' ? 'በስም፣ ኢሜል ወይም ስልክ ይፈልጉ...' : locale === 'om' ? 'Maqaa, Imeeilii ykn Bilbilaan fafa...' : 'Search by name, email, or phone...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="relative">
                <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                >
                  <option value="all">{locale === 'am' ? 'ሁሉም ሚናዎች' : locale === 'om' ? 'Gahee Hunda' : 'All Roles'}</option>
                  <option value="System Administrator">{locale === 'am' ? 'ሲስተም አስተዳዳሪ' : locale === 'om' ? 'Bulchaa Sistimii' : 'System Administrator'}</option>
                  <option value="Kebele Manager">{locale === 'am' ? 'ቀበሌ ሥራ አስኪያጅ' : locale === 'om' ? 'Mangaagaa Gabalaa' : 'Kebele Manager'}</option>
                  <option value="Record Officer">{locale === 'am' ? 'መዝገብ ኃላፊ' : locale === 'om' ? 'Qindeessaa Galmeessaa' : 'Record Officer'}</option>
                </select>
              </div>
              <div className="relative">
                <FaInfoCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                >
                  <option value="active">{locale === 'am' ? 'ንቁ' : locale === 'om' ? 'Aktiivii' : 'Active'}</option>
                  <option value="suspended">{locale === 'am' ? 'የታገደ' : locale === 'om' ? 'Dhaabame' : 'Suspended'}</option>
                  <option value="all">{locale === 'am' ? 'ሁሉም' : locale === 'om' ? 'Hunda' : 'All'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Staff Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{locale === 'am' ? 'መለያ' : locale === 'om' ? 'ID' : 'ID'}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{locale === 'am' ? 'ሙሉ ስም' : locale === 'om' ? 'Maqaa Guutuu' : 'Full Name'}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{locale === 'am' ? 'ኢሜል' : locale === 'om' ? 'Imeeili' : 'Email'}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{locale === 'am' ? 'ስልክ' : locale === 'om' ? 'Bilbilaa' : 'Phone'}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{locale === 'am' ? 'ሚና' : locale === 'om' ? 'Gahee' : 'Role'}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{locale === 'am' ? 'ሁኔታ' : locale === 'om' ? 'Haala' : 'Status'}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{locale === 'am' ? 'ድርጊቶች' : locale === 'om' ? 'Gochaalee' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedStaff.map((member) => {
                    const key = member.staff_id || `staff-${Math.random()}`;
                    return (
                      <tr key={key} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-mono text-gray-600">{member.staff_id}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <FaUser className="text-gray-500 text-sm" />
                            </div>
                            <span className="font-medium text-gray-900">{member.full_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{member.email || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{member.phone || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadge(member.role_name)}`}>
                            {getRoleNameInLanguage(member.role_name)}
                          </span>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(member)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedStaff(member);
                                setShowModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-700 p-1 transition-colors"
                              title={locale === 'am' ? 'ዝርዝሮችን ይመልከቱ' : locale === 'om' ? 'Gadifageenya ilaali' : 'View Details'}
                            >
                              <FaEye size={16} />
                            </button>
                            <button
                              onClick={() => handleEditStaff(member)}
                              className="text-green-600 hover:text-green-700 p-1 transition-colors"
                              title={locale === 'am' ? 'አርትዕ' : locale === 'om' ? 'Fooyyeessi' : 'Edit'}
                            >
                              <FaEdit size={16} />
                            </button>
                            {member.is_active && !member.is_suspended && (
                              <button
                                onClick={() => {
                                  setActionType('suspend');
                                  setActionStaff(member);
                                  setShowActionModal(true);
                                }}
                                className="text-orange-600 hover:text-orange-700 p-1 transition-colors"
                                title={locale === 'am' ? 'አግድ' : locale === 'om' ? 'Dhaabi' : 'Suspend'}
                              >
                                <FaBan size={16} />
                              </button>
                            )}
                            {member.is_suspended && (
                              <button
                                onClick={() => {
                                  setActionType('activate');
                                  setActionStaff(member);
                                  setShowActionModal(true);
                                }}
                                className="text-green-600 hover:text-green-700 p-1 transition-colors"
                                title={locale === 'am' ? 'አንቃ' : locale === 'om' ? 'Aktivaasi' : 'Activate'}
                              >
                                <FaPlay size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteStaff(member)}
                              className="text-red-600 hover:text-red-700 p-1 transition-colors"
                              title={locale === 'am' ? 'ሰርዝ' : locale === 'om' ? 'Haqi' : 'Delete'}
                            >
                              <FaTrash size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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

            {/* Empty State */}
            {paginatedStaff.length === 0 && (
              <div className="text-center py-12">
                <FaUsers className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  {locale === 'am' ? 'ምንም ሰራተኛ አልተገኘም' : locale === 'om' ? 'Hojjetaan hin argamne' : 'No staff found'}
                </h3>
                <p className="text-sm text-gray-400">
                  {locale === 'am' ? 'እባክዎ የፍለጋ ወይም የማጣሪያ መስፈርቶችዎን ያስተካክሉ' : locale === 'om' ? 'Mee filannooyi fi barbaacha keessan walsimsiisaa' : 'Try adjusting your search or filter criteria'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showModal && selectedStaff && (
        <StaffModal staff={selectedStaff} onClose={() => setShowModal(false)} />
      )}
      {showActionModal && actionStaff && (
        <ActionModal />
      )}
      {showEditModal && editingStaff && (
        <EditModal />
      )}
    </div>
  );
}

export default withAuth(ManageStaff, ['System Administrator']);
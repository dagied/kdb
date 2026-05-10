'use client';

import { withAuth } from '@/components/withAuth';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  FaSearch, FaEye, FaUser, FaPhone, FaBriefcase,
  FaCalendarAlt, FaUsers, FaCheckCircle,
  FaTimesCircle, FaSpinner, FaChevronLeft, FaChevronRight,
  FaSort, FaVenusMars, FaUserCheck
} from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';
import { GiFamilyHouse } from 'react-icons/gi';

function ResidentsPage() {
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
    if (resident.is_head) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">Head</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">{resident.household_role || 'Member'}</span>;
  };

  const getGenderIcon = (sex) => {
    if (sex === 'M') return <FaVenusMars className="text-blue-500" />;
    return <FaVenusMars className="text-pink-500" />;
  };

  const ResidentModal = ({ resident, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Resident Details</h2>
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
                <p className="text-blue-100 mt-1">{resident.household_role || 'Member'} • Resident ID: {resident.resident_id}</p>
                <div className="flex gap-2 mt-2">
                  {getRoleBadge(resident)}
                  {resident.is_active !== false && <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500 text-white">Active</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FaUser className="text-blue-600" /> Personal Information
              </h4>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">Full Name:</span> {resident.fname} {resident.lname} {resident.grandfather_name || ''}</p>
                <p><span className="text-gray-500">Date of Birth:</span> {resident.birthdate || resident.date_of_birth || 'N/A'}</p>
                <p><span className="text-gray-500">Gender:</span> {resident.sex === 'M' ? 'Male' : 'Female'}</p>
                <p><span className="text-gray-500">Marital Status:</span> {resident.marital_status || 'N/A'}</p>
                <p><span className="text-gray-500">Nationality:</span> {resident.nationality || 'Ethiopian'}</p>
                <p><span className="text-gray-500">National ID:</span> {resident.national_id || 'N/A'}</p>
              </div>
            </div>

            {/* Household Information */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <GiFamilyHouse className="text-green-600" /> Household Information
              </h4>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">House ID:</span> {resident.house_id || 'N/A'}</p>
                <p><span className="text-gray-500">Household Code:</span> <span className="font-mono">{resident.household_code || 'N/A'}</span></p>
                <p><span className="text-gray-500">Household Role:</span> {resident.household_role || 'Member'}</p>
                <p><span className="text-gray-500">Is Head:</span> {resident.is_head ? 'Yes' : 'No'}</p>
                <p><span className="text-gray-500">Registration Date:</span> {new Date(resident.registration_date || resident.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FaPhone className="text-yellow-600" /> Contact Information
              </h4>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">Phone Numbers:</span> {resident.phones?.length > 0 ? resident.phones.join(', ') : 'N/A'}</p>
                <p><span className="text-gray-500">Place of Birth:</span> {resident.place_of_birth || 'N/A'}</p>
                <p><span className="text-gray-500">Previous Kebele:</span> {resident.previous_kebele || 'N/A'}</p>
              </div>
            </div>

            {/* Employment & Education */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FaBriefcase className="text-indigo-600" /> Employment & Education
              </h4>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">Occupation:</span> {resident.job_title || 'N/A'}</p>
                <p><span className="text-gray-500">Employer:</span> {resident.employer || 'N/A'}</p>
                <p><span className="text-gray-500">Education Level:</span> {resident.education_level || 'N/A'}</p>
                <p><span className="text-gray-500">Religion:</span> {resident.religion || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Verification Information */}
          {(resident.verified_by || resident.verification_note) && (
            <div className="mt-6 bg-green-50 rounded-xl p-4 border border-green-200">
              <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                <MdVerified /> Community Verification
              </h4>
              <div className="text-sm space-y-1">
                <p><span className="text-gray-600">Verified By:</span> {resident.verified_by || 'N/A'}</p>
                <p><span className="text-gray-600">Verification Date:</span> {resident.verification_date || 'N/A'}</p>
                <p><span className="text-gray-600">Notes:</span> {resident.verification_note || 'N/A'}</p>
              </div>
            </div>
          )}

          {/* Notes */}
          {resident.notes && (
            <div className="mt-4 bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <h4 className="font-semibold text-yellow-700 mb-2">Additional Notes</h4>
              <p className="text-sm text-gray-700">{resident.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role="System Administrator" />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <FaUsers className="text-blue-600" /> Resident Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">View and manage all registered residents in the kebele</p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                  <p className="text-xs text-gray-500">Total Residents</p>
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
                  <p className="text-xs text-gray-500">Male</p>
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
                  <p className="text-xs text-gray-500">Female</p>
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
                  <p className="text-xs text-gray-500">Household Heads</p>
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
                  <p className="text-xs text-gray-500">Active Residents</p>
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
                  placeholder="Search by name, national ID, or household code..."
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
                  <option value="all">All Members</option>
                  <option value="head">Heads Only</option>
                  <option value="member">Members Only</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name">Sort by Name</option>
                  <option value="date">Sort by Date</option>
                  <option value="household">Sort by Household</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-2"
                >
                  <FaSort /> {sortOrder === 'asc' ? 'Asc' : 'Desc'}
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
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Full Name</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Gender</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Household Code</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
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
                              <span>{resident.sex === 'M' ? 'Male' : 'Female'}</span>
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
                                <FaCheckCircle className="text-xs" /> Active
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-red-600 text-sm">
                                <FaTimesCircle className="text-xs" /> Inactive
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
                              <FaEye /> View
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
                      Page {currentPage} of {totalPages}
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

export default withAuth(ResidentsPage, ['System Administrator']);
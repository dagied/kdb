'use client';

import { withAuth } from '@/components/withAuth';
import Layout from '@/components/Layout';
import { useState, useEffect } from 'react';
import { 
  FaGavel, FaPlus, FaEdit, FaTrash, FaEye, 
  FaSpinner, FaSearch, FaCheckCircle, FaTimesCircle,
  FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaCalendarAlt,
  FaVenusMars, FaGraduationCap, FaBriefcase, FaUserCheck,
  FaUsers, FaThList, FaIdCard
} from 'react-icons/fa';
import { MdVerified, MdPending } from 'react-icons/md';

export default function JudgesPage() {
  const [judges, setJudges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingJudge, setEditingJudge] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    date_of_birth: '',
    gender: '',
    education_level: '',
    experience_years: '',
    community_approved: false,
    approval_notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchJudges();
  }, []);

  const fetchJudges = async () => {
    try {
      const res = await fetch('/api/auth/admin/judges')
      const data = await res.json();
      if (data.success) {
        setJudges(data.judges);
      }
    } catch (error) {
      console.error('Error fetching judges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const url = editingJudge 
        ? `/api/auth/admin/judges` 
        : '/api/auth/admin/judges';
      const method = editingJudge ? 'PUT' : 'POST';
      
      const payload = editingJudge 
        ? { ...formData, judge_id: editingJudge.judge_id }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: editingJudge ? 'Judge updated successfully!' : 'Judge added successfully!' 
        });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        setShowModal(false);
        setEditingJudge(null);
        resetForm();
        fetchJudges();
      } else {
        setMessage({ type: 'error', text: data.error || 'Operation failed' });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (judgeId, judgeName) => {
    if (!confirm(`Are you sure you want to remove ${judgeName} from the judges list?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/auth/admin/judges?id=${judgeId}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Judge removed successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        fetchJudges();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to remove judge' });
      }
    } catch (error) {
      console.error('Error deleting judge:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
  };

  const openEditModal = (judge) => {
    setEditingJudge(judge);
    setFormData({
      full_name: judge.full_name || '',
      phone: judge.phone || '',
      email: judge.email || '',
      address: judge.address || '',
      date_of_birth: judge.date_of_birth || '',
      gender: judge.gender || '',
      education_level: judge.education_level || '',
      experience_years: judge.experience_years || '',
      community_approved: judge.community_approved || false,
      approval_notes: judge.approval_notes || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      phone: '',
      email: '',
      address: '',
      date_of_birth: '',
      gender: '',
      education_level: '',
      experience_years: '',
      community_approved: false,
      approval_notes: ''
    });
    setEditingJudge(null);
  };

  const filteredJudges = judges.filter(judge =>
    judge.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    judge.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    judge.phone?.includes(searchTerm)
  );

  const activeJudges = judges.filter(j => j.is_active !== false);

  const JudgeCard = ({ judge }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FaGavel className="text-white" />
            <span className="text-sm font-medium">Judge</span>
          </div>
          {judge.community_approved && (
            <span className="text-xs bg-green-500 px-2 py-0.5 rounded-full flex items-center gap-1">
              <MdVerified size={12} /> Approved
            </span>
          )}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <FaUser className="text-blue-600 text-xl" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{judge.full_name}</h3>
            <p className="text-xs text-gray-500">{judge.experience_years} years experience</p>
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          {judge.phone && (
            <p className="flex items-center gap-2 text-gray-600">
              <FaPhone size={12} /> {judge.phone}
            </p>
          )}
          {judge.email && (
            <p className="flex items-center gap-2 text-gray-600">
              <FaEnvelope size={12} /> {judge.email}
            </p>
          )}
          {judge.education_level && (
            <p className="flex items-center gap-2 text-gray-600">
              <FaGraduationCap size={12} /> {judge.education_level}
            </p>
          )}
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end gap-2">
          <button
            onClick={() => openEditModal(judge)}
            className="text-blue-600 hover:text-blue-700 p-1"
            title="Edit Judge"
          >
            <FaEdit size={16} />
          </button>
          <button
            onClick={() => handleDelete(judge.judge_id, judge.full_name)}
            className="text-red-600 hover:text-red-700 p-1"
            title="Remove Judge"
          >
            <FaTrash size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  const JudgeListItem = ({ judge }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <FaUser className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{judge.full_name}</h3>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
              {judge.phone && <span>📞 {judge.phone}</span>}
              {judge.email && <span>✉️ {judge.email}</span>}
              <span>⭐ {judge.experience_years || 0} years</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {judge.community_approved ? (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
              <MdVerified size={12} /> Approved
            </span>
          ) : (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full flex items-center gap-1">
              <MdPending size={12} /> Pending
            </span>
          )}
          <button
            onClick={() => openEditModal(judge)}
            className="text-blue-600 hover:text-blue-700"
            title="Edit"
          >
            <FaEdit size={16} />
          </button>
          <button
            onClick={() => handleDelete(judge.judge_id, judge.full_name)}
            className="text-red-600 hover:text-red-700"
            title="Remove"
          >
            <FaTrash size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <Layout role="System Administrator">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FaGavel className="text-blue-600" /> Judge Management
            </h1>
            <p className="text-gray-500 text-sm mt-1">Add, manage, and approve social court judges</p>
          </div>
          <div className="flex gap-3">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'}`}
              >
                <FaUsers className="inline mr-1" /> Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'}`}
              >
                <FaThList className="inline mr-1" /> List
              </button>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition flex items-center gap-2"
            >
              <FaPlus size={14} /> Add Judge
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <p className="text-sm opacity-90">Total Judges</p>
            <p className="text-2xl font-bold">{judges.length}</p>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
            <p className="text-sm opacity-90">Active Judges</p>
            <p className="text-2xl font-bold">{activeJudges.length}</p>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
            <p className="text-sm opacity-90">Community Approved</p>
            <p className="text-2xl font-bold">{activeJudges.filter(j => j.community_approved).length}</p>
          </div>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`p-3 rounded-xl flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? <FaCheckCircle /> : <FaTimesCircle />}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search judges by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Judges Display */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <FaSpinner className="animate-spin text-4xl text-blue-600" />
          </div>
        ) : filteredJudges.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <FaGavel className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600">No judges found</h3>
            <p className="text-sm text-gray-400 mt-1">Click "Add Judge" to get started</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredJudges.map(judge => (
              <JudgeCard key={judge.judge_id} judge={judge} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJudges.map(judge => (
              <JudgeListItem key={judge.judge_id} judge={judge} />
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Judge Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FaGavel className="text-blue-600" />
                {editingJudge ? 'Edit Judge' : 'Add New Judge'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimesCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+251 911 123 456"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="judge@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Education Level</label>
                  <input
                    type="text"
                    name="education_level"
                    value={formData.education_level}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., LLB, MA in Law"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    name="experience_years"
                    value={formData.experience_years}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Full address"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="community_approved"
                      checked={formData.community_approved}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Community Approved</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Check this box if the judge has received community approval</p>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Approval Notes</label>
                  <textarea
                    name="approval_notes"
                    value={formData.approval_notes}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Notes about community approval process..."
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center justify-center gap-2"
                >
                  {submitting ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                  {submitting ? 'Saving...' : editingJudge ? 'Update Judge' : 'Add Judge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
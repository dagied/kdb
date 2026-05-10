'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { withAuth } from '@/components/withAuth';
import { 
  FaCity, FaPlus, FaEdit, FaTrash, FaEye, 
  FaSpinner, FaSearch, FaChevronLeft, FaChevronRight,
  FaCheckCircle, FaTimesCircle, FaHome, FaMapMarkerAlt,
  FaCalendarAlt, FaSave, FaTimes, FaBuilding,
  FaChartBar, FaUsers, FaClipboardList, FaClock
} from 'react-icons/fa';
import { MdVerified, MdLocationCity, MdOutlineRequestPage } from 'react-icons/md';

function ManageKebele() {
  const [activeTab, setActiveTab] = useState('kebeles');
  const [kebeles, setKebeles] = useState([]);
  const [requests, setRequests] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [predictionsLoading, setPredictionsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingKebele, setEditingKebele] = useState(null);
  const [formData, setFormData] = useState({
    kebele_name: '',
    description: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (activeTab === 'kebeles') {
      fetchKebeles();
    } else if (activeTab === 'requests') {
      fetchRequests();
    } else if (activeTab === 'reports') {
      if (kebeles.length === 0) fetchKebeles();
      if (requests.length === 0) fetchRequests();
      fetchPredictions();
    }
  }, [activeTab]);

  const fetchKebeles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/kebeles');
      const data = await response.json();
      if (data.success) {
        setKebeles(data.kebeles || []);
      } else {
        setKebeles([]);
      }
    } catch (error) {
      console.error('Error fetching kebeles:', error);
      setKebeles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    setRequestsLoading(true);
    try {
      const response = await fetch('/api/requests');
      const data = await response.json();
      if (Array.isArray(data)) {
        setRequests(data);
      } else if (data.requests && Array.isArray(data.requests)) {
        setRequests(data.requests);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      setRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  };

  const fetchPredictions = async () => {
    setPredictionsLoading(true);
    try {
      const res = await fetch('/api/analytics/predict');
      const data = await res.json();
      if (data.success) setPredictions(data);
    } catch (err) {
      console.error('Prediction fetch failed:', err);
    } finally {
      setPredictionsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      const url = editingKebele 
        ? `/api/kebeles/${editingKebele.kebele_id}` 
        : '/api/kebeles';
      const method = editingKebele ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ 
          type: 'success', 
          text: editingKebele ? 'Kebele updated successfully!' : 'Kebele created successfully!' 
        });
        fetchKebeles();
        closeModal();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save kebele' });
      }
    } catch (error) {
      console.error('Error saving kebele:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
  };

  const handleDelete = async (kebeleId, kebeleName) => {
    if (!confirm(`Are you sure you want to delete "${kebeleName}"? This will also affect houses and households linked to this kebele.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/kebeles/${kebeleId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: 'Kebele deleted successfully!' });
        fetchKebeles();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete kebele' });
      }
    } catch (error) {
      console.error('Error deleting kebele:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
  };

  const openModal = (kebele = null) => {
    if (kebele) {
      setEditingKebele(kebele);
      setFormData({
        kebele_name: kebele.kebele_name,
        description: kebele.description || ''
      });
    } else {
      setEditingKebele(null);
      setFormData({ kebele_name: '', description: '' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingKebele(null);
    setFormData({ kebele_name: '', description: '' });
  };

  const filteredKebeles = kebeles.filter(kebele =>
    kebele.kebele_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kebele.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredKebeles.length / itemsPerPage);
  const paginatedKebeles = filteredKebeles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const requestStats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    completed: requests.filter(r => r.status === 'completed').length,
    completionRate: requests.length > 0 
      ? Math.round((requests.filter(r => r.status === 'completed' || r.status === 'approved').length / requests.length) * 100)
      : 0
  };

  const KebeleModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            {editingKebele ? 'Edit Kebele' : 'Add New Kebele'}
          </h2>
          <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
            <FaTimes size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kebele Name *
            </label>
            <div className="relative">
              <MdLocationCity className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="kebele_name"
                value={formData.kebele_name}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter kebele name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Enter kebele description (optional)"
            />
          </div>

          {message.text && (
            <div className={`p-3 rounded-xl text-sm ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition flex items-center justify-center gap-2"
            >
              <FaSave className="text-sm" />
              {editingKebele ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <Layout role="System Administrator">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">

        {/* Tab Navigation */}
        <div className="flex gap-3 mb-6 justify-center flex-wrap">
          {[
            { key: "kebeles", label: "Kebeles", icon: FaCity },
            { key: "requests", label: "Service Requests", icon: MdOutlineRequestPage },
            { key: "reports", label: "Reports & Analytics", icon: FaChartBar },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === tab.key
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon className="text-lg" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="max-w-6xl mx-auto">

          {/* ================= KEBELES TAB ================= */}
          {activeTab === "kebeles" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{kebeles.length}</p>
                      <p className="text-xs text-gray-500">Total Kebeles</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <FaCity className="text-blue-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {kebeles.filter(k => k.kebele_name).length}
                      </p>
                      <p className="text-xs text-gray-500">Active Kebeles</p>
                    </div>
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <FaCheckCircle className="text-green-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-purple-600">+</p>
                      <p className="text-xs text-gray-500">Add New</p>
                    </div>
                    <button 
                      onClick={() => openModal()}
                      className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center hover:bg-purple-200 transition"
                    >
                      <FaPlus className="text-purple-600" />
                    </button>
                  </div>
                </div>
              </div>

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

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search kebele by name or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
                  >
                    <FaPlus className="text-sm" />
                    Add New Kebele
                  </button>
                </div>
              </div>

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
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Kebele Name</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Created At</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {paginatedKebeles.map((kebele) => (
                            <tr key={kebele.kebele_id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 text-sm font-mono text-gray-600">{kebele.kebele_id}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <MdLocationCity className="text-blue-600 text-sm" />
                                  </div>
                                  <span className="font-medium text-gray-900">{kebele.kebele_name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                                {kebele.description || '—'}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {kebele.created_at ? new Date(kebele.created_at).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => openModal(kebele)}
                                    className="text-green-600 hover:text-green-700 p-1 transition-colors"
                                    title="Edit Kebele"
                                  >
                                    <FaEdit size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(kebele.kebele_id, kebele.kebele_name)}
                                    className="text-red-600 hover:text-red-700 p-1 transition-colors"
                                    title="Delete Kebele"
                                  >
                                    <FaTrash size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {totalPages > 1 && (
                      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
                        >
                          <FaChevronLeft />
                        </button>
                        <span className="text-sm text-gray-600">
                          Page {currentPage} of {totalPages} ({filteredKebeles.length} kebeles)
                        </span>
                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
                        >
                          <FaChevronRight />
                        </button>
                      </div>
                    )}

                    {paginatedKebeles.length === 0 && (
                      <div className="text-center py-12">
                        <FaCity className="text-6xl text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-600 mb-2">No kebeles found</h3>
                        <p className="text-sm text-gray-400">
                          {searchTerm ? 'Try adjusting your search' : 'Click "Add New Kebele" to create one'}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}

          {/* ================= SERVICE REQUESTS TAB ================= */}
          {activeTab === "requests" && (
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <h1 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <MdOutlineRequestPage className="text-blue-600" />
                Service Requests
              </h1>
              <p className="text-gray-500 mb-6">View and manage service requests from residents</p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-4">
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-blue-600">{requestStats.total}</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-orange-100 rounded-xl p-4">
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{requestStats.pending}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4">
                  <p className="text-sm text-gray-600">Approved/Completed</p>
                  <p className="text-2xl font-bold text-green-600">{requestStats.approved + requestStats.completed}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-4">
                  <p className="text-sm text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-purple-600">{requestStats.completionRate}%</p>
                </div>
              </div>

              {requestsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <FaSpinner className="animate-spin text-4xl text-blue-600" />
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-12">
                  <MdOutlineRequestPage className="text-6xl text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600">No service requests found</h3>
                  <p className="text-sm text-gray-400 mt-1">Service requests will appear here when residents submit them</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-xl">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-3 text-left text-sm font-semibold text-gray-700">ID</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-700">Resident</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-700">Service Type</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-700">Status</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-700">Date</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((req, index) => (
                        <tr key={req.request_id || index} className="border-t hover:bg-gray-50">
                          <td className="p-3 text-sm text-gray-600">{req.request_id || index + 1}</td>
                          <td className="p-3 text-sm text-gray-800">
                            {req.resident_name || `Resident #${req.resident_id}`}
                          </td>
                          <td className="p-3 text-sm text-gray-600">{req.service_name || req.service_type || 'N/A'}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              req.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                              req.status === "approved" ? "bg-green-100 text-green-700" :
                              req.status === "completed" ? "bg-blue-100 text-blue-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              {req.status || "Pending"}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-gray-600">
                            {req.request_date ? new Date(req.request_date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="p-3">
                            <button className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
                              <FaEye size={12} /> View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ================= REPORTS & ANALYTICS TAB ================= */}
          {activeTab === "reports" && (
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <h1 className="text-2xl font-bold text-gray-800 mb-1 flex items-center gap-2">
                <FaChartBar className="text-purple-600" />
                Reports & Analytics
              </h1>
              <p className="text-gray-500 mb-6">
                ML-powered predictions based on real service request history
              </p>

              {predictionsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <FaSpinner className="animate-spin text-4xl text-purple-600" />
                </div>
              ) : !predictions ? (
                <p className="text-center text-gray-400 py-12">Failed to load predictions. Make sure the ML service is running.</p>
              ) : (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-5">
                      <FaBuilding className="text-blue-600 text-xl mb-2" />
                      <p className="text-xs text-gray-500">Total Kebeles</p>
                      <p className="text-3xl font-bold text-blue-600">{kebeles.length}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-5">
                      <FaClipboardList className="text-green-600 text-xl mb-2" />
                      <p className="text-xs text-gray-500">Months of Data</p>
                      <p className="text-3xl font-bold text-green-600">{predictions.data_points}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-5">
                      <FaClock className="text-purple-600 text-xl mb-2" />
                      <p className="text-xs text-gray-500">Avg Resolution</p>
                      <p className="text-3xl font-bold text-purple-600">
                        {predictions.avg_resolution_days ?? '--'}
                        <span className="text-sm font-normal ml-1">days</span>
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-xl p-5">
                      <FaUsers className="text-amber-600 text-xl mb-2" />
                      <p className="text-xs text-gray-500">This Month Total</p>
                      <p className="text-3xl font-bold text-amber-600">
                        {predictions.status_breakdown.reduce((a, s) => a + s.count, 0)}
                      </p>
                    </div>
                  </div>

                  {/* Overall Forecast */}
                  <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl mb-6">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Predicted Requests — Next Month
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Linear regression over {predictions.data_points} month(s) of history
                    </p>
                    <div className="flex items-end gap-4 mb-3">
                      <p className="text-5xl font-extrabold text-amber-700">
                        ~{predictions.overall_forecast.predicted}
                      </p>
                      <div className="mb-1 text-sm text-gray-600">
                        <p>Trend: <span className={predictions.overall_forecast.slope >= 0 ? 'text-red-500' : 'text-green-600'}>
                          {predictions.overall_forecast.slope >= 0 ? '▲' : '▼'} {Math.abs(predictions.overall_forecast.slope)}/month
                        </span></p>
                        <p>Model fit (R²): <span className="font-semibold">{predictions.overall_forecast.r2}</span>
                          {predictions.overall_forecast.r2 >= 0.7
                            ? <span className="text-green-600 ml-1">(reliable)</span>
                            : <span className="text-yellow-600 ml-1">(more data needed)</span>}
                        </p>
                      </div>
                    </div>
                    <div className="h-3 bg-white/60 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min((predictions.overall_forecast.predicted / 100) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Per-Service Predictions */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <FaClipboardList className="text-blue-500" />
                      Forecast by Service Type
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {predictions.service_predictions.map((svc) => (
                        <div key={svc.service_name}
                          className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition">
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-medium text-gray-800 text-sm">{svc.service_name}</p>
                            <span className="text-lg font-bold text-blue-600">~{svc.predicted}</span>
                          </div>
                          {/* Sparkline */}
                          <div className="flex items-end gap-1 h-8 mb-2">
                            {svc.historical.map((v, i) => {
                              const max = Math.max(...svc.historical, svc.predicted, 1);
                              return (
                                <div key={i}
                                  className="flex-1 bg-blue-200 rounded-sm"
                                  style={{ height: `${(v / max) * 100}%` }}
                                  title={`Month ${i + 1}: ${v}`}
                                />
                              );
                            })}
                            {/* Prediction bar in orange */}
                            <div
                              className="flex-1 bg-orange-400 rounded-sm opacity-80"
                              style={{ height: `${(svc.predicted / Math.max(...svc.historical, svc.predicted, 1)) * 100}%` }}
                              title={`Predicted: ${svc.predicted}`}
                            />
                          </div>
                          <p className="text-xs text-gray-400">
                            Trend {svc.slope >= 0 ? '▲' : '▼'} {Math.abs(svc.slope)}/mo · R² {svc.r2}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* This Month Status Breakdown */}
                  <div className="p-5 bg-gray-50 rounded-xl mb-6">
                    <h3 className="font-semibold text-gray-700 mb-3">This Month: Status Breakdown</h3>
                    <div className="flex flex-wrap gap-3">
                      {predictions.status_breakdown.map((s) => (
                        <div key={s.status}
                          className={`px-4 py-2 rounded-xl text-sm font-medium ${
                            s.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            s.status === 'approved' ? 'bg-green-100 text-green-700' :
                            s.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                          {s.status}: <strong>{s.count}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Smart Recommendations */}
                  <div className="p-5 bg-gradient-to-br from-teal-50 to-cyan-100 rounded-xl">
                    <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-3">
                      <MdVerified className="text-teal-600" /> Smart Recommendations
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      {predictions.overall_forecast.slope > 2 && (
                        <li className="flex gap-2">
                          <FaCheckCircle className="text-teal-500 mt-0.5 shrink-0" />
                          Demand is rising (+{predictions.overall_forecast.slope}/month). Consider increasing staff capacity.
                        </li>
                      )}
                      {predictions.status_breakdown.find(s => s.status === 'pending')?.count > 10 && (
                        <li className="flex gap-2">
                          <FaCheckCircle className="text-teal-500 mt-0.5 shrink-0" />
                          High pending count this month. Prioritize processing backlog before month end.
                        </li>
                      )}
                      {predictions.avg_resolution_days > 5 && (
                        <li className="flex gap-2">
                          <FaCheckCircle className="text-teal-500 mt-0.5 shrink-0" />
                          Average resolution is {predictions.avg_resolution_days} days. Review process bottlenecks.
                        </li>
                      )}
                      {predictions.overall_forecast.r2 < 0.5 && (
                        <li className="flex gap-2">
                          <FaCheckCircle className="text-teal-500 mt-0.5 shrink-0" />
                          Model confidence is low (R²={predictions.overall_forecast.r2}). Predictions will improve as more monthly data accumulates.
                        </li>
                      )}
                      {predictions.service_predictions.length > 0 && (
                        <li className="flex gap-2">
                          <FaCheckCircle className="text-teal-500 mt-0.5 shrink-0" />
                          Top predicted service next month: <strong className="ml-1">{predictions.service_predictions[0]?.service_name}</strong> (~{predictions.service_predictions[0]?.predicted} requests). Pre-allocate resources accordingly.
                        </li>
                      )}
                      <li className="flex gap-2">
                        <FaCheckCircle className="text-teal-500 mt-0.5 shrink-0" />
                        Review pending requests regularly to maintain service quality.
                      </li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>

      {showModal && <KebeleModal />}
    </Layout>
  );
}

export default withAuth(ManageKebele, ['System Administrator']);
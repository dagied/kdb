'use client';

import { withAuth } from '@/components/withAuth';
import Layout from '@/components/Layout';
import { useState, useEffect } from 'react';
import { 
  FaChartLine, FaCalendarWeek, FaCalendarAlt, FaChartBar,
  FaSpinner, FaUsers, FaIdCard, FaGavel, FaFileAlt,
  FaCheckCircle, FaClock, FaExclamationTriangle, FaBrain,
  FaArrowUp, FaArrowDown, FaMinus, FaBullhorn
} from 'react-icons/fa';
import { MdPending, MdVerified } from 'react-icons/md';

function ServiceAnalytics() {
  const [predictions, setPredictions] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('predictions');
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ category: 'all', status: 'all' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [predictionsRes, requestsRes] = await Promise.all([
        fetch('/api/service-requests/predictions'),
        fetch('/api/service-requests')
      ]);
      
      const predictionsData = await predictionsRes.json();
      const requestsData = await requestsRes.json();
      
      if (predictionsData.success) setPredictions(predictionsData);
      if (requestsData.success) setRequests(requestsData.requests);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend) => {
    if (trend === 'increasing') return <FaArrowUp className="text-red-500" />;
    if (trend === 'decreasing') return <FaArrowDown className="text-green-500" />;
    return <FaMinus className="text-gray-500" />;
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Civil Registration': 'bg-blue-100 text-blue-700',
      'ID Services': 'bg-purple-100 text-purple-700',
      'Social Services': 'bg-green-100 text-green-700',
      'Administrative Services': 'bg-orange-100 text-orange-700',
      'Court Services': 'bg-red-100 text-red-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': 
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">Pending</span>;
      case 'completed': 
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Completed</span>;
      case 'in_progress': 
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">In Progress</span>;
      default: 
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">{status}</span>;
    }
  };

  if (loading) {
    return (
      <Layout role="Kebele Manager">
        <div className="flex items-center justify-center h-96">
          <FaSpinner className="animate-spin text-4xl text-blue-600" />
        </div>
      </Layout>
    );
  }

  const filteredRequests = requests.filter(req => {
    if (filter.category !== 'all' && req.category !== filter.category) return false;
    if (filter.status !== 'all' && req.status !== filter.status) return false;
    return true;
  });

  return (
    <Layout role="Kebele Manager">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FaChartLine className="text-blue-600" /> Service Analytics & AI Predictions
            </h1>
            <p className="text-gray-500 text-sm mt-1">AI-powered workload predictions and service request analytics</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('predictions')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                activeTab === 'predictions' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <FaBrain /> AI Predictions
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                activeTab === 'requests' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <FaBullhorn /> Service Requests
            </button>
          </div>
        </div>

        {activeTab === 'predictions' && predictions && (
          <>
            {/* Confidence Level */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  predictions.confidence_level === 'High' ? 'bg-green-500' : 
                  predictions.confidence_level === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-600">Prediction Confidence: </span>
                <span className="font-semibold">{predictions.confidence_level}</span>
              </div>
              <div className="text-sm text-gray-500">
                Based on {predictions.total_predicted_next_week} predicted requests next week
              </div>
            </div>

            {/* Predictions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(predictions.predictions).map(([category, data]) => (
                <div key={category} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(category)}`}>
                        {category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(data.trend)}
                      <span className="text-xs text-gray-500">
                        {data.trend === 'increasing' ? `+${data.trend_percentage}%` : 
                         data.trend === 'decreasing' ? `-${data.trend_percentage}%` : 'Stable'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Current Weekly Avg</p>
                      <p className="text-2xl font-bold text-gray-800">{data.current_weekly_avg}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Next Week</p>
                      <p className="text-2xl font-bold text-blue-600">{data.predicted_next_week}</p>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((data.predicted_next_week / 50) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Next month: {data.predicted_next_month} requests</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Peak Hours & Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaClock className="text-orange-600" /> Peak Hours Analysis
                </h2>
                <div className="space-y-3">
                  {predictions.peak_hours?.map((hour, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="font-medium">{Math.floor(hour.hour)}:00 - {Math.floor(hour.hour) + 1}:00</span>
                      <span className="text-sm text-gray-600">{hour.request_count} requests (30-day avg)</span>
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-orange-500 rounded-full"
                          style={{ width: `${(hour.request_count / 50) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-4">💡 Schedule more staff during peak hours for better service</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaBrain className="text-purple-600" /> AI Recommendations
                </h2>
                <div className="space-y-3">
                  {predictions.recommendations?.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-purple-600 mt-0.5">•</span>
                      <span className="text-gray-700">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'requests' && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <select
                  value={filter.category}
                  onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="Civil Registration">Civil Registration</option>
                  <option value="ID Services">ID Services</option>
                  <option value="Social Services">Social Services</option>
                  <option value="Administrative Services">Administrative Services</option>
                  <option value="Court Services">Court Services</option>
                </select>
                <select
                  value={filter.status}
                  onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Requests Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Request ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Resident</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Service</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredRequests.map((req) => (
                      <tr key={req.request_id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm font-mono text-gray-600">{req.request_id}</td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{req.resident_name}</p>
                            <p className="text-xs text-gray-500">ID: {req.resident_id}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{req.service_name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getCategoryColor(req.category)}`}>
                            {req.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(req.request_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(req.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredRequests.length === 0 && (
                <div className="text-center py-12">
                  <FaBullhorn className="text-6xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No service requests found</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

export default withAuth(ServiceAnalytics, ['System Administrator']);
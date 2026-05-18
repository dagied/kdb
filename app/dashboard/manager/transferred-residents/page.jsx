'use client';

import { withAuth } from '@/components/withAuth';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useTranslation } from '@/hooks/useTranslation';
import { 
  FaSearch, FaExchangeAlt, FaFileAlt, FaPrint, 
  FaEye, FaSpinner, FaTimesCircle, FaUser, 
  FaHome, FaCalendarAlt, FaMapMarkerAlt, FaUsers,
  FaFilePdf, FaDownload, FaFilter, FaChevronLeft,
  FaChevronRight, FaInfoCircle
} from 'react-icons/fa';
import { MdPending, MdVerified } from 'react-icons/md';

function TransferredResidentsPage() {
  const { t, locale } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [transfers, setTransfers] = useState([]);
  const [filteredTransfers, setFilteredTransfers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/transfer');
      const data = await response.json();
      if (data.success) {
        setTransfers(data.transfers);
        setFilteredTransfers(data.transfers);
      }
    } catch (error) {
      console.error('Error fetching transfers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    let filtered = [...transfers];
    
    // Search by term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(transfer => 
        transfer.resident_name?.toLowerCase().includes(term) ||
        transfer.resident_name_am?.toLowerCase().includes(term) ||
        transfer.transfer_number?.toLowerCase().includes(term) ||
        transfer.certificate_number?.toLowerCase().includes(term) ||
        transfer.destination_kebele?.toLowerCase().includes(term)
      );
    }
    
    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(transfer => transfer.transfer_type === filterType);
    }
    
    setFilteredTransfers(filtered);
    setCurrentPage(1);
  };

  useEffect(() => {
    handleSearch();
  }, [searchTerm, filterType]);

  const handleViewDetails = async (transfer) => {
    setSelectedTransfer(transfer);
    setShowDetailsModal(true);
  };

  const handlePrintCertificate = (certificateNumber) => {
    if (certificateNumber) {
      window.open(`/api/certificates/print/${certificateNumber}?type=transfer`, '_blank');
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString(locale === 'am' ? 'am-ET' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTransferTypeLabel = (type) => {
    if (type === 'FULL') {
      return locale === 'am' ? 'ሙሉ ማስተላለፊያ' : 'Full Transfer';
    }
    return locale === 'am' ? 'ከፊል ማስተላለፊያ' : 'Partial Transfer';
  };

  const getTransferTypeColor = (type) => {
    return type === 'FULL' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTransfers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransfers.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <Layout role="Kebele Manager">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaExchangeAlt className="text-blue-600" /> 
            {locale === 'am' ? 'የተላለፉ ነዋሪዎች' : 'Transferred Residents'}
          </h1>
          <p className="text-gray-500 mt-1">
            {locale === 'am' 
              ? 'የተላለፉ ነዋሪዎችን ዝርዝር ይመልከቱ እና ያስተዳድሩ' 
              : 'View and manage transferred residents'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-800">{transfers.length}</p>
                <p className="text-xs text-gray-500">
                  {locale === 'am' ? 'ጠቅላላ የተላለፉ' : 'Total Transferred'}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FaExchangeAlt className="text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {transfers.filter(t => t.transfer_type === 'FULL').length}
                </p>
                <p className="text-xs text-gray-500">
                  {locale === 'am' ? 'ሙሉ ማስተላለፊያ' : 'Full Transfer'}
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
                <p className="text-2xl font-bold text-green-600">
                  {transfers.filter(t => t.transfer_type === 'PARTIAL').length}
                </p>
                <p className="text-xs text-gray-500">
                  {locale === 'am' ? 'ከፊል ማስተላለፊያ' : 'Partial Transfer'}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <FaUsers className="text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {new Set(transfers.map(t => t.destination_kebele)).size}
                </p>
                <p className="text-xs text-gray-500">
                  {locale === 'am' ? 'መድረሻ ቀበሌዎች' : 'Destination Kebeles'}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <FaMapMarkerAlt className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section - Date filters removed */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={locale === 'am' 
                  ? 'በስም፣ ትራንስፈር ቁጥር፣ ሰርትፊኬት ቁጥር ይፈልጉ...' 
                  : 'Search by name, TRF number, certificate number...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{locale === 'am' ? 'ሁሉም አይነት' : 'All Types'}</option>
              <option value="FULL">{locale === 'am' ? 'ሙሉ ማስተላለፊያ' : 'Full Transfer'}</option>
              <option value="PARTIAL">{locale === 'am' ? 'ከፊል ማስተላለፊያ' : 'Partial Transfer'}</option>
            </select>
            
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg"
            >
              {locale === 'am' ? 'አጽዳ' : 'Clear'}
            </button>
          </div>
        </div>

        {/* Transfers Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <FaSpinner className="animate-spin text-4xl text-blue-600" />
            </div>
          ) : filteredTransfers.length === 0 ? (
            <div className="text-center py-12">
              <FaExchangeAlt className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600">
                {locale === 'am' ? 'ምንም የተላለፉ ነዋሪዎች አልተገኙም' : 'No transferred residents found'}
              </h3>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      {locale === 'am' ? 'የነዋሪ ስም' : 'Resident Name'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      {locale === 'am' ? 'ትራንስፈር ቁጥር' : 'TRF Number'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      {locale === 'am' ? 'ሰርትፊኬት ቁጥር' : 'Certificate No'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      {locale === 'am' ? 'አይነት' : 'Type'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      {locale === 'am' ? 'መድረሻ ቀበሌ' : 'Destination'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      {locale === 'am' ? 'ቀን' : 'Date'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      {locale === 'am' ? 'ድርጊቶች' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentItems.map((transfer) => (
                    <tr key={transfer.transfer_id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-800">{transfer.resident_name || '—'}</p>
                          {transfer.resident_name_am && (
                            <p className="text-xs text-gray-500 font-ethiopic">{transfer.resident_name_am}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-gray-600">{transfer.transfer_number}</td>
                      <td className="px-6 py-4 font-mono text-sm text-blue-600">{transfer.certificate_number || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getTransferTypeColor(transfer.transfer_type)}`}>
                          {getTransferTypeLabel(transfer.transfer_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{transfer.destination_kebele}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(transfer.transfer_date)}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewDetails(transfer)}
                            className="text-blue-600 hover:text-blue-700 p-1 transition"
                            title={locale === 'am' ? 'ዝርዝሮችን ይመልከቱ' : 'View Details'}
                          >
                            <FaEye size={18} />
                          </button>
                          {transfer.certificate_number && (
                            <button
                              onClick={() => handlePrintCertificate(transfer.certificate_number)}
                              className="text-green-600 hover:text-green-700 p-1 transition"
                              title={locale === 'am' ? 'ማስረጃ አትም' : 'Print Certificate'}
                            >
                              <FaPrint size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {filteredTransfers.length > 0 && (
            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                {locale === 'am' 
                  ? `${indexOfFirstItem + 1} - ${Math.min(indexOfLastItem, filteredTransfers.length)} ከ ${filteredTransfers.length}`
                  : `Showing ${indexOfFirstItem + 1} to ${Math.min(indexOfLastItem, filteredTransfers.length)} of ${filteredTransfers.length}`}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  <FaChevronLeft />
                </button>
                <span className="px-3 py-1 text-gray-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  <FaChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FaInfoCircle className="text-blue-600" />
                {locale === 'am' ? 'የማስተላለፊያ ዝርዝሮች' : 'Transfer Details'}
              </h2>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimesCircle size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Transfer Header */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <p className="text-xs text-gray-500">{locale === 'am' ? 'የማስተላለፊያ ቁጥር' : 'Transfer Number'}</p>
                    <p className="text-lg font-bold text-blue-600 font-mono">{selectedTransfer.transfer_number}</p>
                  </div>
                  <div>
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getTransferTypeColor(selectedTransfer.transfer_type)}`}>
                      {getTransferTypeLabel(selectedTransfer.transfer_type)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Resident Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase font-semibold">
                    {locale === 'am' ? 'የነዋሪ መረጃ' : 'Resident Information'}
                  </p>
                  <p className="text-lg font-medium text-gray-800 mt-1">{selectedTransfer.resident_name || '—'}</p>
                  {selectedTransfer.resident_name_am && (
                    <p className="text-sm text-gray-600 font-ethiopic">{selectedTransfer.resident_name_am}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    {locale === 'am' ? 'የማስተላለፊያ ቀን' : 'Transfer Date'}: {formatDate(selectedTransfer.transfer_date)}
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase font-semibold">
                    {locale === 'am' ? 'መድረሻ መረጃ' : 'Destination Information'}
                  </p>
                  <p className="text-lg font-medium text-gray-800 mt-1">{selectedTransfer.destination_kebele || '—'}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {locale === 'am' ? 'ክልል' : 'Region'}: {selectedTransfer.destination_region || '—'}
                  </p>
                </div>
              </div>
              
              {/* Clearance Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                  {locale === 'am' ? 'የፍቃድ መረጃ' : 'Clearance Information'}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${selectedTransfer.tax_cleared ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm">{locale === 'am' ? 'ግብር' : 'Tax'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${selectedTransfer.utility_bills_cleared ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm">{locale === 'am' ? 'የፍጆታ ክፍያ' : 'Utility Bills'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${selectedTransfer.obligations_cleared ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm">{locale === 'am' ? 'ሌሎች ግዴታዎች' : 'Other Obligations'}</span>
                  </div>
                </div>
              </div>
              
              {/* Transfer Reason */}
              {selectedTransfer.reason && (
                <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500">
                  <p className="text-xs text-yellow-600 uppercase font-semibold">
                    {locale === 'am' ? 'የማስተላለፊያ ምክንያት' : 'Transfer Reason'}
                  </p>
                  <p className="text-gray-700 mt-1">{selectedTransfer.reason}</p>
                </div>
              )}
              
              {/* Family Members (for partial transfer) */}
              {selectedTransfer.family_members && selectedTransfer.family_members.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                    {locale === 'am' ? 'የተላለፉ የቤተሰብ አባላት' : 'Transferred Family Members'}
                  </p>
                  <div className="space-y-2">
                    {selectedTransfer.family_members.map((member, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-white rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">{member.name}</p>
                          {member.name_am && <p className="text-xs text-gray-500 font-ethiopic">{member.name_am}</p>}
                        </div>
                        <span className="text-sm text-gray-500">{member.relationship}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {selectedTransfer.certificate_number && (
                  <button
                    onClick={() => handlePrintCertificate(selectedTransfer.certificate_number)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <FaPrint /> {locale === 'am' ? 'ማስረጃ አትም' : 'Print Certificate'}
                  </button>
                )}
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg"
                >
                  {locale === 'am' ? 'ዝጋ' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default withAuth(TransferredResidentsPage, ['Kebele Manager']);
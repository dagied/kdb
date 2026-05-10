'use client';

import { useState } from 'react';
import { FaSearch, FaSpinner, FaUser, FaHome, FaUsers, FaCheckCircle, FaTimes } from 'react-icons/fa';

export default function ResidentSearch({ onSelect, selectedResident, onClear }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('name');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [error, setError] = useState(null);

  const performSearch = async () => {
    if (!searchTerm.trim()) {
      setResults([]);
      setSearchPerformed(false);
      return;
    }
    
    setLoading(true);
    setSearchPerformed(true);
    setError(null);
    
    try {
      console.log(`Searching for: ${searchTerm} with type: ${searchType}`);
      const response = await fetch(`/api/residents/search?q=${encodeURIComponent(searchTerm)}&type=${searchType}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Search results:', data);
      
      if (data.success) {
        setResults(data.residents || []);
        if (data.residents?.length === 0) {
          setError('No residents found. Please try a different search term.');
        }
      } else {
        setError(data.error || 'Search failed');
        setResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setError(`Search error: ${error.message}`);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FaSearch className="text-blue-600" />
          Search Resident
        </h3>
        
        <div className="flex flex-col gap-4">
          <div className="flex gap-3">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="name">By Name</option>
              <option value="house">By House Number</option>
              <option value="household">By Household Code (HH-0001)</option>
            </select>
            
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  searchType === 'name' 
                    ? 'Enter name (e.g., Abebe, Kebede)...'
                    : searchType === 'house'
                    ? 'Enter house number (e.g., 1, 2, H-0001)'
                    : 'Enter household code (e.g., HH-0005)'
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button
              onClick={performSearch}
              disabled={loading || !searchTerm.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <FaSpinner className="animate-spin" /> : <FaSearch />}
              Search
            </button>
          </div>
          
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <FaUsers className="text-gray-400" />
            Tip: Search by name, house number (1, 2, 3, etc.), or household code
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-center gap-2">
          <FaTimes className="text-red-500" />
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8">
          <FaSpinner className="animate-spin text-3xl text-blue-600" />
        </div>
      )}

      {/* Search Results */}
      {searchPerformed && !loading && results.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-700">
              {results.length} resident(s) found
            </p>
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {results.map((resident) => (
              <div
                key={resident.resident_id}
                onClick={() => onSelect(resident)}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-all ${
                  selectedResident?.resident_id === resident.resident_id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <FaUser className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {resident.fname} {resident.lname}
                        </p>
                        <p className="text-xs text-gray-500">
                          Father: {resident.lname}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mt-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <FaHome className="text-gray-400 text-xs" />
                        <span>House: {resident.house_id || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <FaUsers className="text-gray-400 text-xs" />
                        <span>Household: {resident.household_code || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <FaCheckCircle className="text-gray-400 text-xs" />
                        <span>Role: {resident.household_role || 'Member'}</span>
                      </div>
                    </div>
                    
                    {resident.household_members_count > 1 && (
                      <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                        <FaUsers className="text-xs" />
                        {resident.household_members_count} members in this household
                      </p>
                    )}
                  </div>
                  
                  {selectedResident?.resident_id === resident.resident_id && (
                    <FaCheckCircle className="text-green-500 text-xl" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results Message */}
      {searchPerformed && !loading && results.length === 0 && !error && (
        <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-100">
          <FaUser className="text-gray-300 text-5xl mx-auto mb-3" />
          <p className="text-gray-500">No residents found</p>
          <p className="text-sm text-gray-400 mt-1">
            Try searching by name, house number (1, 2, 3), or household code (HH-0001)
          </p>
        </div>
      )}

      {/* Selected Resident Display */}
      {selectedResident && onClear && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaCheckCircle className="text-green-600 text-xl" />
            <div>
              <p className="font-semibold text-green-800">Selected Resident</p>
              <p className="text-sm text-green-700">
                {selectedResident.fname} {selectedResident.lname} - House: {selectedResident.house_id}
              </p>
            </div>
          </div>
          <button
            onClick={onClear}
            className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
          >
            <FaTimes /> Change
          </button>
        </div>
      )}
    </div>
  );
}
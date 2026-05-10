'use client';

import { withAuth } from '@/components/withAuth';
import { useState } from 'react';
import Layout from '@/components/Layout';
import { useTranslation } from '@/hooks/useTranslation';
import { 
  FaIdCard, FaSyncAlt, FaSearch, FaSpinner, 
  FaCheckCircle, FaTimesCircle, FaPrint,
  FaUser, FaCalendarAlt, FaMapMarkerAlt, FaInfoCircle
} from 'react-icons/fa';
import { gregorianToEthiopian } from '@/utils/calendar';

function RenewIDPage() {
  const { t, locale } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [error, setError] = useState(null);
  const [renewed, setRenewed] = useState(false);
  const [renewalData, setRenewalData] = useState(null);
  const [renewalError, setRenewalError] = useState(null);

  const searchIDCard = async () => {
    if (!searchTerm) return;
    
    setLoading(true);
    setError(null);
    setSearchResult(null);
    setRenewalError(null);
    
    try {
      const response = await fetch(`/api/id-card/search?id_number=${searchTerm}`);
      const data = await response.json();
      
      if (data.success && data.card) {
        // Check if ID is expired or about to expire
        const expiryDate = new Date(data.card.expiry_date_gc);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        // Check if renewal is allowed
        let canRenew = false;
        let renewalMessage = '';
        
        if (daysUntilExpiry < 0) {
          canRenew = true;
          renewalMessage = locale === 'am' ? 'መታወቂያው ያለፈበት ነው። እድሳት ያስፈልጋል።' : 'ID card has expired. Renewal is required.';
        } else if (daysUntilExpiry <= 90) {
          canRenew = true;
          renewalMessage = locale === 'am' ? 
            `መታወቂያው ከ${daysUntilExpiry} ቀናት ውስጥ ያበቃል። እድሳት ማድረግ ይችላሉ።` : 
            `ID card will expire in ${daysUntilExpiry} days. You can renew now.`;
        } else {
          canRenew = false;
          renewalMessage = locale === 'am' ? 
            `መታወቂያው ንቁ ነው እና ከ${daysUntilExpiry} ቀናት ውስጥ ያበቃል። እድሳት ማድረግ የሚችሉት ከሚያበቃው ቀን በፊት ባሉት 90 ቀናት ውስጥ ብቻ ነው።` :
            `ID card is active and will expire in ${daysUntilExpiry} days. You can only renew within 90 days of expiry.`;
        }
        
        setSearchResult({
          ...data.card,
          daysUntilExpiry,
          isExpired: daysUntilExpiry < 0,
          isNearExpiry: daysUntilExpiry <= 90 && daysUntilExpiry >= 0,
          canRenew,
          renewalMessage
        });
      } else {
        setError(data.error || 'ID card not found');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async () => {
    if (!searchResult) return;
    
    // Check again if renewal is allowed before proceeding
    if (!searchResult.canRenew) {
      setRenewalError(searchResult.renewalMessage);
      return;
    }
    
    setLoading(true);
    setError(null);
    setRenewalError(null);
    
    try {
      const response = await fetch('/api/id-card/renew', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_number: searchResult.id_number,
          resident_id: searchResult.resident_id
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setRenewed(true);
        setRenewalData(data);
      } else {
        setError(data.error || 'Failed to renew ID card');
      }
    } catch (error) {
      console.error('Renewal error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.open(`/api/certificates/print/${searchResult?.id_card_id}?type=id-card`, '_blank');
  };

  const handleNewSearch = () => {
    setSearchTerm('');
    setSearchResult(null);
    setRenewed(false);
    setRenewalData(null);
    setError(null);
    setRenewalError(null);
  };

  return (
    <Layout role="Record Officer">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaSyncAlt className="text-blue-600" /> 
            {locale === 'am' ? 'መታወቂያ እድሳት' : 'Renew ID Card'}
          </h1>
          <p className="text-gray-500 mt-1">
            {locale === 'am' ? 'ያለቀበት ወይም ሊያልቅ የተቃረበ መታወቂያ ያድሱ' : 'Renew an expired or expiring ID card'}
          </p>
          <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800 flex items-start gap-2">
              <FaInfoCircle className="mt-0.5 flex-shrink-0" />
              <span>
                {locale === 'am' ? 
                  'ማስታወሻ: መታወቂያ መታደስ የሚችለው ከሚያበቃበት ቀን በፊት ባሉት 90 ቀናት ውስጥ ብቻ ነው። እንዲሁም ያለፈበት መታወቂያ ማደስ ይቻላል።' : 
                  'Note: ID cards can only be renewed within 90 days before expiry or after expiry.'}
              </span>
            </p>
          </div>
        </div>

        {!renewed ? (
          <>
            {/* Search Section */}
            {!searchResult && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaSearch className="text-blue-600" />
                  {locale === 'am' ? 'መታወቂያ ይፈልጉ' : 'Search ID Card'}
                </h2>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={locale === 'am' ? 'የመታወቂያ ቁጥር ያስገቡ' : 'Enter ID card number'}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && searchIDCard()}
                  />
                  <button
                    onClick={searchIDCard}
                    disabled={loading || !searchTerm}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? <FaSpinner className="animate-spin" /> : <FaSearch />}
                    {locale === 'am' ? 'ፈልግ' : 'Search'}
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3 text-red-700">
                <FaTimesCircle />
                <span>{error}</span>
              </div>
            )}

            {/* Renewal Error Message */}
            {renewalError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-center gap-3 text-yellow-800">
                <FaInfoCircle />
                <span>{renewalError}</span>
              </div>
            )}

            {/* ID Card Details */}
            {searchResult && (
              <div className="space-y-6">
                <div className={`rounded-2xl border p-6 ${
                  searchResult.isExpired ? 'bg-red-50 border-red-200' : 
                  searchResult.isNearExpiry ? 'bg-yellow-50 border-yellow-200' : 
                  'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                      <FaIdCard className="text-blue-600" />
                      {locale === 'am' ? 'የመታወቂያ መረጃ' : 'ID Card Information'}
                    </h2>
                    {searchResult.isExpired ? (
                      <span className="px-3 py-1 bg-red-200 text-red-800 rounded-full text-sm font-medium">
                        {locale === 'am' ? 'ያለፈበት' : 'Expired'}
                      </span>
                    ) : searchResult.isNearExpiry ? (
                      <span className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm font-medium">
                        {locale === 'am' ? 'ሊያልቅ ተቃርቧል' : 'Near Expiry'}
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-medium">
                        {locale === 'am' ? 'ንቁ' : 'Active'}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">{locale === 'am' ? 'ሙሉ ስም' : 'Full Name'}</p>
                      <p className="font-medium">{searchResult.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{locale === 'am' ? 'የአባት ስም' : "Father's Name"}</p>
                      <p className="font-medium">{searchResult.father_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{locale === 'am' ? 'የመታወቂያ ቁጥር' : 'ID Number'}</p>
                      <p className="font-mono">{searchResult.id_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{locale === 'am' ? 'የሚያበቃበት ቀን' : 'Expiry Date'}</p>
                      <p className="font-medium">
                        {searchResult.expiry_date_ec} ዓ.ም / {searchResult.expiry_date_gc}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className={`text-sm ${searchResult.canRenew ? 'text-blue-600' : 'text-orange-600'}`}>
                      {searchResult.canRenew ? (
                        <span className="flex items-start gap-2">
                          <FaCheckCircle className="mt-0.5 flex-shrink-0" />
                          {searchResult.renewalMessage}
                        </span>
                      ) : (
                        <span className="flex items-start gap-2">
                          <FaInfoCircle className="mt-0.5 flex-shrink-0" />
                          {searchResult.renewalMessage}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Renew Button - Only enable if renewal is allowed */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleNewSearch}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    {locale === 'am' ? 'ተመለስ' : 'Back'}
                  </button>
                  {searchResult.canRenew ? (
                    <button
                      onClick={handleRenew}
                      disabled={loading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? <FaSpinner className="animate-spin" /> : <FaSyncAlt />}
                      {locale === 'am' ? 'እድሳት' : 'Renew ID'}
                    </button>
                  ) : (
                    <button
                      disabled
                      className="px-6 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed flex items-center gap-2"
                      title={searchResult.renewalMessage}
                    >
                      <FaSyncAlt />
                      {locale === 'am' ? 'እድሳት አይቻልም' : 'Cannot Renew'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Success State */
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <FaCheckCircle className="text-green-600 text-5xl mx-auto mb-4" />
              <h2 className="text-xl font-bold text-green-800 mb-2">
                {locale === 'am' ? 'መታወቂያ በተሳካ ሁኔታ ታድሷል' : 'ID Card Renewed Successfully'}
              </h2>
              <p className="text-green-700 mb-4">
                {locale === 'am' ? 'አዲሱ የሚያበቃበት ቀን ከታች ቀርቧል' : 'The new expiry date is shown below'}
              </p>
              <div className="bg-white rounded-lg p-4 inline-block mx-auto">
                <p className="text-sm text-gray-500">{locale === 'am' ? 'አዲስ የሚያበቃበት ቀን' : 'New Expiry Date'}</p>
                <p className="text-lg font-bold text-blue-600">
                  {renewalData?.new_expiry_date_ec} ዓ.ም / {renewalData?.new_expiry_date}
                </p>
              </div>
              <div className="flex gap-3 justify-center mt-6">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <FaPrint /> {locale === 'am' ? 'ማተም' : 'Print'}
                </button>
                <button
                  onClick={handleNewSearch}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {locale === 'am' ? 'ሌላ እድሳት' : 'Renew Another'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default withAuth(RenewIDPage, ['Record Officer']);
'use client';

import { withAuth } from '@/components/withAuth';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useTranslation } from '@/hooks/useTranslation';
import ResidentSearch from '@/components/ResidentSearch';
import { 
  FaSkull, FaUser, FaCalendarAlt, FaMapMarkerAlt,
  FaFileAlt, FaSave, FaSpinner, FaPrint,
  FaCheckCircle, FaTimesCircle, FaSearch,
  FaHeartbeat, FaUserFriends, FaEnvelope, FaBookOpen
} from 'react-icons/fa';
import { gregorianToEthiopian, ethiopianToGregorian, getCurrentEthiopianDate } from '@/utils/calendar';

function DeathCertificatePage() {
  const { t, locale } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedId, setGeneratedId] = useState(null);
  const [error, setError] = useState(null);
  const [deathCalendar, setDeathCalendar] = useState('gc');
  const [burialCalendar, setBurialCalendar] = useState('gc');
  const [searchResident, setSearchResident] = useState(false);
  
  const [formData, setFormData] = useState({
    resident_id: '',
    registration_number: '',
    deceased_name: '',
    deceased_name_am: '',
    deceased_father_name: '',
    deceased_father_name_am: '',
    death_date_gc: '',
    death_date_ec: '',
    place_of_death: '',
    place_of_death_am: '',
    cause_of_death: '',
    cause_of_death_am: '',
    reporter_name: '',
    reporter_name_am: '',
    reporter_relation: '',
    reporter_relation_am: '',
    reporter_phone: '',
    reporter_address: '',
    reporter_address_am: '',
    registrar_name: '',
    registrar_name_am: '',
    burial_place: '',
    burial_place_am: '',
    burial_date_gc: '',
    burial_date_ec: ''
  });

  const handleSelectResident = (resident) => {
    setSelectedResident(resident);
    setFormData(prev => ({
      ...prev,
      resident_id: resident.resident_id,
      deceased_name: `${resident.fname} ${resident.lname}`,
      deceased_name_am: resident.fname_am && resident.lname_am ? `${resident.fname_am} ${resident.lname_am}` : '',
      deceased_father_name: resident.father_name || resident.lname || '',
      deceased_father_name_am: resident.father_name_am || resident.lname_am || '',
      place_of_death: resident.place_of_birth || '',
    }));
    setSearchResident(false);
  };

  const handleClearResident = () => {
    setSelectedResident(null);
    setFormData({
      resident_id: '',
      registration_number: '',
      deceased_name: '',
      deceased_name_am: '',
      deceased_father_name: '',
      deceased_father_name_am: '',
      death_date_gc: '',
      death_date_ec: '',
      place_of_death: '',
      place_of_death_am: '',
      cause_of_death: '',
      cause_of_death_am: '',
      reporter_name: '',
      reporter_name_am: '',
      reporter_relation: '',
      reporter_relation_am: '',
      reporter_phone: '',
      reporter_address: '',
      reporter_address_am: '',
      registrar_name: '',
      registrar_name_am: '',
      burial_place: '',
      burial_place_am: '',
      burial_date_gc: '',
      burial_date_ec: ''
    });
  };

  const handleDeathDateChange = (value, calendar) => {
    if (calendar === 'gc') {
      if (value) {
        try {
          const ecDate = gregorianToEthiopian(value);
          setFormData(prev => ({
            ...prev,
            death_date_gc: value,
            death_date_ec: ecDate?.formattedEc || ''
          }));
        } catch (error) {
          console.error('Error converting GC to EC date:', error);
          setFormData(prev => ({
            ...prev,
            death_date_gc: value,
            death_date_ec: ''
          }));
        }
      } else {
        setFormData(prev => ({
          ...prev,
          death_date_gc: '',
          death_date_ec: ''
        }));
      }
    } else {
      if (value) {
        const gcDate = ethiopianToGregorian(value);
        setFormData(prev => ({
          ...prev,
          death_date_ec: value,
          death_date_gc: gcDate?.formatted || ''
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          death_date_ec: '',
          death_date_gc: ''
        }));
      }
    }
  };

  const handleBurialDateChange = (value, calendar) => {
    if (calendar === 'gc') {
      if (value) {
        try {
          const ecDate = gregorianToEthiopian(value);
          setFormData(prev => ({
            ...prev,
            burial_date_gc: value,
            burial_date_ec: ecDate?.formattedEc || ''
          }));
        } catch (error) {
          console.error('Error converting burial GC to EC date:', error);
          setFormData(prev => ({
            ...prev,
            burial_date_gc: value,
            burial_date_ec: ''
          }));
        }
      } else {
        setFormData(prev => ({
          ...prev,
          burial_date_gc: '',
          burial_date_ec: ''
        }));
      }
    } else {
      if (value) {
        const gcDate = ethiopianToGregorian(value);
        setFormData(prev => ({
          ...prev,
          burial_date_ec: value,
          burial_date_gc: gcDate?.formatted || ''
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          burial_date_ec: '',
          burial_date_gc: ''
        }));
      }
    }
  };

  const generateRegistrationNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000);
    return `DTH-${year}-${String(random).padStart(4, '0')}`;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
  
  const registrationNumber = generateRegistrationNumber();
  
  const submitData = {
    ...formData,
    registration_number: registrationNumber,
    registrar_name: formData.registrar_name || 'Kebele Administration',
    registrar_name_am: formData.registrar_name_am || 'ቀበሌ አስተዳደር',
    // ✅ Explicitly set resident_id from selectedResident if available
    resident_id: selectedResident?.resident_id || formData.resident_id
  };
  
  console.log('Submitting with resident_id:', submitData.resident_id);
  
  try {
    const response = await fetch('/api/certificates/death', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submitData)
    });
    
    const data = await response.json();
    console.log('API Response:', data);
    
    if (data.success) {
      setGeneratedId(data.certificate_id || data.death_id);
      setShowPreview(true);
    } else {
      setError(data.error || 'Failed to issue death certificate');
    }
  } catch (error) {
    console.error('Error:', error);
    setError('Network error. Please try again.');
  } finally {
    setLoading(false);
  }
};

const handlePrint = () => {
  // ✅ FIXED: Use generatedId, not certificateId
  if (generatedId) {
    window.open(`/api/certificates/print/${generatedId}?type=death`, '_blank');
  } else {
    console.error('No certificate ID available for printing');
    alert('Certificate ID not found. Please try again.');
  }
};

  // const handlePrint = () => {
  //   window.open(`/api/certificates/print/${certificateId}?type=death`, '_blank');
  // };

  const handleNew = () => {
    setShowPreview(false);
    setGeneratedId(null);
    setSelectedResident(null);
    handleClearResident();
  };

  const currentEcDate = getCurrentEthiopianDate();

  return (
    <Layout role="Record Officer">
      {/* Add font support for Amharic */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;500;600;700&display=swap');
        
        .font-ethiopic, 
        input[lang="am"], 
        textarea[lang="am"],
        .amharic-text {
          font-family: 'Noto Sans Ethiopic', 'Nyala', 'Abyssinica SIL', 'Ethiopia Jiret', 'Visual Geez Unicode', 'Code2000', sans-serif;
          font-weight: normal;
          font-size: 1rem;
          line-height: 1.5;
        }
        
        * {
          font-feature-settings: "locl";
        }
      `}</style>

      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaSkull className="text-gray-600" /> 
            {locale === 'am' ? 'የሞት ማስረጃ መስጠት' : 'Death Certificate Issuance'}
          </h1>
          <p className="text-gray-500 mt-1">
            {locale === 'am' ? 'ሞት ይመዝግቡ እና ኦፊሴላዊ የሞት ማስረጃ ይስጡ' : 'Register a death and issue an official death certificate'}
          </p>
        </div>


        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <FaTimesCircle /> {error}
          </div>
        )}

        {!showPreview ? (
          <>
            {/* Resident Search Toggle */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setSearchResident(!searchResident)}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
              >
                <FaSearch /> {searchResident ? (locale === 'am' ? 'ድበቅ' : 'Hide Search') : (locale === 'am' ? 'ሟች ነዋሪ ፈልግ' : 'Search for Deceased Resident')}
              </button>
            </div>

            {/* Resident Search */}
            {searchResident && (
              <ResidentSearch
                onSelect={handleSelectResident}
                selectedResident={selectedResident}
                onClear={handleClearResident}
              />
            )}

            {/* Selected Resident Info */}
            {selectedResident && !searchResident && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FaCheckCircle className="text-green-600 text-xl" />
                  <div>
                    <p className="font-semibold text-green-800">
                      {locale === 'am' ? 'የተመረጠ ሟች ነዋሪ' : 'Selected Deceased Resident'}
                    </p>
                    <p className="text-sm text-green-700">
                      {selectedResident.fname} {selectedResident.lname} - {locale === 'am' ? 'ቤት ቁጥር' : 'House'}: {selectedResident.house_id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSearchResident(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  {locale === 'am' ? 'ለውጥ' : 'Change'}
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Deceased Information */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                  <FaUser className="text-gray-600" />
                  {locale === 'am' ? 'የሟች መረጃ' : 'Deceased Information'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'ሙሉ ስም (እንግሊዝኛ)' : 'Full Name (English)'}
                    </label>
                    <input
                      type="text"
                      value={formData.deceased_name}
                      onChange={(e) => setFormData({...formData, deceased_name: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder={locale === 'am' ? 'ሙሉ ስም ያስገቡ' : 'Enter full name'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'ሙሉ ስም (አማርኛ)' : 'Full Name (Amharic)'}
                    </label>
                    <input
                      type="text"
                      lang="am"
                      value={formData.deceased_name_am}
                      onChange={(e) => setFormData({...formData, deceased_name_am: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-ethiopic"
                      placeholder={locale === 'am' ? 'ስም በአማርኛ ይጻፉ' : 'Name in Amharic'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'የአባት ስም' : "Father's Name"}
                    </label>
                    <input
                      type="text"
                      value={formData.deceased_father_name}
                      onChange={(e) => setFormData({...formData, deceased_father_name: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'የአባት ስም (አማርኛ)' : "Father's Name (Amharic)"}
                    </label>
                    <input
                      type="text"
                      lang="am"
                      value={formData.deceased_father_name_am}
                      onChange={(e) => setFormData({...formData, deceased_father_name_am: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-ethiopic"
                      placeholder={locale === 'am' ? 'የአባት ስም በአማርኛ' : "Father's name in Amharic"}
                    />
                  </div>
                </div>
              </div>

              {/* Death Information */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                  <FaCalendarAlt className="text-red-600" />
                  {locale === 'am' ? 'የሞት መረጃ' : 'Death Information'}
                </h2>
                
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setDeathCalendar('gc')}
                    className={`px-3 py-1 rounded-lg text-sm ${deathCalendar === 'gc' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                  >
                    Gregorian Calendar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeathCalendar('ec')}
                    className={`px-3 py-1 rounded-lg text-sm ${deathCalendar === 'ec' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                  >
                    Ethiopian Calendar
                  </button>
                  <span className="text-xs text-gray-400 ml-auto">
                    {locale === 'am' ? 'ዛሬ (ኢትዮጵያ)' : 'Today (EC)'}: {currentEcDate.formattedDisplay.en}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {deathCalendar === 'gc' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {locale === 'am' ? 'የሞት ቀን (ግሪጎሪያን)' : 'Date of Death (GC)'} *
                        </label>
                        <input
                          type="date"
                          value={formData.death_date_gc || ''}
                          onChange={(e) => handleDeathDateChange(e.target.value, 'gc')}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {locale === 'am' ? 'የሞት ቀን (ኢትዮጵያ)' : 'Date of Death (EC)'}
                        </label>
                        <input
                          type="text"
                          value={formData.death_date_ec}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-ethiopic"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {locale === 'am' ? 'የሞት ቀን (ኢትዮጵያ)' : 'Date of Death (EC)'}
                        </label>
                        <input
                          type="text"
                          value={formData.death_date_ec}
                          onChange={(e) => handleDeathDateChange(e.target.value, 'ec')}
                          placeholder="YYYY-MM-DD"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg font-ethiopic"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {locale === 'am' ? 'የሞት ቀን (ግሪጎሪያን)' : 'Date of Death (GC)'}
                        </label>
                        <input
                          type="text"
                          value={formData.death_date_gc}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                    </>
                  )}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'የሞት ቦታ' : 'Place of Death'}
                    </label>
                    <input
                      type="text"
                      value={formData.place_of_death}
                      onChange={(e) => setFormData({...formData, place_of_death: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder={locale === 'am' ? 'ሆስፒታል፣ ቤት፣ ወዘተ' : 'Hospital, Home, etc.'}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'የሞት ቦታ (አማርኛ)' : 'Place of Death (Amharic)'}
                    </label>
                    <input
                      type="text"
                      lang="am"
                      value={formData.place_of_death_am}
                      onChange={(e) => setFormData({...formData, place_of_death_am: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-ethiopic"
                      placeholder={locale === 'am' ? 'ቦታ በአማርኛ' : 'Place in Amharic'}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'የሞት መንስኤ' : 'Cause of Death'}
                    </label>
                    <textarea
                      value={formData.cause_of_death}
                      onChange={(e) => setFormData({...formData, cause_of_death: e.target.value})}
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                      placeholder={locale === 'am' ? 'የሞት መንስኤ' : 'Medical cause of death'}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'የሞት መንስኤ (አማርኛ)' : 'Cause of Death (Amharic)'}
                    </label>
                    <textarea
                      lang="am"
                      value={formData.cause_of_death_am}
                      onChange={(e) => setFormData({...formData, cause_of_death_am: e.target.value})}
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none font-ethiopic"
                      placeholder={locale === 'am' ? 'የሞት መንስኤ በአማርኛ' : 'Cause in Amharic'}
                    />
                  </div>
                </div>
              </div>

              {/* Burial Information */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                  <FaMapMarkerAlt className="text-gray-600" />
                  {locale === 'am' ? 'የቀብር መረጃ' : 'Burial Information'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'የቀብር ቦታ' : 'Burial Place'}
                    </label>
                    <input
                      type="text"
                      value={formData.burial_place}
                      onChange={(e) => setFormData({...formData, burial_place: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder={locale === 'am' ? 'የመቃብር ስም እና ቦታ' : 'Cemetery name and location'}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'የቀብር ቦታ (አማርኛ)' : 'Burial Place (Amharic)'}
                    </label>
                    <input
                      type="text"
                      lang="am"
                      value={formData.burial_place_am}
                      onChange={(e) => setFormData({...formData, burial_place_am: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-ethiopic"
                      placeholder={locale === 'am' ? 'ቦታ በአማርኛ' : 'Place in Amharic'}
                    />
                  </div>
                  
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setBurialCalendar('gc')}
                      className={`px-3 py-1 rounded-lg text-sm ${burialCalendar === 'gc' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                    >
                      Gregorian Calendar
                    </button>
                    <button
                      type="button"
                      onClick={() => setBurialCalendar('ec')}
                      className={`px-3 py-1 rounded-lg text-sm ${burialCalendar === 'ec' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                    >
                      Ethiopian Calendar
                    </button>
                  </div>
                  
                  {burialCalendar === 'gc' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {locale === 'am' ? 'የቀብር ቀን (ግሪጎሪያን)' : 'Burial Date (GC)'}
                        </label>
                        <input
                          type="date"
                          value={formData.burial_date_gc}
                          onChange={(e) => handleBurialDateChange(e.target.value, 'gc')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {locale === 'am' ? 'የቀብር ቀን (ኢትዮጵያ)' : 'Burial Date (EC)'}
                        </label>
                        <input
                          type="text"
                          value={formData.burial_date_ec}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-ethiopic"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {locale === 'am' ? 'የቀብር ቀን (ኢትዮጵያ)' : 'Burial Date (EC)'}
                        </label>
                        <input
                          type="text"
                          value={formData.burial_date_ec}
                          onChange={(e) => handleBurialDateChange(e.target.value, 'ec')}
                          placeholder="YYYY-MM-DD"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg font-ethiopic"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {locale === 'am' ? 'የቀብር ቀን (ግሪጎሪያን)' : 'Burial Date (GC)'}
                        </label>
                        <input
                          type="text"
                          value={formData.burial_date_gc}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Reporter Information */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                  <FaUserFriends className="text-blue-600" />
                  {locale === 'am' ? 'የሪፖርተር መረጃ' : 'Reporter Information'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'ሪፖርተር ስም' : 'Reporter Name'}
                    </label>
                    <input
                      type="text"
                      value={formData.reporter_name}
                      onChange={(e) => setFormData({...formData, reporter_name: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder={locale === 'am' ? 'ሞት ያሳወቀ ሰው' : 'Person reporting the death'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'የሪፖርተር ስም (አማርኛ)' : 'Reporter Name (Amharic)'}
                    </label>
                    <input
                      type="text"
                      lang="am"
                      value={formData.reporter_name_am}
                      onChange={(e) => setFormData({...formData, reporter_name_am: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-ethiopic"
                      placeholder={locale === 'am' ? 'ስም በአማርኛ' : 'Name in Amharic'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'ዝምድና' : 'Relationship'}
                    </label>
                    <input
                      type="text"
                      value={formData.reporter_relation}
                      onChange={(e) => setFormData({...formData, reporter_relation: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder={locale === 'am' ? 'ልጅ፣ ሴት ልጅ፣ ባል፣ ሚስት፣ ወዘተ' : 'Son, Daughter, Spouse, etc.'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'ዝምድና (አማርኛ)' : 'Relationship (Amharic)'}
                    </label>
                    <input
                      type="text"
                      lang="am"
                      value={formData.reporter_relation_am}
                      onChange={(e) => setFormData({...formData, reporter_relation_am: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-ethiopic"
                      placeholder={locale === 'am' ? 'ዝምድና በአማርኛ' : 'Relationship in Amharic'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'ስልክ ቁጥር' : 'Phone Number'}
                    </label>
                    <input
                      type="tel"
                      value={formData.reporter_phone}
                      onChange={(e) => setFormData({...formData, reporter_phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'አድራሻ' : 'Address'}
                    </label>
                    <input
                      type="text"
                      value={formData.reporter_address}
                      onChange={(e) => setFormData({...formData, reporter_address: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'አድራሻ (አማርኛ)' : 'Address (Amharic)'}
                    </label>
                    <input
                      type="text"
                      lang="am"
                      value={formData.reporter_address_am}
                      onChange={(e) => setFormData({...formData, reporter_address_am: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-ethiopic"
                      placeholder={locale === 'am' ? 'አድራሻ በአማርኛ' : 'Address in Amharic'}
                    />
                  </div>
                </div>
              </div>

              {/* Registrar Information */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaFileAlt className="text-gray-600" />
                  {locale === 'am' ? 'የምዝገባ መረጃ' : 'Registration Information'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'መዝጋቢ ስም' : 'Registrar Name'}
                    </label>
                    <input
                      type="text"
                      value={formData.registrar_name}
                      onChange={(e) => setFormData({...formData, registrar_name: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder={locale === 'am' ? 'የሲቪል መዝጋቢ ስም' : 'Name of civil registrar'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'መዝጋቢ ስም (አማርኛ)' : 'Registrar Name (Amharic)'}
                    </label>
                    <input
                      type="text"
                      lang="am"
                      value={formData.registrar_name_am}
                      onChange={(e) => setFormData({...formData, registrar_name_am: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-ethiopic"
                      placeholder={locale === 'am' ? 'ስም በአማርኛ' : 'Name in Amharic'}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleNew}
                  className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition"
                >
                  {locale === 'am' ? 'ሰርዝ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                  {loading ? (locale === 'am' ? 'በሂደት ላይ...' : 'Processing...') : (locale === 'am' ? 'የሞት ማስረጃ ስጥ' : 'Issue Death Certificate')}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <FaCheckCircle className="text-green-600 text-5xl mx-auto mb-4" />
              <h2 className="text-xl font-bold text-green-800 mb-2">
                {locale === 'am' ? 'የሞት ማስረጃ በተሳካ ሁኔታ ተሰጥቷል' : 'Death Certificate Issued Successfully!'}
              </h2>
              <p className="text-green-700 mb-4">
                {locale === 'am' ? 'የሞት ማስረጃ ተዘጋጅቷል እና ለማተም ዝግጁ ነው' : 'The death certificate has been generated and is ready for printing'}
              </p>
              <div className="bg-white rounded-lg p-4 inline-block mx-auto">
                <p className="text-sm text-gray-500">
                  {locale === 'am' ? 'የማስረጃ መለያ ቁጥር' : 'Certificate ID'}
                </p>
                <p className="text-lg font-bold text-blue-600 font-mono">{generatedId}</p>
              </div>
              <div className="flex gap-3 justify-center mt-6">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <FaPrint /> {locale === 'am' ? 'ማተም' : 'Print Certificate'}
                </button>
                <button
                  onClick={handleNew}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  {locale === 'am' ? 'ሌላ ማስረጃ' : 'Issue Another'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default withAuth(DeathCertificatePage, ['Record Officer']);
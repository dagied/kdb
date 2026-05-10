'use client';

import { withAuth } from '@/components/withAuth';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useTranslation } from '@/hooks/useTranslation';
import ResidentSearch from '@/components/ResidentSearch';
import { 
  FaRing, FaUser, FaCalendarAlt, FaMapMarkerAlt,
  FaFileAlt, FaSave, FaSpinner, FaPrint,
  FaCheckCircle, FaTimesCircle, FaUsers,
  FaChurch, FaBookOpen
} from 'react-icons/fa';
import { gregorianToEthiopian, ethiopianToGregorian, getCurrentEthiopianDate } from '@/utils/calendar';

function MarriageCertificatePage() {
  const { t, locale } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedId, setGeneratedId] = useState(null);
  const [error, setError] = useState(null);
  const [marriageCalendar, setMarriageCalendar] = useState('gc');
  const [searchHusband, setSearchHusband] = useState(false);
  const [searchWife, setSearchWife] = useState(false);
  const [selectedHusband, setSelectedHusband] = useState(null);
  const [selectedWife, setSelectedWife] = useState(null);
  
  const [formData, setFormData] = useState({
    registration_number: '',
    husband_name: '',
    husband_name_am: '',
    husband_id_number: '',
    husband_resident_id: '',
    wife_name: '',
    wife_name_am: '',
    wife_id_number: '',
    wife_resident_id: '',
    marriage_date_gc: '',
    marriage_date_ec: '',
    ceremony_place: '',
    ceremony_place_am: '',
    ceremony_type: '',
    ceremony_type_am: '',
    witness1_name: '',
    witness1_name_am: '',
    witness2_name: '',
    witness2_name_am: '',
    registrar_name: '',
    registrar_name_am: '',
    priest_name: '',
    priest_name_am: ''
  });

  const handleSelectHusband = (resident) => {
    setSelectedHusband(resident);
    setFormData(prev => ({
      ...prev,
      husband_name: `${resident.fname} ${resident.lname}`,
      husband_name_am: resident.fname_am && resident.lname_am ? `${resident.fname_am} ${resident.lname_am}` : '',
      husband_id_number: resident.national_id || '',
      husband_resident_id: resident.resident_id
    }));
    setSearchHusband(false);
  };

  const handleSelectWife = (resident) => {
    setSelectedWife(resident);
    setFormData(prev => ({
      ...prev,
      wife_name: `${resident.fname} ${resident.lname}`,
      wife_name_am: resident.fname_am && resident.lname_am ? `${resident.fname_am} ${resident.lname_am}` : '',
      wife_id_number: resident.national_id || '',
      wife_resident_id: resident.resident_id
    }));
    setSearchWife(false);
  };

  const generateRegistrationNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000);
    return `MRG-${year}-${String(random).padStart(4, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const registrationNumber = generateRegistrationNumber();
    
    try {
      const response = await fetch('/api/certificates/marriage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          registration_number: registrationNumber
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setGeneratedId(data.certificate_id);
        setShowPreview(true);
      } else {
        setError(data.error || 'Failed to issue marriage certificate');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.open(`/api/certificates/print/${generatedId}?type=marriage`, '_blank');
  };

  const handleNew = () => {
    setShowPreview(false);
    setGeneratedId(null);
    setSelectedHusband(null);
    setSelectedWife(null);
    setFormData({
      registration_number: '',
      husband_name: '',
      husband_name_am: '',
      husband_id_number: '',
      husband_resident_id: '',
      wife_name: '',
      wife_name_am: '',
      wife_id_number: '',
      wife_resident_id: '',
      marriage_date_gc: '',
      marriage_date_ec: '',
      ceremony_place: '',
      ceremony_place_am: '',
      ceremony_type: '',
      ceremony_type_am: '',
      witness1_name: '',
      witness1_name_am: '',
      witness2_name: '',
      witness2_name_am: '',
      registrar_name: '',
      registrar_name_am: '',
      priest_name: '',
      priest_name_am: ''
    });
  };

  const handleMarriageDateChange = (value, calendar) => {
    if (calendar === 'gc') {
      if (value) {
        try {
          const ecDate = gregorianToEthiopian(value);
          setFormData(prev => ({
            ...prev,
            marriage_date_gc: value,
            marriage_date_ec: ecDate?.formattedEc || ''
          }));
        } catch (error) {
          console.error('Error converting marriage GC to EC date:', error);
          setFormData(prev => ({
            ...prev,
            marriage_date_gc: value,
            marriage_date_ec: ''
          }));
        }
      } else {
        setFormData(prev => ({
          ...prev,
          marriage_date_gc: '',
          marriage_date_ec: ''
        }));
      }
    } else {
      if (value) {
        const gcDate = ethiopianToGregorian(value);
        setFormData(prev => ({
          ...prev,
          marriage_date_ec: value,
          marriage_date_gc: gcDate?.formatted || ''
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          marriage_date_ec: '',
          marriage_date_gc: ''
        }));
      }
    }
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
        
        /* Ensure proper rendering on all browsers */
        * {
          font-feature-settings: "locl";
        }
      `}</style>

      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaRing className="text-pink-600" /> 
            {locale === 'am' ? 'የጋብቻ ማስረጃ መስጠት' : 'Marriage Certificate Issuance'}
          </h1>
          <p className="text-gray-500 mt-1">
            {locale === 'am' ? 'ጋብቻ ይመዝግቡ እና ኦፊሴላዊ የጋብቻ ማስረጃ ይስጡ' : 'Register a marriage and issue an official marriage certificate'}
          </p>
        </div>

        

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <FaTimesCircle /> {error}
          </div>
        )}

        {!showPreview ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Groom/Husband Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                <FaUser className="text-blue-600" />
                {locale === 'am' ? 'የሙሽር መረጃ' : 'Groom/Husband Information'}
              </h2>
              
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setSearchHusband(!searchHusband)}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                >
                  🔍 {searchHusband ? (locale === 'am' ? 'ድበቅ' : 'Hide Search') : (locale === 'am' ? 'ነዋሪ ፈልግ' : 'Search for Resident')}
                </button>
              </div>

              {searchHusband && (
                <ResidentSearch
                  onSelect={handleSelectHusband}
                  selectedResident={selectedHusband}
                  onClear={() => setSelectedHusband(null)}
                />
              )}

              {selectedHusband && !searchHusband && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="text-green-600" />
                    <span className="text-sm">{selectedHusband.fname} {selectedHusband.lname}</span>
                  </div>
                  <button onClick={() => setSearchHusband(true)} className="text-blue-600 text-sm">
                    {locale === 'am' ? 'ለውጥ' : 'Change'}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'ሙሉ ስም (እንግሊዝኛ)' : 'Groom Full Name (English)'}
                  </label>
                  <input
                    type="text"
                    value={formData.husband_name}
                    onChange={(e) => setFormData({...formData, husband_name: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'ሙሉ ስም (አማርኛ)' : 'Groom Name (Amharic)'}
                  </label>
                  <input
                    type="text"
                    lang="am"
                    value={formData.husband_name_am}
                    onChange={(e) => setFormData({...formData, husband_name_am: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-ethiopic"
                    placeholder="ሙሉ ስም በአማርኛ ይጻፉ"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'የመታወቂያ ቁጥር' : 'ID Number'}
                  </label>
                  <input
                    type="text"
                    value={formData.husband_id_number}
                    onChange={(e) => setFormData({...formData, husband_id_number: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Bride/Wife Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                <FaUser className="text-pink-600" />
                {locale === 'am' ? 'የሙሽራ መረጃ' : 'Bride/Wife Information'}
              </h2>
              
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setSearchWife(!searchWife)}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                >
                  🔍 {searchWife ? (locale === 'am' ? 'ድበቅ' : 'Hide Search') : (locale === 'am' ? 'ነዋሪ ፈልግ' : 'Search for Resident')}
                </button>
              </div>

              {searchWife && (
                <ResidentSearch
                  onSelect={handleSelectWife}
                  selectedResident={selectedWife}
                  onClear={() => setSelectedWife(null)}
                />
              )}

              {selectedWife && !searchWife && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="text-green-600" />
                    <span className="text-sm">{selectedWife.fname} {selectedWife.lname}</span>
                  </div>
                  <button onClick={() => setSearchWife(true)} className="text-blue-600 text-sm">
                    {locale === 'am' ? 'ለውጥ' : 'Change'}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'ሙሉ ስም (እንግሊዝኛ)' : 'Bride Full Name (English)'}
                  </label>
                  <input
                    type="text"
                    value={formData.wife_name}
                    onChange={(e) => setFormData({...formData, wife_name: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'ሙሉ ስም (አማርኛ)' : 'Bride Name (Amharic)'}
                  </label>
                  <input
                    type="text"
                    lang="am"
                    value={formData.wife_name_am}
                    onChange={(e) => setFormData({...formData, wife_name_am: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-ethiopic"
                    placeholder="ሙሉ ስም በአማርኛ ይጻፉ"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'የመታወቂያ ቁጥር' : 'ID Number'}
                  </label>
                  <input
                    type="text"
                    value={formData.wife_id_number}
                    onChange={(e) => setFormData({...formData, wife_id_number: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Marriage Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                <FaCalendarAlt className="text-purple-600" />
                {locale === 'am' ? 'የጋብቻ መረጃ' : 'Marriage Information'}
              </h2>
              
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setMarriageCalendar('gc')}
                  className={`px-3 py-1 rounded-lg text-sm ${marriageCalendar === 'gc' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                >
                  Gregorian Calendar
                </button>
                <button
                  type="button"
                  onClick={() => setMarriageCalendar('ec')}
                  className={`px-3 py-1 rounded-lg text-sm ${marriageCalendar === 'ec' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                >
                  Ethiopian Calendar
                </button>
                <span className="text-xs text-gray-400 ml-auto">
                  {locale === 'am' ? 'ዛሬ (ኢትዮጵያ)' : 'Today (EC)'}: {currentEcDate.formattedDisplay.en}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {marriageCalendar === 'gc' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {locale === 'am' ? 'የጋብቻ ቀን (ግሪጎሪያን)' : 'Marriage Date (GC)'}
                      </label>
                      <input
                        type="date"
                        value={formData.marriage_date_gc}
                        onChange={(e) => handleMarriageDateChange(e.target.value, 'gc')}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {locale === 'am' ? 'የጋብቻ ቀን (ኢትዮጵያ)' : 'Marriage Date (EC)'}
                      </label>
                      <input
                        type="text"
                        value={formData.marriage_date_ec}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-ethiopic"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {locale === 'am' ? 'የጋብቻ ቀን (ኢትዮጵያ)' : 'Marriage Date (EC)'}
                      </label>
                      <input
                        type="text"
                        value={formData.marriage_date_ec}
                        onChange={(e) => handleMarriageDateChange(e.target.value, 'ec')}
                        placeholder="YYYY-MM-DD"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg font-ethiopic"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {locale === 'am' ? 'የጋብቻ ቀን (ግሪጎሪያን)' : 'Marriage Date (GC)'}
                      </label>
                      <input
                        type="text"
                        value={formData.marriage_date_gc}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'የሥርዓተ ጋብቻ ቦታ' : 'Ceremony Place'}
                  </label>
                  <input
                    type="text"
                    value={formData.ceremony_place}
                    onChange={(e) => setFormData({...formData, ceremony_place: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder={locale === 'am' ? 'ቤተክርስቲያን፣ መስጊድ፣ አዳራሽ፣ ወዘተ' : 'Church, Mosque, Hall, etc.'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'የሥርዓተ ጋብቻ ቦታ (አማርኛ)' : 'Ceremony Place (Amharic)'}
                  </label>
                  <input
                    type="text"
                    lang="am"
                    value={formData.ceremony_place_am}
                    onChange={(e) => setFormData({...formData, ceremony_place_am: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-ethiopic"
                    placeholder="ቦታ በአማርኛ"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'የጋብቻ አይነት' : 'Ceremony Type'}
                  </label>
                  <select
                    value={formData.ceremony_type}
                    onChange={(e) => setFormData({...formData, ceremony_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">{locale === 'am' ? 'ይምረጡ' : 'Select ceremony type'}</option>
                    <option value="Religious">{locale === 'am' ? 'ሃይማኖታዊ' : 'Religious'}</option>
                    <option value="Civil">{locale === 'am' ? 'ሲቪል' : 'Civil'}</option>
                    <option value="Traditional">{locale === 'am' ? 'ባህላዊ' : 'Traditional'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'ጋብቻ አስፈጻሚ/ካህን' : 'Officiant/Priest Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.priest_name}
                    onChange={(e) => setFormData({...formData, priest_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'ጋብቻ አስፈጻሚ/ካህን (አማርኛ)' : 'Officiant/Priest Name (Amharic)'}
                  </label>
                  <input
                    type="text"
                    lang="am"
                    value={formData.priest_name_am}
                    onChange={(e) => setFormData({...formData, priest_name_am: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-ethiopic"
                    placeholder="ስም በአማርኛ"
                  />
                </div>
              </div>
            </div>

            {/* Witnesses Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                <FaUsers className="text-green-600" />
                {locale === 'am' ? 'የምስክሮች መረጃ' : 'Witnesses Information'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'ምስክር 1 ስም' : 'Witness 1 Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.witness1_name}
                    onChange={(e) => setFormData({...formData, witness1_name: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'ምስክር 1 ስም (አማርኛ)' : 'Witness 1 Name (Amharic)'}
                  </label>
                  <input
                    type="text"
                    lang="am"
                    value={formData.witness1_name_am}
                    onChange={(e) => setFormData({...formData, witness1_name_am: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-ethiopic"
                    placeholder="ስም በአማርኛ"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'ምስክር 2 ስም' : 'Witness 2 Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.witness2_name}
                    onChange={(e) => setFormData({...formData, witness2_name: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'ምስክር 2 ስም (አማርኛ)' : 'Witness 2 Name (Amharic)'}
                  </label>
                  <input
                    type="text"
                    lang="am"
                    value={formData.witness2_name_am}
                    onChange={(e) => setFormData({...formData, witness2_name_am: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-ethiopic"
                    placeholder="ስም በአማርኛ"
                  />
                </div>
              </div>
            </div>

            {/* Registrar Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                <FaFileAlt className="text-orange-600" />
                {locale === 'am' ? 'የመዝጋቢ መረጃ' : 'Registrar Information'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'የመዝጋቢ ስም' : 'Registrar Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.registrar_name}
                    onChange={(e) => setFormData({...formData, registrar_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Enter registrar name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'የመዝጋቢ ስም (አማርኛ)' : 'Registrar Name (Amharic)'}
                  </label>
                  <input
                    type="text"
                    lang="am"
                    value={formData.registrar_name_am}
                    onChange={(e) => setFormData({...formData, registrar_name_am: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-ethiopic"
                    placeholder="ስም በአማርኛ"
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
                className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                {loading ? (locale === 'am' ? 'በሂደት ላይ...' : 'Processing...') : (locale === 'am' ? 'የጋብቻ ማስረጃ ስጥ' : 'Issue Marriage Certificate')}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <FaCheckCircle className="text-green-600 text-5xl mx-auto mb-4" />
              <h2 className="text-xl font-bold text-green-800 mb-2">
                {locale === 'am' ? 'የጋብቻ ማስረጃ በተሳካ ሁኔታ ተሰጥቷል' : 'Marriage Certificate Issued Successfully'}
              </h2>
              <p className="text-green-700 mb-4">
                {locale === 'am' ? 'የጋብቻ ማስረጃ ተዘጋጅቷል እና ለማተም ዝግጁ ነው' : 'The marriage certificate has been generated and is ready for printing'}
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
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
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

export default withAuth(MarriageCertificatePage, ['Record Officer']);
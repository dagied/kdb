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
  FaHeartbeat, FaUserFriends, FaEnvelope, FaBookOpen,
  FaGlobe, FaLanguage, FaBuilding, FaHome, FaUserGraduate,
  FaBaby  // ← Add this line
} from 'react-icons/fa';
import { gregorianToEthiopian, ethiopianToGregorian, getCurrentEthiopianDate } from '@/utils/calendar';

// Ethiopian months with correct English equivalents
const ETHIOPIAN_MONTHS = [
  { value: '01', nameEn: 'September', nameAm: 'መስከረም', nameFull: 'Meskerem' },
  { value: '02', nameEn: 'October', nameAm: 'ጥቅምት', nameFull: 'Tikimt' },
  { value: '03', nameEn: 'November', nameAm: 'ኅዳር', nameFull: 'Hidar' },
  { value: '04', nameEn: 'December', nameAm: 'ታኅሣሥ', nameFull: 'Tahsas' },
  { value: '05', nameEn: 'January', nameAm: 'ጥር', nameFull: 'Tir' },
  { value: '06', nameEn: 'February', nameAm: 'የካቲት', nameFull: 'Yekatit' },
  { value: '07', nameEn: 'March', nameAm: 'መጋቢት', nameFull: 'Megabit' },
  { value: '08', nameEn: 'April', nameAm: 'ሚያዝያ', nameFull: 'Miazia' },
  { value: '09', nameEn: 'May', nameAm: 'ግንቦት', nameFull: 'Ginbot' },
  { value: '10', nameEn: 'June', nameAm: 'ሰኔ', nameFull: 'Sene' },
  { value: '11', nameEn: 'July', nameAm: 'ሐምሌ', nameFull: 'Hamle' },
  { value: '12', nameEn: 'August', nameAm: 'ነሐሴ', nameFull: 'Nehasse' },
  { value: '13', nameEn: 'September (Leap)', nameAm: 'ጳጉሜ', nameFull: 'Pagumiene' }
];

function DeathCertificatePage() {
  const { t, locale } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedId, setGeneratedId] = useState(null);
  const [error, setError] = useState(null);
  const [deathCalendarMode, setDeathCalendarMode] = useState('gc');
  const [burialCalendarMode, setBurialCalendarMode] = useState('gc');
  const [searchResident, setSearchResident] = useState(false);
  const [birthDateMode, setBirthDateMode] = useState('gc');  // ← Add this line
  
  const [formData, setFormData] = useState({
    // Deceased Information
    resident_id: '',
    title: '',
    deceased_name: '',
    deceased_name_am: '',
    deceased_father_name: '',
    deceased_father_name_am: '',
    deceased_grandfather_name: '',
    deceased_grandfather_name_am: '',
    sex: '',
    nationality: 'Ethiopian',
    
    // Birth Information (for the deceased)
    birth_registration_number: '',
    birth_date_gc: '',
    birth_date_ec: '',
    
    // Death Information
    registration_number: '',
    form_number: '',
    death_date_gc: '',
    death_date_ec: '',
    place_of_death: '',
    place_of_death_am: '',
    cause_of_death: '',
    cause_of_death_am: '',
    
    // Reporter Information
    reporter_name: '',
    reporter_name_am: '',
    reporter_relation: '',
    reporter_relation_am: '',
    reporter_phone: '',
    reporter_address: '',
    reporter_address_am: '',
    
    // Burial Information
    burial_place: '',
    burial_place_am: '',
    burial_date_gc: '',
    burial_date_ec: '',
    
    // Registrar Information
    registrar_name: '',
    registrar_name_am: '',
    registrar_father_name: '',
    registrar_grandfather_name: '',
    registrar_km: '',
    issue_date: ''
  });

  const handleSelectResident = (resident) => {
    setSelectedResident(resident);
    
    // Build full name including all name parts
    const firstName = resident.fname || '';
    const middleName = resident.mname || '';
    const lastName = resident.lname || '';
    const grandfatherName = resident.grandfather_name || '';
    const fullNameEn = [firstName, middleName, lastName, grandfatherName].filter(Boolean).join(' ');
    const fullNameAm = [
      resident.fname_am, 
      resident.mname_am, 
      resident.lname_am, 
      resident.grandfather_name_am
    ].filter(Boolean).join(' ');
    
    setFormData(prev => ({
      ...prev,
      resident_id: resident.resident_id,
      deceased_name: fullNameEn,
      deceased_name_am: fullNameAm,
      deceased_father_name: resident.lname || '',
      deceased_father_name_am: resident.lname_am || '',
      sex: resident.gender || '',
      nationality: resident.nationality || 'Ethiopian',
    }));
    setSearchResident(false);
  };

  const handleClearResident = () => {
    setSelectedResident(null);
    setFormData({
      resident_id: '',
      title: '',
      deceased_name: '',
      deceased_name_am: '',
      deceased_father_name: '',
      deceased_father_name_am: '',
      deceased_grandfather_name: '',
      deceased_grandfather_name_am: '',
      sex: '',
      nationality: 'Ethiopian',
      birth_registration_number: '',
      birth_date_gc: '',
      birth_date_ec: '',
      registration_number: '',
      form_number: '',
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
      burial_place: '',
      burial_place_am: '',
      burial_date_gc: '',
      burial_date_ec: '',
      registrar_name: '',
      registrar_name_am: '',
      registrar_father_name: '',
      registrar_grandfather_name: '',
      registrar_km: '',
      issue_date: ''
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

  const handleBirthDateChange = (value, calendar) => {
    if (calendar === 'gc') {
      if (value) {
        try {
          const ecDate = gregorianToEthiopian(value);
          setFormData(prev => ({
            ...prev,
            birth_date_gc: value,
            birth_date_ec: ecDate?.formattedEc || ''
          }));
        } catch (error) {
          console.error('Error converting GC to EC date:', error);
          setFormData(prev => ({
            ...prev,
            birth_date_gc: value,
            birth_date_ec: ''
          }));
        }
      } else {
        setFormData(prev => ({
          ...prev,
          birth_date_gc: '',
          birth_date_ec: ''
        }));
      }
    } else {
      if (value) {
        const gcDate = ethiopianToGregorian(value);
        setFormData(prev => ({
          ...prev,
          birth_date_ec: value,
          birth_date_gc: gcDate?.formatted || ''
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          birth_date_ec: '',
          birth_date_gc: ''
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
      issue_date: formData.issue_date || new Date().toISOString().split('T')[0],
      registrar_name: formData.registrar_name || 'Kebele Administration',
      registrar_name_am: formData.registrar_name_am || 'ቀበሌ አስተዳደር',
      resident_id: selectedResident?.resident_id || formData.resident_id
    };
    
    console.log('Submitting death certificate:', submitData);
    
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
    if (generatedId) {
      window.open(`/api/certificates/print/${generatedId}?type=death`, '_blank');
    } else {
      console.error('No certificate ID available for printing');
      alert('Certificate ID not found. Please try again.');
    }
  };

  const handleNew = () => {
    setShowPreview(false);
    setGeneratedId(null);
    setSelectedResident(null);
    handleClearResident();
  };

  const currentEcDate = getCurrentEthiopianDate();

  return (
    <Layout role="Record Officer">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;500;600;700&display=swap');
        .font-ethiopic {
          font-family: 'Noto Sans Ethiopic', 'Nyala', 'Abyssinica SIL', sans-serif;
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
              {/* Deceased Information - Updated */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                  <FaUser className="text-gray-600" />
                  {locale === 'am' ? 'የሟች መረጃ' : 'Deceased Information'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'ማዕረግ' : 'Title'}
                    </label>
                    <select
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">{locale === 'am' ? 'ይምረጡ' : 'Select'}</option>
                      <option value="Mr.">Mr.</option>
                      <option value="Mrs.">Mrs.</option>
                      <option value="Miss">Miss</option>
                      <option value="Dr.">Dr.</option>
                      <option value="Prof.">Prof.</option>
                      <option value="Ato">Ato / አቶ</option>
                      <option value="W/ro">W/ro / ወ/ሮ</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'ጾታ' : 'Sex'}
                    </label>
                    <select
                      value={formData.sex}
                      onChange={(e) => setFormData({...formData, sex: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">{locale === 'am' ? 'ይምረጡ' : 'Select'}</option>
                      <option value="Male">Male / ወንድ</option>
                      <option value="Female">Female / ሴት</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'ዜግነት' : 'Nationality'}
                    </label>
                    <input
                      type="text"
                      value={formData.nationality}
                      onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'ሙሉ ስም (እንግሊዝኛ)' : 'Full Name (English)'} *
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
                      {locale === 'am' ? 'የአባት ስም' : "Father's Name"} *
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
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'የአያት ስም' : "Grandfather's Name"}
                    </label>
                    <input
                      type="text"
                      value={formData.deceased_grandfather_name}
                      onChange={(e) => setFormData({...formData, deceased_grandfather_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'የአያት ስም (አማርኛ)' : "Grandfather's Name (Amharic)"}
                    </label>
                    <input
                      type="text"
                      lang="am"
                      value={formData.deceased_grandfather_name_am}
                      onChange={(e) => setFormData({...formData, deceased_grandfather_name_am: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-ethiopic"
                    />
                  </div>
                </div>
              </div>

              {/* Birth Information (for the deceased) */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                  <FaBaby className="text-blue-600" />
                  {locale === 'am' ? 'የሟች የልደት መረጃ' : 'Deceased Birth Information'}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'የልደት ምዝገባ ቁጥር' : 'Birth Registration Number'}
                    </label>
                    <input
                      type="text"
                      value={formData.birth_registration_number}
                      onChange={(e) => setFormData({...formData, birth_registration_number: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="e.g., BTH-2024-XXXX"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4 mb-4">
                  <button
                    type="button"
                    onClick={() => setBirthDateMode('gc')}
                    className={`px-3 py-1 rounded-lg text-sm ${birthDateMode === 'gc' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                  >
                    Gregorian Calendar
                  </button>
                  <button
                    type="button"
                    onClick={() => setBirthDateMode('ec')}
                    className={`px-3 py-1 rounded-lg text-sm ${birthDateMode === 'ec' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                  >
                    Ethiopian Calendar
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {birthDateMode === 'gc' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {locale === 'am' ? 'የልደት ቀን (ግሪጎሪያን)' : 'Birth Date (GC)'}
                        </label>
                        <input
                          type="date"
                          value={formData.birth_date_gc}
                          onChange={(e) => handleBirthDateChange(e.target.value, 'gc')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {locale === 'am' ? 'የልደት ቀን (ኢትዮጵያ)' : 'Birth Date (EC)'}
                        </label>
                        <input
                          type="text"
                          value={formData.birth_date_ec}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-ethiopic"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {locale === 'am' ? 'የልደት ቀን (ኢትዮጵያ)' : 'Birth Date (EC)'}
                        </label>
                        <input
                          type="text"
                          value={formData.birth_date_ec}
                          onChange={(e) => handleBirthDateChange(e.target.value, 'ec')}
                          placeholder="YYYY-MM-DD"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg font-ethiopic"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {locale === 'am' ? 'የልደት ቀን (ግሪጎሪያን)' : 'Birth Date (GC)'}
                        </label>
                        <input
                          type="text"
                          value={formData.birth_date_gc}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Death Information - Updated with Form Number and Place of Death */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                  <FaCalendarAlt className="text-red-600" />
                  {locale === 'am' ? 'የሞት መረጃ' : 'Death Information'}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'የቅጽ ቁጥር' : 'Form Number'}
                    </label>
                    <input
                      type="text"
                      value={formData.form_number}
                      onChange={(e) => setFormData({...formData, form_number: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="e.g., DTH-001/2026"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setDeathCalendarMode('gc')}
                    className={`px-3 py-1 rounded-lg text-sm ${deathCalendarMode === 'gc' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                  >
                    Gregorian Calendar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeathCalendarMode('ec')}
                    className={`px-3 py-1 rounded-lg text-sm ${deathCalendarMode === 'ec' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                  >
                    Ethiopian Calendar
                  </button>
                  <span className="text-xs text-gray-400 ml-auto">
                    {locale === 'am' ? 'ዛሬ (ኢትዮጵያ)' : 'Today (EC)'}: {currentEcDate.formattedDisplay.en}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {deathCalendarMode === 'gc' ? (
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.place_of_death}
                          onChange={(e) => setFormData({...formData, place_of_death: e.target.value})}
                          placeholder={locale === 'am' ? 'ቦታ (እንግሊዝኛ)' : 'Place (English)'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10"
                        />
                        <FaGlobe className="absolute right-3 top-3 text-gray-400" />
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          lang="am"
                          value={formData.place_of_death_am}
                          onChange={(e) => setFormData({...formData, place_of_death_am: e.target.value})}
                          placeholder={locale === 'am' ? 'ቦታ (አማርኛ)' : 'Place (Amharic)'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10 font-ethiopic"
                        />
                        <FaLanguage className="absolute right-3 top-3 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'የሞት መንስኤ' : 'Cause of Death'}
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <textarea
                        value={formData.cause_of_death}
                        onChange={(e) => setFormData({...formData, cause_of_death: e.target.value})}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                        placeholder={locale === 'am' ? 'የሞት መንስኤ (እንግሊዝኛ)' : 'Cause of death (English)'}
                      />
                      <textarea
                        lang="am"
                        value={formData.cause_of_death_am}
                        onChange={(e) => setFormData({...formData, cause_of_death_am: e.target.value})}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none font-ethiopic"
                        placeholder={locale === 'am' ? 'የሞት መንስኤ (አማርኛ)' : 'Cause of death (Amharic)'}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Burial Information */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                  <FaMapMarkerAlt className="text-gray-600" />
                  {locale === 'am' ? 'የቀብር መረጃ' : 'Burial Information'}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'የቀብር ቦታ' : 'Burial Place'}
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.burial_place}
                          onChange={(e) => setFormData({...formData, burial_place: e.target.value})}
                          placeholder={locale === 'am' ? 'ቦታ (እንግሊዝኛ)' : 'Place (English)'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10"
                        />
                        <FaGlobe className="absolute right-3 top-3 text-gray-400" />
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          lang="am"
                          value={formData.burial_place_am}
                          onChange={(e) => setFormData({...formData, burial_place_am: e.target.value})}
                          placeholder={locale === 'am' ? 'ቦታ (አማርኛ)' : 'Place (Amharic)'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10 font-ethiopic"
                        />
                        <FaLanguage className="absolute right-3 top-3 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setBurialCalendarMode('gc')}
                    className={`px-3 py-1 rounded-lg text-sm ${burialCalendarMode === 'gc' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                  >
                    Gregorian Calendar
                  </button>
                  <button
                    type="button"
                    onClick={() => setBurialCalendarMode('ec')}
                    className={`px-3 py-1 rounded-lg text-sm ${burialCalendarMode === 'ec' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                  >
                    Ethiopian Calendar
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {burialCalendarMode === 'gc' ? (
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
                      {locale === 'am' ? 'ሪፖርተር ስም' : 'Reporter Name'} *
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      <input
                        type="text"
                        value={formData.reporter_name}
                        onChange={(e) => setFormData({...formData, reporter_name: e.target.value})}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder={locale === 'am' ? 'ስም (እንግሊዝኛ)' : 'Name (English)'}
                      />
                      <input
                        type="text"
                        lang="am"
                        value={formData.reporter_name_am}
                        onChange={(e) => setFormData({...formData, reporter_name_am: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg font-ethiopic"
                        placeholder={locale === 'am' ? 'ስም (አማርኛ)' : 'Name (Amharic)'}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'ዝምድና' : 'Relationship'} *
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      <input
                        type="text"
                        value={formData.reporter_relation}
                        onChange={(e) => setFormData({...formData, reporter_relation: e.target.value})}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder={locale === 'am' ? 'ዝምድና (እንግሊዝኛ)' : 'Relationship (English)'}
                      />
                      <input
                        type="text"
                        lang="am"
                        value={formData.reporter_relation_am}
                        onChange={(e) => setFormData({...formData, reporter_relation_am: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg font-ethiopic"
                        placeholder={locale === 'am' ? 'ዝምድና (አማርኛ)' : 'Relationship (Amharic)'}
                      />
                    </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={formData.reporter_address}
                        onChange={(e) => setFormData({...formData, reporter_address: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder={locale === 'am' ? 'አድራሻ (እንግሊዝኛ)' : 'Address (English)'}
                      />
                      <input
                        type="text"
                        lang="am"
                        value={formData.reporter_address_am}
                        onChange={(e) => setFormData({...formData, reporter_address_am: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg font-ethiopic"
                        placeholder={locale === 'am' ? 'አድራሻ (አማርኛ)' : 'Address (Amharic)'}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Registration Information - Updated with Registrar Family Names */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaFileAlt className="text-gray-600" />
                  {locale === 'am' ? 'የምዝገባ መረጃ' : 'Registration Information'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'መዝጋቢ ስም' : 'Registrar Name'} *
                    </label>
                    <input
                      type="text"
                      value={formData.registrar_name}
                      onChange={(e) => setFormData({...formData, registrar_name: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder={locale === 'am' ? 'ስም (እንግሊዝኛ)' : 'Name (English)'}
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'የአባት ስም' : "Registrar's Father's Name"}
                    </label>
                    <input
                      type="text"
                      value={formData.registrar_father_name}
                      onChange={(e) => setFormData({...formData, registrar_father_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder={locale === 'am' ? 'የአባት ስም' : "Father's name"}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'የአያት ስም' : "Registrar's Grandfather's Name"}
                    </label>
                    <input
                      type="text"
                      value={formData.registrar_grandfather_name}
                      onChange={(e) => setFormData({...formData, registrar_grandfather_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder={locale === 'am' ? 'የአያት ስም' : "Grandfather's name"}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'ቀበሌ' : 'Kebele'}
                    </label>
                    <input
                      type="text"
                      value={formData.registrar_km}
                      onChange={(e) => setFormData({...formData, registrar_km: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder={locale === 'am' ? 'ቀበሌ' : 'Kebele'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'የወጣበት ቀን' : 'Issue Date'}
                    </label>
                    <input
                      type="date"
                      value={formData.issue_date}
                      onChange={(e) => setFormData({...formData, issue_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
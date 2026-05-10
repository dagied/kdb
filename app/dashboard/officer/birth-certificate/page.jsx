'use client';

import { withAuth } from '@/components/withAuth';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useTranslation } from '@/hooks/useTranslation';
import ResidentSearch from '@/components/ResidentSearch';
import { 
  FaBaby, FaCalendarAlt, FaUser, FaMapMarkerAlt, 
  FaIdCard, FaSave, FaSpinner, FaPrint,
  FaCheckCircle, FaTimesCircle, FaSearch,
  FaVenusMars, FaMars, FaUserCheck, FaUsers
} from 'react-icons/fa';
import { gregorianToEthiopian, getCurrentEthiopianDate } from '@/utils/calendar';

// Ethiopian month names for the dropdown
const ETHIOPIAN_MONTHS = [
  { value: '01', nameEn: 'Meskerem', nameAm: 'መስከረም' },
  { value: '02', nameEn: 'Tikimt', nameAm: 'ጥቅምት' },
  { value: '03', nameEn: 'Hidar', nameAm: 'ኅዳር' },
  { value: '04', nameEn: 'Tahsas', nameAm: 'ታኅሣሥ' },
  { value: '05', nameEn: 'Tir', nameAm: 'ጥር' },
  { value: '06', nameEn: 'Yekatit', nameAm: 'የካቲት' },
  { value: '07', nameEn: 'Megabit', nameAm: 'መጋቢት' },
  { value: '08', nameEn: 'Miazia', nameAm: 'ሚያዝያ' },
  { value: '09', nameEn: 'Ginbot', nameAm: 'ግንቦት' },
  { value: '10', nameEn: 'Sene', nameAm: 'ሰኔ' },
  { value: '11', nameEn: 'Hamle', nameAm: 'ሐምሌ' },
  { value: '12', nameEn: 'Nehasse', nameAm: 'ነሐሴ' },
  { value: '13', nameEn: 'Pagumiene', nameAm: 'ጳጉሜ' }
];

function BirthCertificatePage() {
  const { t, locale } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedId, setGeneratedId] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1);
  const [verifiedResident, setVerifiedResident] = useState(null);
  const [searchResident, setSearchResident] = useState(true);
  const [selectedRequester, setSelectedRequester] = useState(null);
  const [requesterType, setRequesterType] = useState(null);
  const [birthCalendarMode, setBirthCalendarMode] = useState('gc');
  
  const [formData, setFormData] = useState({
    child_first_name: '',
    child_first_name_am: '',
    child_father_name: '',
    child_father_name_am: '',
    child_grandfather_name: '',
    child_grandfather_name_am: '',
    sex: '',
    birth_date_gc: '',
    birth_date_ec: '',
    birth_place: '',
    region: '',
    zone: '',
    woreda: '',
    nationality: 'Ethiopian',
    mother_full_name: '',
    mother_full_name_am: '',
    mother_nationality: 'Ethiopian',
    mother_id: '',
    father_full_name: '',
    father_full_name_am: '',
    father_nationality: 'Ethiopian',
    father_id: '',
    registrar_name: ''
  });

  // Convert Ethiopian date to Gregorian
  const convertEthiopianToGregorian = (year, month, day) => {
    let gregorianYear = parseInt(year) + 8;
    const ethiopianNewYear = new Date(gregorianYear, 8, 11);
    const daysOffset = (parseInt(month) - 1) * 30 + (parseInt(day) - 1);
    const resultDate = new Date(ethiopianNewYear.getTime() + daysOffset * 24 * 60 * 60 * 1000);
    
    return {
      year: resultDate.getFullYear(),
      month: resultDate.getMonth() + 1,
      day: resultDate.getDate(),
      formatted: `${resultDate.getFullYear()}-${String(resultDate.getMonth() + 1).padStart(2, '0')}-${String(resultDate.getDate()).padStart(2, '0')}`
    };
  };

  // Handle birth date change based on calendar mode
  const handleBirthDateChange = (value, type) => {
    if (type === 'gc') {
      setFormData({...formData, birth_date_gc: value});
      if (value) {
        const ecDate = gregorianToEthiopian(value);
        setFormData(prev => ({...prev, birth_date_ec: ecDate.formattedEc}));
      }
    }
  };

  // Handle Ethiopian date components change
  const handleEthiopianDateChange = (year, month, day) => {
    if (year && month && day) {
      const gcDate = convertEthiopianToGregorian(year, month, day);
      setFormData(prev => ({
        ...prev,
        birth_date_ec: `${year}-${month}-${day}`,
        birth_date_gc: gcDate.formatted
      }));
    } else if (year && month) {
      setFormData(prev => ({...prev, birth_date_ec: `${year}-${month}`}));
    } else if (year) {
      setFormData(prev => ({...prev, birth_date_ec: year}));
    } else {
      setFormData(prev => ({...prev, birth_date_ec: ''}));
    }
  };

  const handleSelectRequester = (resident, type) => {
    setSelectedRequester(resident);
    setRequesterType(type);
    setVerifiedResident(resident);
    
    if (type === 'mother') {
      setFormData(prev => ({
        ...prev,
        mother_full_name: `${resident.fname} ${resident.lname}`,
        mother_full_name_am: resident.fname_am ? `${resident.fname_am} ${resident.lname_am}` : '',
        mother_id: resident.resident_id
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        father_full_name: `${resident.fname} ${resident.lname}`,
        father_full_name_am: resident.fname_am ? `${resident.fname_am} ${resident.lname_am}` : '',
        father_id: resident.resident_id
      }));
    }
    setSearchResident(false);
  };

  const handleClearRequester = () => {
    setSelectedRequester(null);
    setVerifiedResident(null);
    setRequesterType(null);
    setFormData(prev => ({
      ...prev,
      mother_full_name: '',
      mother_full_name_am: '',
      mother_id: '',
      father_full_name: '',
      father_full_name_am: '',
      father_id: ''
    }));
    setSearchResident(true);
  };

  const handleSelectMother = (resident) => {
    setFormData(prev => ({
      ...prev,
      mother_full_name: `${resident.fname} ${resident.lname}`,
      mother_full_name_am: resident.fname_am ? `${resident.fname_am} ${resident.lname_am}` : '',
      mother_id: resident.resident_id
    }));
  };

  const handleSelectFather = (resident) => {
    setFormData(prev => ({
      ...prev,
      father_full_name: `${resident.fname} ${resident.lname}`,
      father_full_name_am: resident.fname_am ? `${resident.fname_am} ${resident.lname_am}` : '',
      father_id: resident.resident_id
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validate required fields
  if (!formData.child_first_name) {
    setError(locale === 'am' ? 'የልጁ ስም ያስፈልጋል' : 'Child first name is required');
    return;
  }
  if (!formData.child_father_name) {
    setError(locale === 'am' ? 'የልጁ የአባት ስም ያስፈልጋል' : "Child's father name is required");
    return;
  }
  if (!formData.child_grandfather_name) {
    setError(locale === 'am' ? 'የልጁ የአያት ስም ያስፈልጋል' : "Child's grandfather name is required");
    return;
  }
  if (!formData.sex) {
    setError(locale === 'am' ? 'ጾታ ያስፈልጋል' : 'Sex is required');
    return;
  }
  if (!formData.birth_date_gc && !formData.birth_date_ec) {
    setError(locale === 'am' ? 'የትውልድ ቀን ያስፈልጋል' : 'Birth date is required');
    return;
  }
  if (!formData.mother_full_name) {
    setError(locale === 'am' ? 'የእናት ስም ያስፈልጋል' : "Mother's name is required");
    return;
  }
  if (!formData.father_full_name) {
    setError(locale === 'am' ? 'የአባት ስም ያስፈልጋል' : "Father's name is required");
    return;
  }
  
  setLoading(true);
  setError(null);
  
  try {
    const response = await fetch('/api/certificates/birth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        mother_id: formData.mother_id || null,
        father_id: formData.father_id || null,
        verified_resident_id: verifiedResident?.resident_id,
        requester_type: requesterType
      })
    });
    
    const data = await response.json();
    if (data.success) {
      setGeneratedId(data.certificate_id);
      setShowPreview(true);
    } else {
      setError(data.error || 'Failed to issue certificate');
    }
  } catch (error) {
    console.error('Error:', error);
    setError('Network error. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const handlePrint = () => {
    window.open(`/api/certificates/print/${generatedId}?type=birth`, '_blank');
  };

  const handleNew = () => {
    setShowPreview(false);
    setGeneratedId(null);
    setStep(1);
    setVerifiedResident(null);
    setSelectedRequester(null);
    setRequesterType(null);
    setSearchResident(true);
    setFormData({
      child_first_name: '',
      child_first_name_am: '',
      child_father_name: '',
      child_father_name_am: '',
      child_grandfather_name: '',
      child_grandfather_name_am: '',
      sex: '',
      birth_date_gc: '',
      birth_date_ec: '',
      birth_place: '',
      region: '',
      zone: '',
      woreda: '',
      nationality: 'Ethiopian',
      mother_full_name: '',
      mother_full_name_am: '',
      mother_nationality: 'Ethiopian',
      mother_id: '',
      father_full_name: '',
      father_full_name_am: '',
      father_nationality: 'Ethiopian',
      father_id: '',
      registrar_name: ''
    });
  };

  const currentEcDate = getCurrentEthiopianDate();
  const birthEcParts = formData.birth_date_ec ? formData.birth_date_ec.split('-') : ['', '', ''];

  return (
    <Layout role="Record Officer">
      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaBaby className="text-blue-600" /> 
            {locale === 'am' ? 'የልደት ምስክር ወረቀት' : 'Birth Certificate Issuance'}
          </h1>
          <p className="text-gray-500 mt-1">
            {locale === 'am' ? 'አዲስ ልደት ይመዝግቡ እና የምስክር ወረቀት ያውጡ' : 'Register a new birth and issue certificate'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <FaTimesCircle /> {error}
          </div>
        )}

        {!showPreview ? (
          <>
            {/* Step 1: Verify Resident Requester */}
            {step === 1 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {locale === 'am' ? 'የነዋሪነት ማረጋገጫ' : 'Verify Residency'}
                  </h2>
                </div>
                
                <p className="text-gray-600 mb-4">
                  {locale === 'am' 
                    ? 'እባክዎ የልደት ምስክር ወረቀት ለማውጣት የሚፈልጉትን ነዋሪ ይፈልጉ' 
                    : 'Please search for the resident requesting the birth certificate'}
                </p>

                {searchResident ? (
                  <ResidentSearch
                    onSelect={(resident) => {
                      const isMother = window.confirm(
                        locale === 'am' 
                          ? 'ይህ ነዋሪ የልጁ እናት ነው? "እሺ" ከሆነ እናት ነው, "ሰርዝ" ከሆነ አባት ነው'
                          : 'Is this resident the mother? Click OK for Mother, Cancel for Father'
                      );
                      handleSelectRequester(resident, isMother ? 'mother' : 'father');
                    }}
                    selectedResident={selectedRequester}
                    onClear={handleClearRequester}
                  />
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <FaUserCheck className="text-green-600 text-2xl" />
                      <div>
                        <p className="font-semibold text-green-800">
                          {locale === 'am' ? 'ነዋሪነት ተረጋግጧል' : 'Residency Verified'}
                        </p>
                        <p className="text-sm text-green-700">
                          {selectedRequester?.fname} {selectedRequester?.lname} - {selectedRequester?.house_id}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          {requesterType === 'mother' 
                            ? (locale === 'am' ? 'እንደ እናት ተመዝግቧል' : 'Registered as Mother')
                            : (locale === 'am' ? 'እንደ አባት ተመዝግቧል' : 'Registered as Father')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSearchResident(true)}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        {locale === 'am' ? 'ቀይር' : 'Change'}
                      </button>
                      <button
                        onClick={() => setStep(2)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        {locale === 'am' ? 'ቀጥል' : 'Continue'} →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Enter Child Information */}
            {step === 2 && (
              <>
                {/* Progress Indicator */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">✓</div>
                    <span className="text-sm text-gray-600">{locale === 'am' ? 'ነዋሪነት ተረጋግጧል' : 'Residency Verified'}</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-green-200 mx-2"></div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                    <span className="text-sm font-semibold text-blue-600">{locale === 'am' ? 'የልጅ መረጃ' : 'Child Information'}</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Child Information */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                      <FaBaby className="text-blue-600" />
                      {locale === 'am' ? 'የልጁ መረጃ' : 'Child Information'}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {locale === 'am' ? 'ስም' : 'First Name'} *
                        </label>
                        <input
                          type="text"
                          value={formData.child_first_name}
                          onChange={(e) => setFormData({...formData, child_first_name: e.target.value})}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {locale === 'am' ? 'ስም (አማርኛ)' : 'First Name (Amharic)'}
                        </label>
                        <input
                          type="text"
                          value={formData.child_first_name_am}
                          onChange={(e) => setFormData({...formData, child_first_name_am: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg font-ethiopian"
                          placeholder="ስም በአማርኛ"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {locale === 'am' ? 'የአባት ስም' : "Father's Name"} *
                        </label>
                        <input
                          type="text"
                          value={formData.child_father_name}
                          onChange={(e) => setFormData({...formData, child_father_name: e.target.value})}
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
                          value={formData.child_father_name_am}
                          onChange={(e) => setFormData({...formData, child_father_name_am: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg font-ethiopian"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {locale === 'am' ? 'የአያት ስም' : "Grandfather's Name"} *
                        </label>
                        <input
                          type="text"
                          value={formData.child_grandfather_name}
                          onChange={(e) => setFormData({...formData, child_grandfather_name: e.target.value})}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {locale === 'am' ? 'ጾታ' : 'Sex'} *
                        </label>
                        <select
                          value={formData.sex}
                          onChange={(e) => setFormData({...formData, sex: e.target.value})}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">{locale === 'am' ? 'ይምረጡ' : 'Select'}</option>
                          <option value="Male">{locale === 'am' ? 'ወንድ' : 'Male'} ♂</option>
                          <option value="Female">{locale === 'am' ? 'ሴት' : 'Female'} ♀</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Birth Information with Dual Calendar */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                      <FaCalendarAlt className="text-green-600" />
                      {locale === 'am' ? 'የትውልድ መረጃ' : 'Birth Information'}
                    </h2>
                    
                    {/* Calendar Mode Toggle */}
                    <div className="flex gap-2 mb-4">
                      <button
                        type="button"
                        onClick={() => setBirthCalendarMode('gc')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          birthCalendarMode === 'gc' 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        📅 {locale === 'am' ? 'ጎርጎርያን' : 'Gregorian'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setBirthCalendarMode('ec')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          birthCalendarMode === 'ec' 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        📅 {locale === 'am' ? 'ኢትዮጵያ' : 'Ethiopian'}
                      </button>
                      <span className="text-xs text-gray-400 ml-auto">Today (EC): {currentEcDate.formattedDisplay.en}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {birthCalendarMode === 'gc' ? (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {locale === 'am' ? 'የትውልድ ቀን (ጎርጎርያን)' : 'Birth Date (Gregorian)'} *
                            </label>
                            <input
                              type="date"
                              value={formData.birth_date_gc}
                              onChange={(e) => handleBirthDateChange(e.target.value, 'gc')}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                              {locale === 'am' ? 'ቅርጸት: ዓመት-ወር-ቀን' : 'Format: Year-Month-Day'}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {locale === 'am' ? 'የትውልድ ቀን (ኢትዮጵያ)' : 'Birth Date (Ethiopian)'}
                            </label>
                            <input
                              type="text"
                              value={formData.birth_date_ec}
                              readOnly
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-ethiopian"
                              placeholder={locale === 'am' ? 'በራስ ይሞላል' : 'Auto-converted'}
                            />
                            <p className="text-xs text-blue-500 mt-1">
                              🔄 {locale === 'am' ? 'ከጎርጎርያን ቀን በራስ ይቀየራል' : 'Auto-converted from Gregorian date'}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {locale === 'am' ? 'የትውልድ ቀን (ኢትዮጵያ)' : 'Birth Date (Ethiopian)'} *
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <input
                                  type="number"
                                  placeholder={locale === 'am' ? 'ዓመት' : 'Year'}
                                  value={birthEcParts[0] || ''}
                                  onChange={(e) => handleEthiopianDateChange(e.target.value, birthEcParts[1], birthEcParts[2])}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                              </div>
                              <div>
                                <select
                                  value={birthEcParts[1] || ''}
                                  onChange={(e) => handleEthiopianDateChange(birthEcParts[0], e.target.value, birthEcParts[2])}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                  <option value="">{locale === 'am' ? 'ወር' : 'Month'}</option>
                                  {ETHIOPIAN_MONTHS.map(month => (
                                    <option key={month.value} value={month.value}>
                                      {locale === 'am' ? month.nameAm : month.nameEn}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <input
                                  type="number"
                                  placeholder={locale === 'am' ? 'ቀን' : 'Day'}
                                  min="1"
                                  max="30"
                                  value={birthEcParts[2] || ''}
                                  onChange={(e) => handleEthiopianDateChange(birthEcParts[0], birthEcParts[1], e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                              </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {locale === 'am' ? 'ቅርጸት: ዓመት-ወር-ቀን (ለምሳሌ: 2016-04-12)' : 'Format: Year-Month-Day (e.g., 2016-04-12)'}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {locale === 'am' ? 'የትውልድ ቀን (ጎርጎርያን)' : 'Birth Date (Gregorian)'}
                            </label>
                            <input
                              type="text"
                              value={formData.birth_date_gc}
                              readOnly
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                              placeholder={locale === 'am' ? 'በራስ ይሞላል' : 'Auto-converted'}
                            />
                            <p className="text-xs text-blue-500 mt-1">
                              🔄 {locale === 'am' ? 'ከኢትዮጵያ ቀን በራስ ይቀየራል' : 'Auto-converted from Ethiopian date'}
                            </p>
                          </div>
                        </>
                      )}
                      
                      <div className="md:col-span-2 mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {locale === 'am' ? 'የትውልድ ቦታ' : 'Place of Birth'} *
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <input
                            type="text"
                            value={formData.region}
                            onChange={(e) => setFormData({...formData, region: e.target.value})}
                            placeholder={locale === 'am' ? 'ክልል' : 'Region'}
                            className="px-3 py-2 border border-gray-300 rounded-lg"
                          />
                          <input
                            type="text"
                            value={formData.zone}
                            onChange={(e) => setFormData({...formData, zone: e.target.value})}
                            placeholder={locale === 'am' ? 'ዞን' : 'Zone'}
                            className="px-3 py-2 border border-gray-300 rounded-lg"
                          />
                          <input
                            type="text"
                            value={formData.woreda}
                            onChange={(e) => setFormData({...formData, woreda: e.target.value})}
                            placeholder={locale === 'am' ? 'ወረዳ' : 'Woreda'}
                            className="px-3 py-2 border border-gray-300 rounded-lg"
                          />
                          <input
                            type="text"
                            value={formData.birth_place}
                            onChange={(e) => setFormData({...formData, birth_place: e.target.value})}
                            placeholder={locale === 'am' ? 'ከተማ/ቀበሌ' : 'City/Kebele'}
                            className="px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Calendar Info Box */}
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-blue-600" />
                        <span className="text-sm text-blue-800">
                          {locale === 'am' 
                            ? 'ማስታወሻ: ቀንን በጎርጎርያን ወይም በኢትዮጵያ ቀን መቁጠሪያ መዝግበው ሌላኛው በራስ ይሞላል' 
                            : 'Note: Enter date in either Gregorian or Ethiopian calendar - the other will auto-convert'}
                        </span>
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        📅 {locale === 'am' ? 'የኢትዮጵያ ዓመት ከጎርጎርያን 7-8 ዓመታት ይቀንሳል' : 'Ethiopian year is 7-8 years behind Gregorian'}
                      </div>
                    </div>
                  </div>

                  {/* Parents Information */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                      <FaUsers className="text-purple-600" />
                      {locale === 'am' ? 'የወላጆች መረጃ' : 'Parents Information'}
                    </h2>
                    
                    {/* Verified Requester Info */}
                    <div className="bg-blue-50 rounded-lg p-3 mb-4">
                      <p className="text-sm font-medium text-blue-800">
                        {requesterType === 'mother' 
                          ? (locale === 'am' ? 'የተረጋገጠ እናት' : 'Verified Mother')
                          : (locale === 'am' ? 'የተረጋገጠ አባት' : 'Verified Father')}
                      </p>
                      <p className="text-sm">{selectedRequester?.fname} {selectedRequester?.lname}</p>
                    </div>

                    {/* Other Parent Search */}
                    {requesterType === 'mother' ? (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {locale === 'am' ? 'የአባት መረጃ (ካለ)' : "Father's Information (if available)"}
                        </label>
                        <ResidentSearch
                          onSelect={handleSelectFather}
                          selectedResident={formData.father_id ? { resident_id: formData.father_id, fname: formData.father_full_name?.split(' ')[0], lname: formData.father_full_name?.split(' ')[1] } : null}
                          onClear={() => {
                            setFormData(prev => ({
                              ...prev,
                              father_full_name: '',
                              father_full_name_am: '',
                              father_id: ''
                            }));
                          }}
                        />
                      </div>
                    ) : (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {locale === 'am' ? 'የእናት መረጃ (ካለ)' : "Mother's Information (if available)"}
                        </label>
                        <ResidentSearch
                          onSelect={handleSelectMother}
                          selectedResident={formData.mother_id ? { resident_id: formData.mother_id, fname: formData.mother_full_name?.split(' ')[0], lname: formData.mother_full_name?.split(' ')[1] } : null}
                          onClear={() => {
                            setFormData(prev => ({
                              ...prev,
                              mother_full_name: '',
                              mother_full_name_am: '',
                              mother_id: ''
                            }));
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Registration Information */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200">
                    <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <FaPrint className="text-gray-600" />
                      {locale === 'am' ? 'የምዝገባ መረጃ' : 'Registration Information'}
                    </h2>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {locale === 'am' ? 'የሚዘግብ ሰው ስም' : 'Civil Registrar Name'} *
                      </label>
                      <input
                        type="text"
                        value={formData.registrar_name}
                        onChange={(e) => setFormData({...formData, registrar_name: e.target.value})}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder={locale === 'am' ? 'ስም ያስገቡ' : 'Enter your name'}
                      />
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition"
                    >
                      ← {locale === 'am' ? 'ተመለስ' : 'Back'}
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center gap-2 disabled:opacity-50"
                    >
                      {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                      {loading ? (locale === 'am' ? 'በመዘጋጀት ላይ...' : 'Processing...') : (locale === 'am' ? 'ምስክር ወረቀት አውጣ' : 'Issue Certificate')}
                    </button>
                  </div>
                </form>
              </>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaCheckCircle className="text-green-600 text-xl" />
                <div>
                  <p className="font-semibold text-green-800">
                    {locale === 'am' ? 'ምስክር ወረቀቱ በተሳካ ሁኔታ ተዘጋጅቷል' : 'Certificate generated successfully!'}
                  </p>
                  <p className="text-sm text-green-700">
                    {locale === 'am' ? 'ማተም ለመጀመር ከታች ያለውን ቁልፍ ይጫኑ' : 'Click the print button below to print the certificate'}
                  </p>
                </div>
              </div>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
              >
                <FaPrint /> {locale === 'am' ? 'አትም' : 'Print'}
              </button>
            </div>
            <button
              onClick={handleNew}
              className="text-blue-600 hover:text-blue-700"
            >
              ← {locale === 'am' ? 'አዲስ ምዝገባ' : 'Register Another'}
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default withAuth(BirthCertificatePage, ['Record Officer']);
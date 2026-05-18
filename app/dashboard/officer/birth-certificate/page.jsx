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
  FaVenusMars, FaMars, FaUserCheck, FaUsers,
  FaLanguage, FaExchangeAlt, FaUserPlus, FaExclamationTriangle,
  FaBuilding, FaHome, FaGlobe
} from 'react-icons/fa';
import { gregorianToEthiopian, getCurrentEthiopianDate } from '@/utils/calendar';

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
  const [showFatherAmharicInput, setShowFatherAmharicInput] = useState(false);
  const [showMotherAmharicInput, setShowMotherAmharicInput] = useState(false);
  const [fatherNotFound, setFatherNotFound] = useState(false);
  const [motherNotFound, setMotherNotFound] = useState(false);
  
  const [formData, setFormData] = useState({
    // Child Information
    child_first_name: '',
    child_first_name_am: '',
    child_father_name: '',
    child_father_name_am: '',
    child_grandfather_name: '',
    child_grandfather_name_am: '',
    sex: '',
    birth_date_gc: '',
    birth_date_ec: '',
    nationality: 'Ethiopian',
    // Place of Birth - Full Address Hierarchy
    birth_place: '',
    birth_place_am: '',
    region: '',
    region_am: '',
    zone: '',
    woreda: '',
    sub_city: '',
    sub_city_am: '',
    kebele: '',
    // Form Details
    form_number: '',
    // Mother Information
    mother_full_name: '',
    mother_full_name_am: '',
    mother_nationality: 'Ethiopian',
    mother_id: '',
    mother_not_found: false,
    mother_manual_name: '',
    mother_manual_name_am: '',
    mother_manual_id: '',
    // Father Information
    father_full_name: '',
    father_full_name_am: '',
    father_nationality: 'Ethiopian',
    father_id: '',
    father_not_found: false,
    father_manual_name: '',
    father_manual_name_am: '',
    father_manual_id: '',
    // Registrar Information
    registrar_name: '',
    registrar_father_name: '',
    registrar_grandfather_name: '',
    registrar_km: '',
    issue_date: ''
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
    
    // Build full name including all name parts
    const firstName = resident.fname || '';
    const middleName = resident.mname || '';
    const lastName = resident.lname || '';
    const grandfatherName = resident.grandfather_name || '';
    
    // Build English full name
    const fullNameEn = [firstName, middleName, lastName, grandfatherName].filter(Boolean).join(' ');
    
    // Build Amharic full name
    const fullNameAm = [
      resident.fname_am, 
      resident.mname_am, 
      resident.lname_am, 
      resident.grandfather_name_am
    ].filter(Boolean).join(' ');
    
    // Check if the name is in Amharic (contains Ethiopic Unicode range)
    const isAmharicName = /[\u1200-\u137F]/.test(fullNameEn);
    
    if (type === 'mother') {
      setFormData(prev => ({
        ...prev,
        mother_full_name: isAmharicName ? fullNameAm : fullNameEn,
        mother_full_name_am: isAmharicName ? fullNameEn : fullNameAm,
        mother_id: resident.resident_id,
        mother_not_found: false,
        mother_manual_name: '',
        mother_manual_name_am: '',
        mother_manual_id: ''
      }));
      setShowMotherAmharicInput(!isAmharicName);
      setMotherNotFound(false);
    } else {
      setFormData(prev => ({
        ...prev,
        father_full_name: isAmharicName ? fullNameAm : fullNameEn,
        father_full_name_am: isAmharicName ? fullNameEn : fullNameAm,
        father_id: resident.resident_id,
        father_not_found: false,
        father_manual_name: '',
        father_manual_name_am: '',
        father_manual_id: ''
      }));
      setShowFatherAmharicInput(!isAmharicName);
      setFatherNotFound(false);
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
    setShowFatherAmharicInput(false);
    setShowMotherAmharicInput(false);
    setFatherNotFound(false);
    setMotherNotFound(false);
  };

  const handleSelectMother = (resident) => {
    if (!resident) {
      setMotherNotFound(true);
      setFormData(prev => ({
        ...prev,
        mother_id: '',
        mother_full_name: '',
        mother_full_name_am: '',
        mother_not_found: true
      }));
      return;
    }
    
    const isAmharic = (str) => {
      return str && /[\u1200-\u137F]/.test(str);
    };
    
    const firstName = resident.fname || '';
    const lastName = resident.lname || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const fullNameAm = resident.fname_am && resident.lname_am ? `${resident.fname_am} ${resident.lname_am}` : '';
    
    setFormData(prev => ({
      ...prev,
      mother_full_name: isAmharic(fullName) ? '' : fullName,
      mother_full_name_am: isAmharic(fullName) ? fullName : (fullNameAm || ''),
      mother_id: resident.resident_id,
      mother_not_found: false,
      mother_manual_name: '',
      mother_manual_name_am: '',
      mother_manual_id: ''
    }));
    setShowMotherAmharicInput(!isAmharic(fullName));
    setMotherNotFound(false);
  };

  const handleSelectFather = (resident) => {
    if (!resident) {
      setFatherNotFound(true);
      setFormData(prev => ({
        ...prev,
        father_id: '',
        father_full_name: '',
        father_full_name_am: '',
        father_not_found: true
      }));
      return;
    }
    
    const isAmharic = (str) => {
      return str && /[\u1200-\u137F]/.test(str);
    };
    
    const firstName = resident.fname || '';
    const lastName = resident.lname || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const fullNameAm = resident.fname_am && resident.lname_am ? `${resident.fname_am} ${resident.lname_am}` : '';
    
    setFormData(prev => ({
      ...prev,
      father_full_name: isAmharic(fullName) ? '' : fullName,
      father_full_name_am: isAmharic(fullName) ? fullName : (fullNameAm || ''),
      father_id: resident.resident_id,
      father_not_found: false,
      father_manual_name: '',
      father_manual_name_am: '',
      father_manual_id: ''
    }));
    setShowFatherAmharicInput(!isAmharic(fullName));
    setFatherNotFound(false);
  };

  const toggleMotherNotFound = () => {
    const newState = !motherNotFound;
    setMotherNotFound(newState);
    setFormData(prev => ({
      ...prev,
      mother_not_found: newState,
      mother_id: newState ? null : prev.mother_id,
    }));
    if (!newState) {
      setFormData(prev => ({
        ...prev,
        mother_manual_name: '',
        mother_manual_name_am: '',
        mother_manual_id: ''
      }));
    }
  };

  const toggleFatherNotFound = () => {
    const newState = !fatherNotFound;
    setFatherNotFound(newState);
    setFormData(prev => ({
      ...prev,
      father_not_found: newState,
      father_id: newState ? null : prev.father_id,
    }));
    if (!newState) {
      setFormData(prev => ({
        ...prev,
        father_manual_name: '',
        father_manual_name_am: '',
        father_manual_id: ''
      }));
    }
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
    
    // Prepare parent names
    let motherName = '';
    let motherNameAm = '';
    let fatherName = '';
    let fatherNameAm = '';
    
    const isMotherNotFound = motherNotFound || formData.mother_not_found;
    const isFatherNotFound = fatherNotFound || formData.father_not_found;
    
    if (isMotherNotFound) {
      motherName = formData.mother_manual_name?.trim();
      motherNameAm = formData.mother_manual_name_am?.trim();
      if (!motherName) {
        setError(locale === 'am' ? 'የእናት ስም ያስፈልጋል (በእጅ ያስገቡ)' : "Mother's name is required (manual entry)");
        return;
      }
    } else {
      motherName = formData.mother_full_name?.trim();
      motherNameAm = formData.mother_full_name_am?.trim();
    }
    
    if (isFatherNotFound) {
      fatherName = formData.father_manual_name?.trim();
      fatherNameAm = formData.father_manual_name_am?.trim();
      if (!fatherName) {
        setError(locale === 'am' ? 'የአባት ስም ያስፈልጋል (በእጅ ያስገቡ)' : "Father's name is required (manual entry)");
        return;
      }
    } else {
      fatherName = formData.father_full_name?.trim();
      fatherNameAm = formData.father_full_name_am?.trim();
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const requestBody = {
        // Child Information
        child_first_name: formData.child_first_name,
        child_first_name_am: formData.child_first_name_am,
        child_father_name: formData.child_father_name,
        child_father_name_am: formData.child_father_name_am,
        child_grandfather_name: formData.child_grandfather_name,
        child_grandfather_name_am: formData.child_grandfather_name_am,
        sex: formData.sex,
        birth_date_gc: formData.birth_date_gc,
        birth_date_ec: formData.birth_date_ec,
        nationality: formData.nationality,
        // Place of Birth
        birth_place: formData.birth_place,
        birth_place_am: formData.birth_place_am,
        region: formData.region,
        region_am: formData.region_am,
        zone: formData.zone,
        woreda: formData.woreda,
        sub_city: formData.sub_city,
        sub_city_am: formData.sub_city_am,
        kebele: formData.kebele,
        // Form Details
        form_number: formData.form_number,
        // Mother Data
        mother_full_name: motherName,
        mother_full_name_am: motherNameAm,
        mother_nationality: formData.mother_nationality,
        mother_id: isMotherNotFound ? null : formData.mother_id,
        mother_not_found: isMotherNotFound,
        mother_manual_name: isMotherNotFound ? formData.mother_manual_name : null,
        mother_manual_name_am: isMotherNotFound ? formData.mother_manual_name_am : null,
        mother_manual_id: isMotherNotFound ? formData.mother_manual_id : null,
        // Father Data
        father_full_name: fatherName,
        father_full_name_am: fatherNameAm,
        father_nationality: formData.father_nationality,
        father_id: isFatherNotFound ? null : formData.father_id,
        father_not_found: isFatherNotFound,
        father_manual_name: isFatherNotFound ? formData.father_manual_name : null,
        father_manual_name_am: isFatherNotFound ? formData.father_manual_name_am : null,
        father_manual_id: isFatherNotFound ? formData.father_manual_id : null,
        // Registrar Information
        registrar_name: formData.registrar_name,
        registrar_father_name: formData.registrar_father_name,
        registrar_grandfather_name: formData.registrar_grandfather_name,
        registrar_km: formData.registrar_km,
        issue_date: formData.issue_date || new Date().toISOString().split('T')[0],
        verified_resident_id: verifiedResident?.resident_id,
        requester_type: requesterType
      };
      
      console.log('Sending request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch('/api/certificates/birth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
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
    setShowFatherAmharicInput(false);
    setShowMotherAmharicInput(false);
    setFatherNotFound(false);
    setMotherNotFound(false);
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
      birth_place_am: '',
      region: '',
      region_am: '',
      zone: '',
      woreda: '',
      sub_city: '',
      sub_city_am: '',
      kebele: '',
      nationality: 'Ethiopian',
      form_number: '',
      mother_full_name: '',
      mother_full_name_am: '',
      mother_nationality: 'Ethiopian',
      mother_id: '',
      mother_not_found: false,
      mother_manual_name: '',
      mother_manual_name_am: '',
      mother_manual_id: '',
      father_full_name: '',
      father_full_name_am: '',
      father_nationality: 'Ethiopian',
      father_id: '',
      father_not_found: false,
      father_manual_name: '',
      father_manual_name_am: '',
      father_manual_id: '',
      registrar_name: '',
      registrar_father_name: '',
      registrar_grandfather_name: '',
      registrar_km: '',
      issue_date: ''
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
                          {locale === 'am' ? 'የአያት ስም (አማርኛ)' : "Grandfather's Name (Amharic)"}
                        </label>
                        <input
                          type="text"
                          value={formData.child_grandfather_name_am}
                          onChange={(e) => setFormData({...formData, child_grandfather_name_am: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg font-ethiopian"
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

                  {/* Place of Birth - Full Address Hierarchy */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                      <FaMapMarkerAlt className="text-red-600" />
                      {locale === 'am' ? 'የትውልድ ቦታ' : 'Place of Birth'}
                    </h2>
                    
                    <div className="space-y-4">
                      {/* Region - Dual Language */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {locale === 'am' ? 'ክልል / Region' : 'Region / ክልል'} *
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="relative">
                            <input
                              type="text"
                              value={formData.region}
                              onChange={(e) => setFormData({...formData, region: e.target.value})}
                              placeholder={locale === 'am' ? 'ክልል (እንግሊዝኛ)' : 'Region (English)'}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10"
                            />
                            <FaGlobe className="absolute right-3 top-3 text-gray-400" />
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              value={formData.region_am}
                              onChange={(e) => setFormData({...formData, region_am: e.target.value})}
                              placeholder={locale === 'am' ? 'ክልል (አማርኛ)' : 'Region (Amharic)'}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10 font-ethiopian"
                            />
                            <FaLanguage className="absolute right-3 top-3 text-gray-400" />
                          </div>
                        </div>
                      </div>

                      {/* Zone - Number */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {locale === 'am' ? 'ዞን ቁጥር / Zone Number' : 'Zone Number / ዞን ቁጥር'}
                        </label>
                        <input
                          type="text"
                          value={formData.zone}
                          onChange={(e) => setFormData({...formData, zone: e.target.value})}
                          placeholder={locale === 'am' ? 'ምሳሌ: 1, 2, 3' : 'Example: 1, 2, 3'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>

                      {/* Woreda - Number */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {locale === 'am' ? 'ወረዳ ቁጥር / Woreda Number' : 'Woreda Number / ወረዳ ቁጥር'}
                        </label>
                        <input
                          type="text"
                          value={formData.woreda}
                          onChange={(e) => setFormData({...formData, woreda: e.target.value})}
                          placeholder={locale === 'am' ? 'ምሳሌ: 01, 02, 03' : 'Example: 01, 02, 03'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>

                      {/* Sub-City - Dual Language */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {locale === 'am' ? 'ክፍለ ከተማ / Sub-City' : 'Sub-City / ክፍለ ከተማ'}
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="relative">
                            <input
                              type="text"
                              value={formData.sub_city}
                              onChange={(e) => setFormData({...formData, sub_city: e.target.value})}
                              placeholder={locale === 'am' ? 'ክፍለ ከተማ (እንግሊዝኛ)' : 'Sub-City (English)'}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10"
                            />
                            <FaBuilding className="absolute right-3 top-3 text-gray-400" />
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              value={formData.sub_city_am}
                              onChange={(e) => setFormData({...formData, sub_city_am: e.target.value})}
                              placeholder={locale === 'am' ? 'ክፍለ ከተማ (አማርኛ)' : 'Sub-City (Amharic)'}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10 font-ethiopian"
                            />
                            <FaLanguage className="absolute right-3 top-3 text-gray-400" />
                          </div>
                        </div>
                      </div>

                      {/* Kebele/City - Dual Language */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {locale === 'am' ? 'ቀበሌ / ከተማ' : 'Kebele / City'} *
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="relative">
                            <input
                              type="text"
                              value={formData.birth_place}
                              onChange={(e) => setFormData({...formData, birth_place: e.target.value})}
                              placeholder={locale === 'am' ? 'ቀበሌ/ከተማ (እንግሊዝኛ)' : 'Kebele/City (English)'}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10"
                            />
                            <FaHome className="absolute right-3 top-3 text-gray-400" />
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              value={formData.birth_place_am}
                              onChange={(e) => setFormData({...formData, birth_place_am: e.target.value})}
                              placeholder={locale === 'am' ? 'ቀበሌ/ከተማ (አማርኛ)' : 'Kebele/City (Amharic)'}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10 font-ethiopian"
                            />
                            <FaLanguage className="absolute right-3 top-3 text-gray-400" />
                          </div>
                        </div>
                      </div>

                      {/* Kebele field for the certificate */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {locale === 'am' ? 'ቀበሌ (ለምስክር ወረቀት)' : 'Kebele (for certificate)'}
                        </label>
                        <input
                          type="text"
                          value={formData.kebele}
                          onChange={(e) => setFormData({...formData, kebele: e.target.value})}
                          placeholder={locale === 'am' ? 'ቀበሌ ስም/ቁጥር' : 'Kebele name/number'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
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
                      
                      {/* Dual Language Input for Verified Parent */}
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <p className="text-xs text-blue-700 mb-2">
                          {locale === 'am' 
                            ? 'የወላጁን ሙሉ ስም በሌላ ቋንቋ ያስገቡ (ካለ)' 
                            : 'Enter parent\'s full name in other language (if available)'}
                        </p>
                        <div className="relative">
                          <input
                            type="text"
                            value={requesterType === 'mother' ? formData.mother_full_name_am : formData.father_full_name_am}
                            onChange={(e) => {
                              if (requesterType === 'mother') {
                                setFormData({...formData, mother_full_name_am: e.target.value});
                              } else {
                                setFormData({...formData, father_full_name_am: e.target.value});
                              }
                            }}
                            placeholder={
                              requesterType === 'mother'
                                ? (locale === 'am' ? 'የእናት ስም በአማርኛ' : 'Mother\'s name in Amharic')
                                : (locale === 'am' ? 'የአባት ስም በአማርኛ' : 'Father\'s name in Amharic')
                            }
                            className="w-full px-3 py-2 border border-blue-300 rounded-lg font-ethiopian"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Other Parent Section */}
                    {requesterType === 'mother' ? (
                      <div className="mt-4 space-y-3">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              {locale === 'am' ? 'የአባት መረጃ' : "Father's Information"}
                            </label>
                            <button
                              type="button"
                              onClick={toggleFatherNotFound}
                              className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
                            >
                              {fatherNotFound ? (
                                <>🔍 {locale === 'am' ? 'ነዋሪ ፈልግ' : 'Search Resident'}</>
                              ) : (
                                <><FaExclamationTriangle className="text-xs" /> {locale === 'am' ? 'አልተገኘም?' : 'Not found?'}</>
                              )}
                            </button>
                          </div>
                          
                          {!fatherNotFound ? (
                            <>
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
                                  setShowFatherAmharicInput(false);
                                }}
                              />
                              {formData.father_full_name && !fatherNotFound && (
                                <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                  <div className="flex items-center gap-2 mb-2">
                                    <FaLanguage className="text-amber-600" />
                                    <label className="text-sm font-medium text-amber-800">
                                      {locale === 'am' ? 'የአባት ስም በአማርኛ' : "Father's Name in Amharic"}
                                    </label>
                                  </div>
                                  <input
                                    type="text"
                                    value={formData.father_full_name_am}
                                    onChange={(e) => setFormData({...formData, father_full_name_am: e.target.value})}
                                    placeholder={locale === 'am' ? 'ስም በአማርኛ ያስገቡ' : 'Enter name in Amharic'}
                                    className="w-full px-3 py-2 border border-amber-300 rounded-lg font-ethiopian"
                                  />
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="space-y-3">
                              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <FaUserPlus className="text-orange-600" />
                                  <span className="text-sm font-medium text-orange-800">
                                    {locale === 'am' ? 'በእጅ የአባት መረጃ ማስገቢያ' : 'Manual Father Information Entry'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      {locale === 'am' ? 'ሙሉ ስም (እንግሊዝኛ)' : 'Full Name (English)'} *
                                    </label>
                                    <input
                                      type="text"
                                      value={formData.father_manual_name}
                                      onChange={(e) => setFormData({...formData, father_manual_name: e.target.value})}
                                      className="w-full px-3 py-2 border border-orange-300 rounded-lg"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      {locale === 'am' ? 'ሙሉ ስም (አማርኛ)' : 'Full Name (Amharic)'}
                                    </label>
                                    <input
                                      type="text"
                                      value={formData.father_manual_name_am}
                                      onChange={(e) => setFormData({...formData, father_manual_name_am: e.target.value})}
                                      className="w-full px-3 py-2 border border-orange-300 rounded-lg font-ethiopian"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              {locale === 'am' ? 'የእናት መረጃ' : "Mother's Information"}
                            </label>
                            <button
                              type="button"
                              onClick={toggleMotherNotFound}
                              className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
                            >
                              {motherNotFound ? (
                                <>🔍 {locale === 'am' ? 'ነዋሪ ፈልግ' : 'Search Resident'}</>
                              ) : (
                                <><FaExclamationTriangle className="text-xs" /> {locale === 'am' ? 'አልተገኘም?' : 'Not found?'}</>
                              )}
                            </button>
                          </div>
                          
                          {!motherNotFound ? (
                            <>
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
                                  setShowMotherAmharicInput(false);
                                }}
                              />
                              {formData.mother_full_name && !motherNotFound && (
                                <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                  <div className="flex items-center gap-2 mb-2">
                                    <FaLanguage className="text-amber-600" />
                                    <label className="text-sm font-medium text-amber-800">
                                      {locale === 'am' ? 'የእናት ስም በአማርኛ' : "Mother's Name in Amharic"}
                                    </label>
                                  </div>
                                  <input
                                    type="text"
                                    value={formData.mother_full_name_am}
                                    onChange={(e) => setFormData({...formData, mother_full_name_am: e.target.value})}
                                    placeholder={locale === 'am' ? 'ስም በአማርኛ ያስገቡ' : 'Enter name in Amharic'}
                                    className="w-full px-3 py-2 border border-amber-300 rounded-lg font-ethiopian"
                                  />
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="space-y-3">
                              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <FaUserPlus className="text-orange-600" />
                                  <span className="text-sm font-medium text-orange-800">
                                    {locale === 'am' ? 'በእጅ የእናት መረጃ ማስገቢያ' : 'Manual Mother Information Entry'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      {locale === 'am' ? 'ሙሉ ስም (እንግሊዝኛ)' : 'Full Name (English)'} *
                                    </label>
                                    <input
                                      type="text"
                                      value={formData.mother_manual_name}
                                      onChange={(e) => setFormData({...formData, mother_manual_name: e.target.value})}
                                      className="w-full px-3 py-2 border border-orange-300 rounded-lg"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      {locale === 'am' ? 'ሙሉ ስም (አማርኛ)' : 'Full Name (Amharic)'}
                                    </label>
                                    <input
                                      type="text"
                                      value={formData.mother_manual_name_am}
                                      onChange={(e) => setFormData({...formData, mother_manual_name_am: e.target.value})}
                                      className="w-full px-3 py-2 border border-orange-300 rounded-lg font-ethiopian"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Registration Information - Updated with Registrar Family Names */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200">
                    <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <FaPrint className="text-gray-600" />
                      {locale === 'am' ? 'የምዝገባ መረጃ' : 'Registration Information'}
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          {locale === 'am' ? 'የቅጽ ቁጥር' : 'Form Number'}
                        </label>
                        <input
                          type="text"
                          value={formData.form_number}
                          onChange={(e) => setFormData({...formData, form_number: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="e.g., 001/2026"
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
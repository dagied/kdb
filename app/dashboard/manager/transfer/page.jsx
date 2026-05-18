'use client';

import { withAuth } from '@/components/withAuth';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useTranslation } from '@/hooks/useTranslation';
import { 
  FaExchangeAlt, FaUser, FaHome, FaCheckCircle, 
  FaTimesCircle, FaSpinner, FaSave, FaPrint,
  FaPlus, FaTrash, FaUsers, FaFileAlt, FaSearch,
  FaBuilding, FaMapMarkerAlt, FaFileSignature, FaUpload,
  FaFilePdf, FaFileImage, FaInfoCircle, FaLanguage
} from 'react-icons/fa';
import ResidentSearch from '@/components/ResidentSearch';

function TransferPage() {
  const { t, locale } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedResident, setSelectedResident] = useState(null);
  const [searchResident, setSearchResident] = useState(true);
  const [transferType, setTransferType] = useState('FULL');
  const [familyMembers, setFamilyMembers] = useState([]);
  const [generatedCertificateNumber, setGeneratedCertificateNumber] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [regions, setRegions] = useState([]);
  const [departureLetterFile, setDepartureLetterFile] = useState(null);
  const [departureLetterPreview, setDepartureLetterPreview] = useState(null);
  const [showAmharicInput, setShowAmharicInput] = useState(false);
  
  const [formData, setFormData] = useState({
    resident_id: '',
    resident_name: '',
    resident_name_am: '',
    transfer_type: 'FULL',
    destination_kebele: '',
    destination_zone: '',
    destination_woreda: '',
    destination_sub_city: '',
    destination_kebele_name: '',
    destination_region: 'Oromia Region',
    reason: '',
    transfer_initiative: 'RESIDENT',
    tax_cleared: false,
    utility_bills_cleared: false,
    obligations_cleared: false,
    has_departure_letter: false,
    departure_letter_number: '',
    departure_letter_file: null
  });

  // Fetch regions on component mount
  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      const response = await fetch('/api/regions');
      const data = await response.json();
      if (data.success) {
        setRegions(data.regions);
      }
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  const getRegionName = (region) => {
    if (locale === 'am') return region.name_am;
    if (locale === 'om') return region.name_om;
    return region.name_en;
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        alert(locale === 'am' ? 'እባክዎ ፒዲኤፍ ወይም ምስል ፋይል ይምረጡ' : 'Please select a PDF or image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert(locale === 'am' ? 'የፋይል መጠን ከ5 ሜባ መብለጥ የለበትም' : 'File size must be less than 5MB');
        return;
      }
      
      setDepartureLetterFile(file);
      setFormData(prev => ({ ...prev, departure_letter_file: file }));
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setDepartureLetterPreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setDepartureLetterPreview('pdf');
      }
    }
  };

  const removeFile = () => {
    setDepartureLetterFile(null);
    setDepartureLetterPreview(null);
    setFormData(prev => ({ ...prev, departure_letter_file: null }));
  };

  const handleSelectResident = (resident) => {
    setSelectedResident(resident);
    
    // Build full name
    const firstName = resident.fname || '';
    const middleName = resident.mname || '';
    const lastName = resident.lname || '';
    const grandfatherName = resident.grandfather_name || '';
    const fullNameEn = [firstName, middleName, lastName, grandfatherName].filter(Boolean).join(' ');
    
    // Build Amharic full name
    const fullNameAm = [
      resident.fname_am, 
      resident.mname_am, 
      resident.lname_am, 
      resident.grandfather_name_am
    ].filter(Boolean).join(' ');
    
    // Check if name is in Amharic (contains Ethiopic Unicode range)
    const isAmharicName = /[\u1200-\u137F]/.test(fullNameEn);
    
    setFormData(prev => ({
      ...prev,
      resident_id: resident.resident_id,
      resident_name: isAmharicName ? fullNameAm : fullNameEn,
      resident_name_am: isAmharicName ? fullNameEn : fullNameAm
    }));
    
    // Show Amharic input if name is in English, show English input if name is in Amharic
    setShowAmharicInput(!isAmharicName);
    setSearchResident(false);
    
    // Fetch family members
    fetchFamilyMembers(resident.resident_id);
  };

  const fetchFamilyMembers = async (residentId) => {
    try {
      const response = await fetch(`/api/residents/family?resident_id=${residentId}`);
      const data = await response.json();
      if (data.success && data.family) {
        setFamilyMembers(data.family.map(member => ({
          ...member,
          is_transferring: false
        })));
      }
    } catch (error) {
      console.error('Error fetching family members:', error);
    }
  };

  const toggleFamilyMember = (memberId) => {
    setFamilyMembers(prev => prev.map(member => 
      member.resident_id === memberId 
        ? { ...member, is_transferring: !member.is_transferring }
        : member
    ));
  };

  const selectAllFamily = () => {
    setFamilyMembers(prev => prev.map(member => ({ ...member, is_transferring: true })));
  };

  const deselectAllFamily = () => {
    setFamilyMembers(prev => prev.map(member => ({ ...member, is_transferring: false })));
  };

  const generateTransferNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000);
    return `TRF-${year}-${String(random).padStart(4, '0')}`;
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    const transferNumber = generateTransferNumber();
    const transferringMembers = familyMembers.filter(m => m.is_transferring);
    
    const departureLetterBase64 = await convertToBase64(departureLetterFile);
    
    const submitData = {
      ...formData,
      transfer_number: transferNumber,
      transfer_type: transferType,
      family_members: transferType === 'PARTIAL' ? transferringMembers : [],
      departure_letter_file: departureLetterBase64
    };
    
    console.log('Submitting transfer data:', submitData);
    
    try {
      const response = await fetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(data.message || 'Transfer processed successfully!');
        setGeneratedCertificateNumber(data.certificate_number);
        setShowPreview(true);
      } else {
        setError(data.error || 'Failed to process transfer');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintCertificate = () => {
    if (generatedCertificateNumber) {
      window.open(`/api/certificates/print/${generatedCertificateNumber}?type=transfer`, '_blank');
    }
  };

  const handleNew = () => {
    setSelectedResident(null);
    setSearchResident(true);
    setTransferType('FULL');
    setFamilyMembers([]);
    setGeneratedCertificateNumber(null);
    setShowPreview(false);
    setSuccess(null);
    setError(null);
    setDepartureLetterFile(null);
    setDepartureLetterPreview(null);
    setShowAmharicInput(false);
    setFormData({
      resident_id: '',
      resident_name: '',
      resident_name_am: '',
      transfer_type: 'FULL',
      destination_kebele: '',
      destination_zone: '',
      destination_woreda: '',
      destination_sub_city: '',
      destination_kebele_name: '',
      destination_region: 'Oromia Region',
      reason: '',
      transfer_initiative: 'RESIDENT',
      tax_cleared: false,
      utility_bills_cleared: false,
      obligations_cleared: false,
      has_departure_letter: false,
      departure_letter_number: '',
      departure_letter_file: null
    });
  };

  const transferringCount = transferType === 'FULL' 
    ? familyMembers.length + 1 
    : 1 + familyMembers.filter(m => m.is_transferring).length;

  return (
    <Layout role="Kebele Manager">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;500;600;700&display=swap');
        .font-ethiopic {
          font-family: 'Noto Sans Ethiopic', 'Nyala', 'Abyssinica SIL', sans-serif;
        }
      `}</style>

      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaExchangeAlt className="text-blue-600" /> 
            {locale === 'am' ? 'የነዋሪ ማስተላለፊያ' : 'Resident Transfer'}
          </h1>
          <p className="text-gray-500 mt-1">
            {locale === 'am' ? 'ነዋሪዎችን ወደ ሌላ ቀበሌ ያስተላልፉ እና የማስተላለፊያ ሰርትፊኬት ያውጡ' : 'Transfer residents to another kebele and issue transfer certificate'}
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
                <FaSearch /> {searchResident ? (locale === 'am' ? 'ድበቅ' : 'Hide Search') : (locale === 'am' ? 'ነዋሪ ፈልግ' : 'Search Resident')}
              </button>
            </div>

            {/* Resident Search */}
            {searchResident && (
              <ResidentSearch
                onSelect={handleSelectResident}
                selectedResident={selectedResident}
                onClear={() => setSelectedResident(null)}
              />
            )}

            {/* Selected Resident Info with Dual Language */}
            {selectedResident && !searchResident && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-green-800">
                      {locale === 'am' ? 'የተመረጠ ነዋሪ' : 'Selected Resident'}
                    </p>
                    <p className="text-sm text-green-700">
                      {selectedResident.fname} {selectedResident.lname} - {locale === 'am' ? 'ቤት ቁጥር' : 'House'}: {selectedResident.house_id}
                    </p>
                  </div>
                  <button
                    onClick={() => setSearchResident(true)}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    {locale === 'am' ? 'ለውጥ' : 'Change'}
                  </button>
                </div>
                
                {/* Dual Language Input for Resident Name */}
                <div className="mt-3 pt-3 border-t border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FaLanguage className="text-green-600" />
                    <label className="text-sm font-medium text-green-800">
                      {showAmharicInput 
                        ? (locale === 'am' ? 'የነዋሪ ስም በአማርኛ' : "Resident's Name in Amharic")
                        : (locale === 'am' ? 'የነዋሪ ስም በእንግሊዝኛ' : "Resident's Name in English")}
                    </label>
                  </div>
                  <input
                    type="text"
                    value={showAmharicInput ? formData.resident_name_am : formData.resident_name}
                    onChange={(e) => {
                      if (showAmharicInput) {
                        setFormData({...formData, resident_name_am: e.target.value});
                      } else {
                        setFormData({...formData, resident_name: e.target.value});
                      }
                    }}
                    placeholder={
                      showAmharicInput 
                        ? (locale === 'am' ? 'ስም በአማርኛ ያስገቡ' : 'Enter name in Amharic')
                        : (locale === 'am' ? 'ስም በእንግሊዝኛ ያስገቡ' : 'Enter name in English')
                    }
                    className="w-full px-3 py-2 border border-green-300 rounded-lg font-ethiopic"
                  />
                  <p className="text-xs text-green-600 mt-1">
                    💡 {showAmharicInput 
                      ? (locale === 'am' 
                        ? 'የተመረጠው ነዋሪ በእንግሊዝኛ ተመዝግቧል። እባክዎ ስሙን በአማርኛ ይሙሉ' 
                        : 'The selected resident is registered in English. Please provide the name in Amharic.')
                      : (locale === 'am'
                        ? 'የተመረጠው ነዋሪ በአማርኛ ተመዝግቧል። እባክዎ ስሙን በእንግሊዝኛ ይሙሉ'
                        : 'The selected resident is registered in Amharic. Please provide the name in English.')}
                  </p>
                </div>
              </div>
            )}

            {selectedResident && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Transfer Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <FaInfoCircle className="text-blue-600" />
                    {locale === 'am' ? 'የማስተላለፊያ ማጠቃለያ' : 'Transfer Summary'}
                  </h3>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>
                      {locale === 'am' ? 'የሚተላለፉ ነዋሪዎች ብዛት' : 'Number of residents transferring'}: 
                      <strong className="ml-2">{transferringCount}</strong>
                    </p>
                    {transferType === 'FULL' && (
                      <p className="text-orange-600 mt-2">
                        ⚠️ {locale === 'am' 
                          ? 'ሙሉ ቤተሰብ ማስተላለፊያ: ቤቱ ባዶ ይሆናል እና ሁሉም ነዋሪዎች ከስርዓት ይወገዳሉ' 
                          : 'Full family transfer: The house will be vacated and all residents will be deactivated'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Transfer Type Selection */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                    <FaUsers className="text-blue-600" />
                    {locale === 'am' ? 'የማስተላለፊያ አይነት' : 'Transfer Type'}
                  </h2>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="FULL"
                        checked={transferType === 'FULL'}
                        onChange={(e) => setTransferType(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-700">
                        {locale === 'am' ? 'ሙሉ ማስተላለፊያ (ሙሉ ቤተሰብ)' : 'Full Transfer (Whole Family)'}
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="PARTIAL"
                        checked={transferType === 'PARTIAL'}
                        onChange={(e) => setTransferType(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-700">
                        {locale === 'am' ? 'ከፊል ማስተላለፊያ' : 'Partial Transfer'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Family Members Selection (for partial transfer) */}
                {transferType === 'PARTIAL' && familyMembers.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                        <FaUsers className="text-green-600" />
                        {locale === 'am' ? 'የቤተሰብ አባላት' : 'Family Members'}
                      </h2>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={selectAllFamily}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          {locale === 'am' ? 'ሁሉንም ምረጥ' : 'Select All'}
                        </button>
                        <button
                          type="button"
                          onClick={deselectAllFamily}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          {locale === 'am' ? 'ሁሉንም አራግጥ' : 'Deselect All'}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {familyMembers.map((member) => (
                        <label key={member.resident_id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={member.is_transferring}
                            onChange={() => toggleFamilyMember(member.resident_id)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <div>
                            <p className="font-medium text-gray-800">{member.name || `${member.fname} ${member.lname}`}</p>
                            <p className="text-xs text-gray-500">{member.relationship || (locale === 'am' ? 'የቤተሰብ አባል' : 'Family Member')}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clearance Information */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                    <FaFileSignature className="text-orange-600" />
                    {locale === 'am' ? 'የፍቃድ መረጃ' : 'Clearance Information'}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.tax_cleared}
                        onChange={(e) => setFormData({...formData, tax_cleared: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <span className="text-gray-700">{locale === 'am' ? 'ግብር ተከፍሏል' : 'Tax Cleared'}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.utility_bills_cleared}
                        onChange={(e) => setFormData({...formData, utility_bills_cleared: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <span className="text-gray-700">{locale === 'am' ? 'የፍጆታ ክፍያ ተከፍሏል' : 'Utility Bills Cleared'}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.obligations_cleared}
                        onChange={(e) => setFormData({...formData, obligations_cleared: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <span className="text-gray-700">{locale === 'am' ? 'ሌሎች ግዴታዎች ተፈጽመዋል' : 'Other Obligations Cleared'}</span>
                    </label>
                  </div>
                </div>

                {/* Departure Letter Upload */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                    <FaUpload className="text-purple-600" />
                    {locale === 'am' ? 'የመነሻ ደብዳቤ' : 'Departure Letter'}
                  </h2>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {!departureLetterPreview ? (
                      <div>
                        <FaFilePdf className="text-5xl text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 mb-2">
                          {locale === 'am' ? 'የመነሻ ደብዳቤ ፋይል ይምረጡ' : 'Upload departure letter file'}
                        </p>
                        <p className="text-xs text-gray-400 mb-4">
                          {locale === 'am' ? 'PDF, JPEG, PNG ቅርጸቶች ይደገፋሉ (ከፍተኛ መጠን: 5MB)' : 'Supported formats: PDF, JPEG, PNG (Max: 5MB)'}
                        </p>
                        <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2">
                          <FaUpload />
                          {locale === 'am' ? 'ፋይል ምረጥ' : 'Choose File'}
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="relative">
                        {departureLetterPreview === 'pdf' ? (
                          <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center gap-3">
                            <FaFilePdf className="text-red-500 text-4xl" />
                            <div>
                              <p className="font-medium text-gray-800">{departureLetterFile?.name}</p>
                              <p className="text-xs text-gray-500">
                                {(departureLetterFile?.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="relative inline-block">
                            <img src={departureLetterPreview} alt="Preview" className="max-h-40 rounded-lg border" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={removeFile}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {departureLetterFile && (
                    <div className="mt-3 flex items-center gap-2 text-green-600 text-sm">
                      <FaCheckCircle />
                      <span>{locale === 'am' ? 'ፋይል ተመርጧል' : 'File selected'}: {departureLetterFile.name}</span>
                    </div>
                  )}
                </div>

                {/* Destination Information */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                    <FaMapMarkerAlt className="text-red-600" />
                    {locale === 'am' ? 'መድረሻ መረጃ' : 'Destination Information'}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {locale === 'am' ? 'የመድረሻ ቀበሌ ስም' : 'Destination Kebele Name'} *
                      </label>
                      <input
                        type="text"
                        value={formData.destination_kebele}
                        onChange={(e) => setFormData({...formData, destination_kebele: e.target.value})}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder={locale === 'am' ? 'የቀበሌ ስም ያስገቡ' : 'Enter kebele name'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {locale === 'am' ? 'ዞን' : 'Zone'}
                      </label>
                      <input
                        type="text"
                        value={formData.destination_zone}
                        onChange={(e) => setFormData({...formData, destination_zone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder={locale === 'am' ? 'ዞን ቁጥር' : 'Zone number'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {locale === 'am' ? 'ወረዳ' : 'Woreda'}
                      </label>
                      <input
                        type="text"
                        value={formData.destination_woreda}
                        onChange={(e) => setFormData({...formData, destination_woreda: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder={locale === 'am' ? 'ወረዳ ቁጥር' : 'Woreda number'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {locale === 'am' ? 'ክፍለ ከተማ' : 'Sub-City'}
                      </label>
                      <input
                        type="text"
                        value={formData.destination_sub_city}
                        onChange={(e) => setFormData({...formData, destination_sub_city: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder={locale === 'am' ? 'ክፍለ ከተማ' : 'Sub-city'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {locale === 'am' ? 'ክልል' : 'Region'} *
                      </label>
                      <select
                        value={formData.destination_region}
                        onChange={(e) => setFormData({...formData, destination_region: e.target.value})}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        {regions.map((region) => (
                          <option key={region.region_id} value={region.name_en}>
                            {getRegionName(region)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Transfer Reason */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                    <FaFileAlt className="text-gray-600" />
                    {locale === 'am' ? 'የማስተላለፊያ ምክንያት' : 'Transfer Reason'}
                  </h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'ምክንያት' : 'Reason'}
                    </label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) => setFormData({...formData, reason: e.target.value})}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                      placeholder={locale === 'am' ? 'ለምን ማስተላለፍ እንደሚፈልጉ ይግለጹ' : 'Explain the reason for transfer'}
                    />
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'የማስተላለፊያ አስጀማሪ' : 'Transfer Initiative'}
                    </label>
                    <select
                      value={formData.transfer_initiative}
                      onChange={(e) => setFormData({...formData, transfer_initiative: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="RESIDENT">{locale === 'am' ? 'በነዋሪ' : 'By Resident'}</option>
                      <option value="ADMIN">{locale === 'am' ? 'በአስተዳደር' : 'By Administration'}</option>
                    </select>
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
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <FaSpinner className="animate-spin" /> : <FaExchangeAlt />}
                    {loading ? (locale === 'am' ? 'በሂደት ላይ...' : 'Processing...') : (locale === 'am' ? 'ማስተላለፊያ አስጀምር' : 'Process Transfer')}
                  </button>
                </div>
              </form>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <FaCheckCircle className="text-green-600 text-5xl mx-auto mb-4" />
              <h2 className="text-xl font-bold text-green-800 mb-2">
                {locale === 'am' ? 'ማስተላለፊያ በተሳካ ሁኔታ ተከናውኗል' : 'Transfer Processed Successfully!'}
              </h2>
              <p className="text-green-700 mb-4">
                {locale === 'am' ? 'የማስተላለፊያ ሰርትፊኬት ተዘጋጅቷል እና ለማተም ዝግጁ ነው' : 'The transfer certificate has been generated and is ready for printing'}
              </p>
              <div className="bg-white rounded-lg p-4 inline-block mx-auto">
                <p className="text-sm text-gray-500">
                  {locale === 'am' ? 'የማስረጃ ቁጥር' : 'Certificate Number'}
                </p>
                <p className="text-lg font-bold text-blue-600 font-mono">{generatedCertificateNumber}</p>
              </div>
              <div className="flex gap-3 justify-center mt-6">
                <button
                  onClick={handlePrintCertificate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <FaPrint /> {locale === 'am' ? 'ማስረጃ አትም' : 'Print Certificate'}
                </button>
                <button
                  onClick={handleNew}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  {locale === 'am' ? 'ሌላ ማስተላለፊያ' : 'Another Transfer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default withAuth(TransferPage, ['Kebele Manager']);
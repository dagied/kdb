'use client';

import { withAuth } from '@/components/withAuth';
import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { useTranslation } from '@/hooks/useTranslation';
import ResidentSearch from '@/components/ResidentSearch';
import { 
  FaIdCard, FaUser, FaCalendarAlt, FaMapMarkerAlt,
  FaPhone, FaHome, FaSave, FaSpinner, FaPrint,
  FaCheckCircle, FaTimesCircle, FaCamera, FaTrash,
  FaUpload, FaUserPlus, FaHeartbeat, FaPhoneAlt, FaLanguage
} from 'react-icons/fa';
import { gregorianToEthiopian, getCurrentEthiopianDate, ethiopianToGregorian } from '@/utils/calendar';

function GiveIDPage() {
  const { t, locale } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedId, setGeneratedId] = useState(null);
  const [error, setError] = useState(null);
  const [birthCalendar, setBirthCalendar] = useState('gc');
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [showAmharicInput, setShowAmharicInput] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [hasActiveId, setHasActiveId] = useState(false);
  const [existingIdNumber, setExistingIdNumber] = useState(null);
  const [checkingId, setCheckingId] = useState(false);
  
  const [formData, setFormData] = useState({
    resident_id: '',
    full_name: '',
    full_name_am: '',
    father_name: '',
    father_name_am: '',
    grandfather_name: '',
    grandfather_name_am: '',
    sex: '',
    birth_date_gc: '',
    birth_date_ec: '',
    place_of_birth: '',
    residence: '',
    house_number: '',
    phone: '',
    email: '',
    emergency_contact_name: '',
    emergency_relationship: '',
    emergency_phone: '',
    emergency_alt_phone: '',
    emergency_address: '',
    medical_notes: '',
    photo_url: '',
    issue_number: 1
  });

  // Fetch phone numbers for resident
  const fetchPhoneNumbers = async (residentId) => {
    try {
      const response = await fetch(`/api/residents/${residentId}/contacts`);
      const data = await response.json();
      if (data.success && data.phones && data.phones.length > 0) {
        setFormData(prev => ({ ...prev, phone: data.phones[0] }));
      }
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
    }
  };

  // Check if resident already has an active ID card
  const checkExistingIdCard = async (residentId) => {
    setCheckingId(true);
    try {
      const response = await fetch(`/api/id-card/check?resident_id=${residentId}`);
      const data = await response.json();
      if (data.has_active_id) {
        setHasActiveId(true);
        setExistingIdNumber(data.id_number);
        setError(`⚠️ This resident already has an active ID card: ${data.id_number}. Cannot issue another ID.`);
        return true;
      } else {
        setHasActiveId(false);
        setExistingIdNumber(null);
        setError(null);
        return false;
      }
    } catch (error) {
      console.error('Error checking ID status:', error);
      return false;
    } finally {
      setCheckingId(false);
    }
  };

  // Compress photo to reduce size
  const compressPhoto = (dataUrl, maxWidth = 200, quality = 0.6) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.src = dataUrl;
    });
  };

  const dataUrlToBlob = (dataUrl) => {
    const [header, base64] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)[1];
    const binary = atob(base64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      array[i] = binary.charCodeAt(i);
    }
    return new Blob([array], { type: mime });
  };

  const uploadPhotoFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Photo upload failed');
    }
    return data.url;
  };

  // Start camera
  const startCamera = async () => {
    setCameraError(null);
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Your browser does not support camera access. Please use file upload instead.');
      return;
    }
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setShowCamera(true);
    } catch (err) {
      console.error('Camera error:', err);
      
      if (err.name === 'NotFoundError') {
        setCameraError('No camera found on this device. Please use file upload instead.');
      } else if (err.name === 'NotAllowedError') {
        setCameraError('Camera permission denied. Please allow camera access and refresh, or use file upload.');
      } else if (err.name === 'NotReadableError') {
        setCameraError('Camera is already in use. Please close other applications using the camera.');
      } else {
        setCameraError('Unable to access camera. Please use file upload instead.');
      }
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
    setCameraError(null);
  };

  // Capture photo from camera
  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = 300;
      canvas.height = 225;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.7);
      const compressedPhoto = await compressPhoto(photoDataUrl, 150, 0.5);
      setCapturedPhoto(compressedPhoto);

      try {
        const blob = dataUrlToBlob(compressedPhoto);
        const uploadedUrl = await uploadPhotoFile(new File([blob], `capture-${Date.now()}.jpg`, { type: blob.type }));
        setFormData(prev => ({ ...prev, photo_url: uploadedUrl }));
      } catch (uploadError) {
        console.error('Photo upload failed:', uploadError);
        setCameraError('Unable to upload captured photo. Please try again.');
      }

      stopCamera();
    }
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size too large. Please select an image under 5MB.');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPEG, PNG, etc.)');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressedPhoto = await compressPhoto(reader.result, 150, 0.5);
        setCapturedPhoto(compressedPhoto);

        try {
          const blob = dataUrlToBlob(compressedPhoto);
          const uploadedUrl = await uploadPhotoFile(new File([blob], file.name, { type: blob.type }));
          setFormData(prev => ({ ...prev, photo_url: uploadedUrl }));
        } catch (uploadError) {
          console.error('Photo upload failed:', uploadError);
          alert('Unable to upload photo. Please try again.');
          setFormData(prev => ({ ...prev, photo_url: '' }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove photo
  const removePhoto = () => {
    setCapturedPhoto(null);
    setFormData(prev => ({ ...prev, photo_url: '' }));
  };

  const handleSelectResident = async (resident) => {
    setSelectedResident(resident);
    
    // First check if resident already has an active ID card
    const hasId = await checkExistingIdCard(resident.resident_id);
    
    if (hasId) {
      // Don't populate form data if they already have an ID
      return;
    }
    
    // Build English names
    const fullNameEn = `${resident.fname || ''} ${resident.lname || ''} ${resident.grandfather_name || ''}`.trim();
    const fatherNameEn = resident.lname || '';
    const grandfatherNameEn = resident.grandfather_name || '';
    
    // Build Amharic names from resident data if available
    const fullNameAm = resident.fname_am && resident.lname_am 
      ? `${resident.fname_am} ${resident.lname_am} ${resident.grandfather_name_am || ''}`.trim()
      : '';
    const fatherNameAm = resident.lname_am || '';
    const grandfatherNameAm = resident.grandfather_name_am || '';
    
    // Convert birth date to Ethiopian calendar if available
    let birthDateEc = '';
    if (resident.birthdate) {
      const ecDate = gregorianToEthiopian(resident.birthdate);
      if (ecDate) {
        birthDateEc = ecDate.formattedEc;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      resident_id: resident.resident_id,
      full_name: fullNameEn,
      full_name_am: fullNameAm,
      father_name: fatherNameEn,
      father_name_am: fatherNameAm,
      grandfather_name: grandfatherNameEn,
      grandfather_name_am: grandfatherNameAm,
      sex: resident.sex === 'M' ? 'Male' : resident.sex === 'F' ? 'Female' : '',
      birth_date_gc: resident.birthdate || '',
      birth_date_ec: birthDateEc,
      place_of_birth: resident.place_of_birth || '',
      house_number: resident.house_id || '',
      marital_status: resident.marital_status || '',
      phone: resident.phone || ''
    }));
    
    // Show Amharic input if no Amharic names in database
    setShowAmharicInput(!fullNameAm);
    
    // Fetch phone numbers if needed
    if (resident.resident_id) {
      fetchPhoneNumbers(resident.resident_id);
    }
  };

  const handleClearResident = () => {
    setSelectedResident(null);
    setFormData({
      resident_id: '',
      full_name: '',
      full_name_am: '',
      father_name: '',
      father_name_am: '',
      grandfather_name: '',
      grandfather_name_am: '',
      sex: '',
      birth_date_gc: '',
      birth_date_ec: '',
      place_of_birth: '',
      residence: '',
      house_number: '',
      phone: '',
      email: '',
      emergency_contact_name: '',
      emergency_relationship: '',
      emergency_phone: '',
      emergency_alt_phone: '',
      emergency_address: '',
      medical_notes: '',
      photo_url: '',
      issue_number: 1
    });
    setCapturedPhoto(null);
    setShowAmharicInput(false);
    setHasActiveId(false);
    setExistingIdNumber(null);
  };

  // Handle birth date change for both calendars
  const handleBirthDateChange = (value, calendar) => {
    if (calendar === 'gc') {
      setFormData(prev => ({ ...prev, birth_date_gc: value }));
      if (value) {
        const ecDate = gregorianToEthiopian(value);
        if (ecDate) {
          setFormData(prev => ({ ...prev, birth_date_ec: ecDate.formattedEc }));
        }
      } else {
        setFormData(prev => ({ ...prev, birth_date_ec: '' }));
      }
    } else {
      setFormData(prev => ({ ...prev, birth_date_ec: value }));
      if (value && value.length === 10) {
        const gcDate = ethiopianToGregorian(value);
        if (gcDate && gcDate.formatted) {
          setFormData(prev => ({ ...prev, birth_date_gc: gcDate.formatted }));
        }
      } else {
        setFormData(prev => ({ ...prev, birth_date_gc: '' }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    console.log('Submitting ID card with data:', {
      resident_id: formData.resident_id,
      full_name_am: formData.full_name_am,
      father_name_am: formData.father_name_am,
      grandfather_name_am: formData.grandfather_name_am,
      emergency_contact_name: formData.emergency_contact_name,
      has_photo: !!formData.photo_url
    });
    
    try {
      const response = await fetch('/api/id-card/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resident_id: formData.resident_id,
          full_name_am: formData.full_name_am,
          father_name_am: formData.father_name_am,
          grandfather_name_am: formData.grandfather_name_am,
          emergency_contact_name: formData.emergency_contact_name,
          emergency_relationship: formData.emergency_relationship,
          emergency_phone: formData.emergency_phone,
          emergency_alt_phone: formData.emergency_alt_phone,
          emergency_address: formData.emergency_address,
          medical_notes: formData.medical_notes,
          photo_url: formData.photo_url,
          phone: formData.phone,
          place_of_birth: formData.place_of_birth,
          house_number: formData.house_number,
          marital_status: formData.marital_status,
          email: formData.email
        })
      });
      
      const data = await response.json();
      console.log('API Response:', data);
      
      if (response.status === 409) {
        setError(
          `⚠️ ${data.message}\n\n` +
          `Existing ID: ${data.existing_id_number}\n` +
          `Issue Date: ${data.issue_date}\n` +
          `Expiry Date: ${data.expiry_date}\n\n` +
          `The resident already has an active ID card. Please renew or replace the existing card.`
        );
        setHasActiveId(true);
        setExistingIdNumber(data.existing_id_number);
      } else if (data.success) {
        setGeneratedId(data.id_card_id);
        setShowPreview(true);
      } else {
        setError(data.message || 'Failed to issue ID card');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    console.log('Printing ID card with ID:', generatedId);
    if (generatedId) {
      window.open(`/api/id-card/print/${generatedId}`, '_blank');
    } else {
      console.error('No ID card ID available for printing');
      alert('Please wait for ID card to be generated first');
    }
  };

  const handleNew = () => {
    setShowPreview(false);
    setGeneratedId(null);
    setSelectedResident(null);
    setCapturedPhoto(null);
    setShowAmharicInput(false);
    setHasActiveId(false);
    setExistingIdNumber(null);
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
            <FaIdCard className="text-blue-600" /> 
            {locale === 'am' ? 'አዲስ መታወቂያ ካርድ ማውጣት' : 'Issue New ID Card'}
          </h1>
          <p className="text-gray-500 mt-1">
            {locale === 'am' ? 'ከፎቶ እና የአደጋ ጊዜ እውቂያ ጋር አዲስ የነዋሪ መታወቂያ ካርድ ያውጡ' : 'Issue a new resident identification card with photo and emergency contacts'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2 text-red-700">
              <FaTimesCircle className="mt-0.5 flex-shrink-0" />
              <div className="whitespace-pre-line text-sm">{error}</div>
            </div>
          </div>
        )}

        {!showPreview ? (
          <>
            {/* Resident Search */}
            <ResidentSearch
              onSelect={handleSelectResident}
              selectedResident={selectedResident}
              onClear={handleClearResident}
            />

            {/* Selected Resident Status Indicator */}
            {selectedResident && (
              <div className={`rounded-lg p-4 mb-6 flex items-center justify-between ${hasActiveId ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                <div>
                  <p className={`font-semibold ${hasActiveId ? 'text-red-800' : 'text-green-800'}`}>
                    {locale === 'am' ? 'የተመረጠ ነዋሪ' : 'Selected Resident'}
                  </p>
                  <p className="text-sm text-gray-700">
                    {selectedResident.fname} {selectedResident.lname} - {locale === 'am' ? 'ቤት ቁጥር' : 'House'}: {selectedResident.house_id}
                  </p>
                  {hasActiveId && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <FaTimesCircle className="text-xs" />
                      {locale === 'am' 
                        ? `ይህ ነዋሪ ንቁ መታወቂያ ካርድ አለው: ${existingIdNumber}` 
                        : `This resident already has an active ID card: ${existingIdNumber}`}
                    </p>
                  )}
                  {checkingId && (
                    <p className="text-sm text-yellow-600 mt-1 flex items-center gap-1">
                      <FaSpinner className="animate-spin text-xs" />
                      {locale === 'am' ? 'በመፈተሽ ላይ...' : 'Checking ID status...'}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedResident(null);
                    setHasActiveId(false);
                    setExistingIdNumber(null);
                    handleClearResident();
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                >
                  <FaUserPlus className="text-xs" />
                  {locale === 'am' ? 'ለውጥ' : 'Change'}
                </button>
              </div>
            )}

            {/* Form - Only show if resident has NO active ID */}
            {selectedResident && !hasActiveId && !checkingId && (
              <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                {/* Personal Information */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                    <FaUser className="text-blue-600" />
                    {locale === 'am' ? 'የግል መረጃ' : 'Personal Information'}
                  </h2>
                  
                  {/* Photo Capture/Upload Section */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {locale === 'am' ? 'ፎቶ' : 'Photo'}
                    </label>
                    <div className="flex flex-col md:flex-row items-start gap-4">
                      <div className="w-32 h-36 bg-gray-200 rounded-lg border-2 border-dashed border-gray-400 flex items-center justify-center overflow-hidden">
                        {capturedPhoto ? (
                          <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center text-gray-400">
                            <FaCamera className="text-3xl mx-auto mb-1" />
                            <span className="text-xs">{locale === 'am' ? 'ምንም ፎቶ የለም' : 'No Photo'}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        {!showCamera ? (
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={startCamera}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                              >
                                <FaCamera /> {locale === 'am' ? 'ፎቶ አንሳ' : 'Take Photo'}
                              </button>
                              <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer flex items-center gap-2">
                                <FaUpload /> {locale === 'am' ? 'ፎቶ ጫን' : 'Upload Photo'}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleFileUpload}
                                  className="hidden"
                                />
                              </label>
                              {capturedPhoto && (
                                <button
                                  type="button"
                                  onClick={removePhoto}
                                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                                >
                                  <FaTrash /> {locale === 'am' ? 'አስወግድ' : 'Remove'}
                                </button>
                              )}
                            </div>
                            {cameraError && (
                              <p className="text-sm text-red-600 mt-2">{cameraError}</p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              className="w-64 h-48 rounded-lg border"
                            />
                            <canvas ref={canvasRef} style={{ display: 'none' }} />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={capturePhoto}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                              >
                                {locale === 'am' ? 'አንሳ' : 'Capture'}
                              </button>
                              <button
                                type="button"
                                onClick={stopCamera}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                              >
                                {locale === 'am' ? 'ሰርዝ' : 'Cancel'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {locale === 'am' ? 'ሙሉ ስም' : 'Full Name'} *
                      </label>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {locale === 'am' ? 'ሙሉ ስም (አማርኛ)' : 'Full Name (Amharic)'}
                      </label>
                      <input
                        type="text"
                        value={formData.full_name_am}
                        onChange={(e) => setFormData({...formData, full_name_am: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg font-ethiopic"
                        placeholder={locale === 'am' ? 'ሙሉ ስም በአማርኛ' : 'Full name in Amharic'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {locale === 'am' ? 'የአባት ስም' : "Father's Name"} *
                      </label>
                      <input
                        type="text"
                        value={formData.father_name}
                        onChange={(e) => setFormData({...formData, father_name: e.target.value})}
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
                        value={formData.father_name_am}
                        onChange={(e) => setFormData({...formData, father_name_am: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg font-ethiopic"
                        placeholder={locale === 'am' ? 'የአባት ስም በአማርኛ' : "Father's name in Amharic"}
                      />
                    </div>
                  </div>

                  {/* Toggle for Amharic Grandfather Name */}
                  <div className="mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showAmharicInput}
                        onChange={(e) => setShowAmharicInput(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-600">
                        {showAmharicInput 
                          ? (locale === 'am' ? 'የአያት ስም ደብቅ' : 'Hide Grandfather Name')
                          : (locale === 'am' ? 'የአያት ስም አሳይ' : 'Show Grandfather Name')}
                      </span>
                    </label>
                  </div>

                  {showAmharicInput && (
                    <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <h3 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
                        <FaLanguage /> {locale === 'am' ? 'የአያት ስም በአማርኛ' : "Grandfather's Name (Amharic)"}
                      </h3>
                      <div>
                        <input
                          type="text"
                          value={formData.grandfather_name_am}
                          onChange={(e) => setFormData({...formData, grandfather_name_am: e.target.value})}
                          className="w-full px-3 py-2 border border-amber-300 rounded-lg font-ethiopic"
                          placeholder={locale === 'am' ? 'የአያት ስም በአማርኛ' : "Grandfather's name in Amharic"}
                        />
                        <p className="text-xs text-amber-600 mt-1">
                          💡 {locale === 'am' 
                            ? 'የነዋሪው የአያት ስም በዳታቤዝ ውስጥ ከሌለ እዚህ ማስገባት ይችላሉ' 
                            : 'If the resident\'s grandfather name is not in the database, you can enter it here'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {locale === 'am' ? 'የአያት ስም' : "Grandfather's Name"}
                      </label>
                      <input
                        type="text"
                        value={formData.grandfather_name}
                        onChange={(e) => setFormData({...formData, grandfather_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {locale === 'am' ? 'ስልክ ቁጥር' : 'Phone Number'}
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {locale === 'am' ? 'ኢሜይል' : 'Email Address'}
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {locale === 'am' ? 'ቤት ቁጥር' : 'House Number'}
                      </label>
                      <input
                        type="text"
                        value={formData.house_number}
                        onChange={(e) => setFormData({...formData, house_number: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {locale === 'am' ? 'የትውልድ ቦታ' : 'Place of Birth'}
                      </label>
                      <input
                        type="text"
                        value={formData.place_of_birth}
                        onChange={(e) => setFormData({...formData, place_of_birth: e.target.value})}
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
                        <option value="Male">{locale === 'am' ? 'ወንድ' : 'Male'}</option>
                        <option value="Female">{locale === 'am' ? 'ሴት' : 'Female'}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Birth Information */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                    <FaCalendarAlt className="text-green-600" />
                    {locale === 'am' ? 'የልደት መረጃ' : 'Birth Information'}
                  </h2>
                  
                  <div className="flex gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setBirthCalendar('gc')}
                      className={`px-3 py-1 rounded-lg text-sm ${birthCalendar === 'gc' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                    >
                      Gregorian Calendar
                    </button>
                    <button
                      type="button"
                      onClick={() => setBirthCalendar('ec')}
                      className={`px-3 py-1 rounded-lg text-sm ${birthCalendar === 'ec' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                    >
                      Ethiopian Calendar
                    </button>
                    <span className="text-xs text-gray-400 ml-auto">
                      {locale === 'am' ? 'ዛሬ (ኢትዮጵያ)' : 'Today (EC)'}: {currentEcDate.formattedDisplay.en}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {birthCalendar === 'gc' ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {locale === 'am' ? 'የልደት ቀን (ግሪጎሪያን)' : 'Birth Date (GC)'} *
                          </label>
                          <input
                            type="date"
                            value={formData.birth_date_gc}
                            onChange={(e) => handleBirthDateChange(e.target.value, 'gc')}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                          <p className="text-xs text-gray-400 mt-1">{locale === 'am' ? 'ቅርጸት: ዓመት-ወር-ቀን' : 'Format: Year-Month-Day'}</p>
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
                            placeholder={locale === 'am' ? 'በራስ ይሞላል' : 'Auto-converted'}
                          />
                          <p className="text-xs text-blue-500 mt-1">🔄 {locale === 'am' ? 'ከጎርጎርያን ቀን በራስ ይቀየራል' : 'Auto-converted from Gregorian'}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {locale === 'am' ? 'የልደት ቀን (ኢትዮጵያ)' : 'Birth Date (EC)'} *
                          </label>
                          <input
                            type="text"
                            value={formData.birth_date_ec}
                            onChange={(e) => handleBirthDateChange(e.target.value, 'ec')}
                            placeholder={locale === 'am' ? 'YYYY-MM-DD (ለምሳሌ: 2016-04-12)' : 'YYYY-MM-DD (e.g., 2016-04-12)'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg font-ethiopic"
                          />
                          <p className="text-xs text-gray-400 mt-1">{locale === 'am' ? 'ቅርጸት: ዓመት-ወር-ቀን' : 'Format: Year-Month-Day'}</p>
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
                            placeholder={locale === 'am' ? 'በራስ ይሞላል' : 'Auto-converted'}
                          />
                          <p className="text-xs text-blue-500 mt-1">🔄 {locale === 'am' ? 'ከኢትዮጵያ ቀን በራስ ይቀየራል' : 'Auto-converted from Ethiopian'}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Emergency Contact Information */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                    <FaHeartbeat className="text-red-600" />
                    {locale === 'am' ? 'የአደጋ ጊዜ እውቂያ' : 'Emergency Contact Information'}
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {locale === 'am' ? 'የአደጋ ጊዜ እውቂያ ስም' : 'Emergency Contact Name'}
                      </label>
                      <input
                        type="text"
                        value={formData.emergency_contact_name}
                        onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {locale === 'am' ? 'ዝምድና' : 'Relationship'}
                      </label>
                      <input
                        type="text"
                        value={formData.emergency_relationship}
                        onChange={(e) => setFormData({...formData, emergency_relationship: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {locale === 'am' ? 'የአደጋ ጊዜ ስልክ ቁጥር' : 'Emergency Phone Number'}
                      </label>
                      <input
                        type="tel"
                        value={formData.emergency_phone}
                        onChange={(e) => setFormData({...formData, emergency_phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {locale === 'am' ? 'ተለዋጭ ስልክ ቁጥር' : 'Alternate Phone Number'}
                      </label>
                      <input
                        type="tel"
                        value={formData.emergency_alt_phone}
                        onChange={(e) => setFormData({...formData, emergency_alt_phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {locale === 'am' ? 'የአደጋ ጊዜ አድራሻ' : 'Emergency Address'}
                      </label>
                      <input
                        type="text"
                        value={formData.emergency_address}
                        onChange={(e) => setFormData({...formData, emergency_address: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {locale === 'am' ? 'የሕክምና ማስታወሻ (አለርጂዎች፣ ሁኔታዎች፣ ወዘተ)' : 'Medical Notes (Allergies, Conditions, etc.)'}
                      </label>
                      <textarea
                        value={formData.medical_notes}
                        onChange={(e) => setFormData({...formData, medical_notes: e.target.value})}
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                        placeholder={locale === 'am' ? 'ማስታወሻ...' : 'Notes...'}
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
                    disabled={loading || hasActiveId || checkingId}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                    {loading 
                      ? (locale === 'am' ? 'በሂደት ላይ...' : 'Processing...')
                      : (locale === 'am' ? 'ካርድ አውጣ' : 'Issue ID Card')
                    }
                  </button>
                </div>
              </form>
            )}

            {/* Message when resident has active ID */}
            {selectedResident && hasActiveId && !checkingId && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center mt-6">
                <FaTimesCircle className="text-yellow-600 text-4xl mx-auto mb-3" />
                <p className="text-yellow-800 font-medium">
                  {locale === 'am' 
                    ? 'ይህ ነዋሪ ቀድሞ ንቁ መታወቂያ ካርድ አለው' 
                    : 'This resident already has an active ID card'}
                </p>
                <p className="text-yellow-700 text-sm mt-1">
                  {locale === 'am' 
                    ? `ካርድ ቁጥር: ${existingIdNumber}` 
                    : `ID Number: ${existingIdNumber}`}
                </p>
                <button
                  onClick={() => {
                    setSelectedResident(null);
                    setHasActiveId(false);
                    setExistingIdNumber(null);
                    handleClearResident();
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {locale === 'am' ? 'ሌላ ነዋሪ ፈልግ' : 'Search Another Resident'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <FaCheckCircle className="text-green-600 text-5xl mx-auto mb-4" />
              <h2 className="text-xl font-bold text-green-800 mb-2">
                {locale === 'am' ? 'ካርድ በተሳካ ሁኔታ ተዘጋጅቷል' : 'ID Card Issued Successfully!'}
              </h2>
              <p className="text-green-700 mb-4">
                {locale === 'am' ? 'ካርዱ ተዘጋጅቷል እና ለማተም ዝግጁ ነው' : 'The ID card has been generated and is ready for printing'}
              </p>
              <div className="bg-white rounded-lg p-4 inline-block mx-auto">
                <p className="text-sm text-gray-500">{locale === 'am' ? 'የካርድ ቁጥር' : 'ID Number'}</p>
                <p className="text-lg font-bold text-blue-600 font-mono">{generatedId}</p>
              </div>
              <div className="flex gap-3 justify-center mt-6">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <FaPrint /> {locale === 'am' ? 'ካርድ አትም' : 'Print ID Card'}
                </button>
                <button
                  onClick={handleNew}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {locale === 'am' ? 'ሌላ ካርድ አውጣ' : 'Issue Another ID'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default withAuth(GiveIDPage, ['Record Officer']);
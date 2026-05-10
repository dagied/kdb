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
  FaUpload, FaUserPlus, FaHeartbeat, FaPhoneAlt
} from 'react-icons/fa';
import { gregorianToEthiopian, calculateExpiryDate, getCurrentEthiopianDate, ethiopianToGregorian } from '@/utils/calendar';

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
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  
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

  const handleSelectResident = (resident) => {
    setSelectedResident(resident);
    setFormData(prev => ({
      ...prev,
      resident_id: resident.resident_id,
      full_name: `${resident.fname} ${resident.lname}`,
      full_name_am: resident.fname_am ? `${resident.fname_am} ${resident.lname_am}` : '',
      father_name: resident.lname || '',
      father_name_am: resident.lname_am || '',
      grandfather_name: resident.grandfather_name || '',
      grandfather_name_am: '',
      sex: resident.sex === 'M' ? 'Male' : 'Female',
      birth_date_gc: resident.birthdate || '',
      birth_date_ec: resident.birthdate ? gregorianToEthiopian(resident.birthdate).formattedEc : '',
      place_of_birth: resident.place_of_birth || '',
      residence: resident.house_id || '',
      house_number: resident.house_id || ''
    }));
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
  
  console.log('Submitting ID card with photo:', !!formData.photo_url);
  
  try {
    const response = await fetch('/api/id-card/issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    console.log('API Response:', data); // 👈 ADD THIS LINE
    
    if (data.success) {
      console.log('ID Card Created - ID:', data.id_card_id); // 👈 ADD THIS LINE
      setGeneratedId(data.id_card_id);
      setShowPreview(true);
    } else {
      setError(data.error || 'Failed to issue ID card');
    }
  } catch (error) {
    console.error('Error:', error);
    setError('Network error. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const handlePrint = () => {
  console.log('Printing ID card with ID:', generatedId); // 👈 ADD THIS LINE
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
    handleClearResident();
  };

  const currentEcDate = getCurrentEthiopianDate();

  return (
    <Layout role="Record Officer">
      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaIdCard className="text-blue-600" /> 
            Issue New ID Card
          </h1>
          <p className="text-gray-500 mt-1">Issue a new resident identification card with photo and emergency contacts</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <FaTimesCircle /> {error}
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

            {selectedResident && (
              <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                {/* Personal Information */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                    <FaUser className="text-blue-600" />
                    Personal Information
                  </h2>
                  
                  {/* Photo Capture/Upload Section */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Photo</label>
                    <div className="flex flex-col md:flex-row items-start gap-4">
                      <div className="w-32 h-36 bg-gray-200 rounded-lg border-2 border-dashed border-gray-400 flex items-center justify-center overflow-hidden">
                        {capturedPhoto ? (
                          <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center text-gray-400">
                            <FaCamera className="text-3xl mx-auto mb-1" />
                            <span className="text-xs">No Photo</span>
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
                                <FaCamera /> Take Photo
                              </button>
                              <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer flex items-center gap-2">
                                <FaUpload /> Upload Photo
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
                                  <FaTrash /> Remove
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
                                Capture
                              </button>
                              <button
                                type="button"
                                onClick={stopCamera}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name (Amharic)</label>
                      <input
                        type="text"
                        value={formData.full_name_am}
                        onChange={(e) => setFormData({...formData, full_name_am: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg font-ethiopian"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name *</label>
                      <input
                        type="text"
                        value={formData.father_name}
                        onChange={(e) => setFormData({...formData, father_name: e.target.value})}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">House Number</label>
                      <input
                        type="text"
                        value={formData.house_number}
                        onChange={(e) => setFormData({...formData, house_number: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Place of Birth</label>
                      <input
                        type="text"
                        value={formData.place_of_birth}
                        onChange={(e) => setFormData({...formData, place_of_birth: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sex *</label>
                      <select
                        value={formData.sex}
                        onChange={(e) => setFormData({...formData, sex: e.target.value})}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Birth Information */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                    <FaCalendarAlt className="text-green-600" />
                    Birth Information
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
                    <span className="text-xs text-gray-400 ml-auto">Today (EC): {currentEcDate.formattedDisplay.en}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {birthCalendar === 'gc' ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date (GC) *</label>
                          <input
                            type="date"
                            value={formData.birth_date_gc}
                            onChange={(e) => handleBirthDateChange(e.target.value, 'gc')}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                          <p className="text-xs text-gray-400 mt-1">Format: Year-Month-Day</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date (EC)</label>
                          <input
                            type="text"
                            value={formData.birth_date_ec}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                            placeholder="Auto-converted"
                          />
                          <p className="text-xs text-blue-500 mt-1">🔄 Auto-converted from Gregorian</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date (EC) *</label>
                          <input
                            type="text"
                            value={formData.birth_date_ec}
                            onChange={(e) => handleBirthDateChange(e.target.value, 'ec')}
                            placeholder="YYYY-MM-DD (e.g., 2016-04-12)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                          <p className="text-xs text-gray-400 mt-1">Format: Year-Month-Day (e.g., 2016-04-12)</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date (GC)</label>
                          <input
                            type="text"
                            value={formData.birth_date_gc}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                            placeholder="Auto-converted"
                          />
                          <p className="text-xs text-blue-500 mt-1">🔄 Auto-converted from Ethiopian date</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Emergency Contact Information */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                    <FaHeartbeat className="text-red-600" />
                    Emergency Contact Information
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
                      <input
                        type="text"
                        value={formData.emergency_contact_name}
                        onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                      <input
                        type="text"
                        value={formData.emergency_relationship}
                        onChange={(e) => setFormData({...formData, emergency_relationship: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Phone Number</label>
                      <input
                        type="tel"
                        value={formData.emergency_phone}
                        onChange={(e) => setFormData({...formData, emergency_phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Phone Number</label>
                      <input
                        type="tel"
                        value={formData.emergency_alt_phone}
                        onChange={(e) => setFormData({...formData, emergency_alt_phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Address</label>
                      <input
                        type="text"
                        value={formData.emergency_address}
                        onChange={(e) => setFormData({...formData, emergency_address: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Medical Notes (Allergies, Conditions, etc.)</label>
                      <textarea
                        value={formData.medical_notes}
                        onChange={(e) => setFormData({...formData, medical_notes: e.target.value})}
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
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
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                    {loading ? 'Processing...' : 'Issue ID Card'}
                  </button>
                </div>
              </form>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <FaCheckCircle className="text-green-600 text-5xl mx-auto mb-4" />
              <h2 className="text-xl font-bold text-green-800 mb-2">ID Card Issued Successfully!</h2>
              <p className="text-green-700 mb-4">The ID card has been generated and is ready for printing</p>
              <div className="bg-white rounded-lg p-4 inline-block mx-auto">
                <p className="text-sm text-gray-500">ID Number</p>
                <p className="text-lg font-bold text-blue-600 font-mono">{generatedId}</p>
              </div>
              <div className="flex gap-3 justify-center mt-6">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <FaPrint /> Print ID Card
                </button>
                <button
                  onClick={handleNew}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Issue Another ID
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
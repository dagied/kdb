'use client';

import { withAuth } from '@/components/withAuth';
import { useState, useRef, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useTranslation } from '@/hooks/useTranslation';
import ResidentSearch from '@/components/ResidentSearch';
import { 
  FaRing, FaUser, FaCalendarAlt, FaMapMarkerAlt,
  FaFileAlt, FaSave, FaSpinner, FaPrint,
  FaCheckCircle, FaTimesCircle, FaUsers,
  FaChurch, FaBookOpen, FaCamera, FaUpload, FaRedo,
  FaUserPlus, FaExclamationTriangle, FaTrash, FaImage,
  FaSearch  
} from 'react-icons/fa';
import { gregorianToEthiopian, ethiopianToGregorian, getCurrentEthiopianDate } from '@/utils/calendar';

// Ethiopian months array for dropdown
const ETHIOPIAN_MONTHS = [
  { value: '01', nameEn: 'September', nameAm: 'መስከረም' },
  { value: '02', nameEn: 'October', nameAm: 'ጥቅምት' },
  { value: '03', nameEn: 'November', nameAm: 'ኅዳር' },
  { value: '04', nameEn: 'December', nameAm: 'ታኅሣሥ' },
  { value: '05', nameEn: 'January', nameAm: 'ጥር' },
  { value: '06', nameEn: 'February', nameAm: 'የካቲት' },
  { value: '07', nameEn: 'March', nameAm: 'መጋቢት' },
  { value: '08', nameEn: 'April', nameAm: 'ሚያዝያ' },
  { value: '09', nameEn: 'May', nameAm: 'ግንቦት' },
  { value: '10', nameEn: 'June', nameAm: 'ሰኔ' },
  { value: '11', nameEn: 'July', nameAm: 'ሐምሌ' },
  { value: '12', nameEn: 'August', nameAm: 'ነሐሴ' },
  { value: '13', nameEn: 'Pagumiene', nameAm: 'ጳጉሜ' }
];

function MarriageCertificatePage() {
  const { t, locale } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedId, setGeneratedId] = useState(null);
  const [error, setError] = useState(null);
  const [marriageCalendar, setMarriageCalendar] = useState('gc');
  const [husbandBirthCalendar, setHusbandBirthCalendar] = useState('gc');
  const [wifeBirthCalendar, setWifeBirthCalendar] = useState('gc');
  
  // Search states
  const [searchHusband, setSearchHusband] = useState(false);
  const [searchWife, setSearchWife] = useState(false);
  const [selectedHusband, setSelectedHusband] = useState(null);
  const [selectedWife, setSelectedWife] = useState(null);
  
  // Manual entry flags (for non-resident spouses)
  const [husbandNotFound, setHusbandNotFound] = useState(false);
  const [wifeNotFound, setWifeNotFound] = useState(false);
  
  // Photo states
  const [husbandPhoto, setHusbandPhoto] = useState(null);
  const [husbandPhotoPreview, setHusbandPhotoPreview] = useState(null);
  const [wifePhoto, setWifePhoto] = useState(null);
  const [wifePhotoPreview, setWifePhotoPreview] = useState(null);
  const [showCamera, setShowCamera] = useState(null); // 'husband' or 'wife'
  
  // Refs for camera and file inputs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const husbandFileInputRef = useRef(null);  // ✅ Separate ref for husband
  const wifeFileInputRef = useRef(null);      // ✅ Separate ref for wife
  
  const [formData, setFormData] = useState({
    // Husband Information
    husband_name: '',
    husband_name_am: '',
    husband_father_name: '',
    husband_grandfather_name: '',
    husband_birth_date_gc: '',
    husband_birth_date_ec: '',
    husband_nationality: 'Ethiopian',
    husband_resident_id: '',
    husband_birth_reg_number: '',
    // Wife Information
    wife_name: '',
    wife_name_am: '',
    wife_father_name: '',
    wife_grandfather_name: '',
    wife_birth_date_gc: '',
    wife_birth_date_ec: '',
    wife_nationality: 'Ethiopian',
    wife_resident_id: '',
    wife_birth_reg_number: '',
    // Marriage Information
    registration_number: '',
    form_number: '',
    marriage_date_gc: '',
    marriage_date_ec: '',
    marriage_place: '',
    marriage_place_am: '',
    zone: '',
    woreda: '',
    sub_city: '',
    kebele: '',
    witness1_name: '',
    witness1_name_am: '',
    witness2_name: '',
    witness2_name_am: '',
    // Registrar Information
    registrar_name: '',
    registrar_name_am: '',  // ✅ Added missing field
    registrar_father_name: '',
    registrar_grandfather_name: '',
    registrar_km: '',
    issue_date: '',
    status: 'issued'
  });

  // Staff info fetch effect
  useEffect(() => {
    const fetchStaffInfo = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          if (data.staff) {
            setFormData(prev => ({
              ...prev,
              registrar_name: data.staff.full_name || '',
              registrar_name_am: data.staff.full_name_am || '',
              registrar_father_name: data.staff.father_name || '',
              registrar_grandfather_name: data.staff.grandfather_name || '',
              registrar_km: data.staff.kebele || '',
              issue_date: new Date().toISOString().split('T')[0]
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching staff info:', error);
      }
    };
    fetchStaffInfo();
  }, []);

  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      if (husbandPhotoPreview && husbandPhotoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(husbandPhotoPreview);
      }
      if (wifePhotoPreview && wifePhotoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(wifePhotoPreview);
      }
    };
  }, [husbandPhotoPreview, wifePhotoPreview]);

  // Camera functions
  const startCamera = (person) => {
    setShowCamera(person);
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        console.error('Camera error:', err);
        alert(locale === 'am' ? 'ካሜራ ማስጀመር አልተቻለም' : 'Could not start camera');
      });
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setShowCamera(null);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && videoRef.current.videoWidth > 0) {
      try {
        const context = canvasRef.current.getContext('2d');
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        
        canvasRef.current.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
            const previewUrl = URL.createObjectURL(blob);
            
            if (showCamera === 'husband') {
              setHusbandPhoto(file);
              setHusbandPhotoPreview(previewUrl);
            } else if (showCamera === 'wife') {
              setWifePhoto(file);
              setWifePhotoPreview(previewUrl);
            }
            stopCamera();
          }
        }, 'image/jpeg', 0.8);
      } catch (error) {
        console.error('Error capturing photo:', error);
        alert(locale === 'am' ? 'ፎቶ ማንሳት አልተቻለም' : 'Could not capture photo');
      }
    } else {
      alert(locale === 'am' ? 'እባክዎ ካሜራው እንደበራ ያረጋግጡ' : 'Please make sure the camera is on');
    }
  };

  const handleFileUpload = (event, person) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const previewUrl = URL.createObjectURL(file);
        if (person === 'husband') {
          setHusbandPhoto(file);
          setHusbandPhotoPreview(previewUrl);
        } else {
          setWifePhoto(file);
          setWifePhotoPreview(previewUrl);
        }
      } catch (error) {
        console.error('Error creating preview URL:', error);
        const reader = new FileReader();
        reader.onload = (e) => {
          if (person === 'husband') {
            setHusbandPhoto(file);
            setHusbandPhotoPreview(e.target.result);
          } else {
            setWifePhoto(file);
            setWifePhotoPreview(e.target.result);
          }
        };
        reader.readAsDataURL(file);
      }
    } else if (file) {
      alert(locale === 'am' ? 'እባክዎ የሚሰራ የምስል ፋይል ይምረጡ' : 'Please select a valid image file');
    }
  };

  const removePhoto = (person) => {
    if (person === 'husband') {
      if (husbandPhotoPreview && husbandPhotoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(husbandPhotoPreview);
      }
      setHusbandPhoto(null);
      setHusbandPhotoPreview(null);
      if (husbandFileInputRef.current) husbandFileInputRef.current.value = '';
    } else {
      if (wifePhotoPreview && wifePhotoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(wifePhotoPreview);
      }
      setWifePhoto(null);
      setWifePhotoPreview(null);
      if (wifeFileInputRef.current) wifeFileInputRef.current.value = '';
    }
  };

  // Resident selection handlers
  const handleSelectHusband = (resident) => {
    setSelectedHusband(resident);
    setHusbandNotFound(false);
    setFormData(prev => ({
      ...prev,
      husband_name: `${resident.fname} ${resident.mname || ''} ${resident.lname}`.trim(),
      husband_name_am: [resident.fname_am, resident.mname_am, resident.lname_am].filter(Boolean).join(' '),
      husband_father_name: resident.father_name || '',
      husband_grandfather_name: resident.grandfather_name || '',
      husband_nationality: resident.nationality || 'Ethiopian',
      husband_resident_id: resident.resident_id,
      husband_birth_reg_number: resident.birth_reg_number || ''
    }));
    if (resident.birth_date_gc) {
      const ecDate = gregorianToEthiopian(resident.birth_date_gc);
      setFormData(prev => ({
        ...prev,
        husband_birth_date_gc: resident.birth_date_gc,
        husband_birth_date_ec: ecDate?.formattedEc || ''
      }));
    }
    setSearchHusband(false);
  };

  const handleSelectWife = (resident) => {
    setSelectedWife(resident);
    setWifeNotFound(false);
    setFormData(prev => ({
      ...prev,
      wife_name: `${resident.fname} ${resident.mname || ''} ${resident.lname}`.trim(),
      wife_name_am: [resident.fname_am, resident.mname_am, resident.lname_am].filter(Boolean).join(' '),
      wife_father_name: resident.father_name || '',
      wife_grandfather_name: resident.grandfather_name || '',
      wife_nationality: resident.nationality || 'Ethiopian',
      wife_resident_id: resident.resident_id,
      wife_birth_reg_number: resident.birth_reg_number || ''
    }));
    if (resident.birth_date_gc) {
      const ecDate = gregorianToEthiopian(resident.birth_date_gc);
      setFormData(prev => ({
        ...prev,
        wife_birth_date_gc: resident.birth_date_gc,
        wife_birth_date_ec: ecDate?.formattedEc || ''
      }));
    }
    setSearchWife(false);
  };

  // Manual entry handlers
  const toggleHusbandNotFound = () => {
    const newState = !husbandNotFound;
    setHusbandNotFound(newState);
    if (newState) {
      setSelectedHusband(null);
      setFormData(prev => ({
        ...prev,
        husband_resident_id: '',
        husband_name: '',
        husband_name_am: '',
        husband_father_name: '',
        husband_grandfather_name: '',
        husband_birth_date_gc: '',
        husband_birth_date_ec: '',
        husband_nationality: 'Ethiopian',
        husband_birth_reg_number: ''
      }));
    }
    setSearchHusband(false);
  };

  const toggleWifeNotFound = () => {
    const newState = !wifeNotFound;
    setWifeNotFound(newState);
    if (newState) {
      setSelectedWife(null);
      setFormData(prev => ({
        ...prev,
        wife_resident_id: '',
        wife_name: '',
        wife_name_am: '',
        wife_father_name: '',
        wife_grandfather_name: '',
        wife_birth_date_gc: '',
        wife_birth_date_ec: '',
        wife_nationality: 'Ethiopian',
        wife_birth_reg_number: ''
      }));
    }
    setSearchWife(false);
  };

  // Birth date handlers
  const handleHusbandBirthDateChange = (value, calendar) => {
    if (calendar === 'gc') {
      if (value) {
        const ecDate = gregorianToEthiopian(value);
        setFormData(prev => ({
          ...prev,
          husband_birth_date_gc: value,
          husband_birth_date_ec: ecDate?.formattedEc || ''
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          husband_birth_date_gc: '',
          husband_birth_date_ec: ''
        }));
      }
    } else {
      if (value) {
        const gcDate = ethiopianToGregorian(value);
        setFormData(prev => ({
          ...prev,
          husband_birth_date_ec: value,
          husband_birth_date_gc: gcDate?.formatted || ''
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          husband_birth_date_ec: '',
          husband_birth_date_gc: ''
        }));
      }
    }
  };

  const handleWifeBirthDateChange = (value, calendar) => {
    if (calendar === 'gc') {
      if (value) {
        const ecDate = gregorianToEthiopian(value);
        setFormData(prev => ({
          ...prev,
          wife_birth_date_gc: value,
          wife_birth_date_ec: ecDate?.formattedEc || ''
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          wife_birth_date_gc: '',
          wife_birth_date_ec: ''
        }));
      }
    } else {
      if (value) {
        const gcDate = ethiopianToGregorian(value);
        setFormData(prev => ({
          ...prev,
          wife_birth_date_ec: value,
          wife_birth_date_gc: gcDate?.formatted || ''
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          wife_birth_date_ec: '',
          wife_birth_date_gc: ''
        }));
      }
    }
  };

  const handleMarriageDateChange = (value, calendar) => {
    if (calendar === 'gc') {
      if (value) {
        const ecDate = gregorianToEthiopian(value);
        setFormData(prev => ({
          ...prev,
          marriage_date_gc: value,
          marriage_date_ec: ecDate?.formattedEc || ''
        }));
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
    
    const getBase64 = (file) => {
      return new Promise((resolve) => {
        if (!file) {
          resolve(null);
          return;
        }
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
      });
    };
    
    const husbandPhotoBase64 = await getBase64(husbandPhoto);
    const wifePhotoBase64 = await getBase64(wifePhoto);
    
    try {
      const response = await fetch('/api/certificates/marriage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          registration_number: registrationNumber,
          issue_date: formData.issue_date || new Date().toISOString().split('T')[0],
          husband_photo: husbandPhotoBase64,
          wife_photo: wifePhotoBase64,
          husband_not_found: husbandNotFound,
          wife_not_found: wifeNotFound
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
    setHusbandNotFound(false);
    setWifeNotFound(false);
    setHusbandPhoto(null);
    setHusbandPhotoPreview(null);
    setWifePhoto(null);
    setWifePhotoPreview(null);
    setShowCamera(null);
    setFormData({
      husband_name: '',
      husband_name_am: '',
      husband_father_name: '',
      husband_grandfather_name: '',
      husband_birth_date_gc: '',
      husband_birth_date_ec: '',
      husband_nationality: 'Ethiopian',
      husband_resident_id: '',
      husband_birth_reg_number: '',
      wife_name: '',
      wife_name_am: '',
      wife_father_name: '',
      wife_grandfather_name: '',
      wife_birth_date_gc: '',
      wife_birth_date_ec: '',
      wife_nationality: 'Ethiopian',
      wife_resident_id: '',
      wife_birth_reg_number: '',
      registration_number: '',
      form_number: '',
      marriage_date_gc: '',
      marriage_date_ec: '',
      marriage_place: '',
      marriage_place_am: '',
      zone: '',
      woreda: '',
      sub_city: '',
      kebele: '',
      witness1_name: '',
      witness1_name_am: '',
      witness2_name: '',
      witness2_name_am: '',
      registrar_name: '',
      registrar_name_am: '',
      registrar_father_name: '',
      registrar_grandfather_name: '',
      registrar_km: '',
      issue_date: '',
      status: 'issued'
    });
  };

  const currentEcDate = getCurrentEthiopianDate();

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <Layout role="Record Officer">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;500;600;700&display=swap');
        .font-ethiopic {
          font-family: 'Noto Sans Ethiopic', 'Nyala', 'Abyssinica SIL', sans-serif;
        }
        .photo-preview {
          width: 100px;
          height: 120px;
          object-fit: cover;
          border-radius: 8px;
          border: 2px solid #ddd;
        }
        .camera-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.9);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .camera-video {
          width: 100%;
          max-width: 600px;
          border-radius: 12px;
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
            {/* ==================== HUSBAND SECTION ==================== */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                <FaUser className="text-blue-600" />
                {locale === 'am' ? 'የሙሽር መረጃ' : 'Groom/Husband Information'}
              </h2>
              
              {/* Photo Section */}
              <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                {husbandPhotoPreview ? (
                  <div className="relative">
                    <img src={husbandPhotoPreview} alt="Husband" className="photo-preview" />
                    <button
                      type="button"
                      onClick={() => removePhoto('husband')}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ) : (
                  <div className="w-[100px] h-[120px] bg-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-500">
                    <FaCamera size={30} />
                    <span className="text-xs mt-1">{locale === 'am' ? 'ፎቶ' : 'Photo'}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startCamera('husband')}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1"
                  >
                    <FaCamera /> {locale === 'am' ? 'ካሜራ' : 'Camera'}
                  </button>
                  <button
                    type="button"
                    onClick={() => husbandFileInputRef.current?.click()}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center gap-1"
                  >
                    <FaUpload /> {locale === 'am' ? 'ስቀል' : 'Upload'}
                  </button>
                  <input
                    type="file"
                    ref={husbandFileInputRef}
                    onChange={(e) => handleFileUpload(e, 'husband')}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {locale === 'am' ? 'የሙሽር ፎቶ ያስገቡ' : 'Upload groom\'s photo'}
                </span>
              </div>

              {/* Search/Manual Toggle */}
              <div className="flex justify-between items-center mb-3">
                <button
                  type="button"
                  onClick={() => { setSearchHusband(!searchHusband); setHusbandNotFound(false); }}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                >
                  <FaSearch /> {searchHusband ? (locale === 'am' ? 'ድበቅ' : 'Hide Search') : (locale === 'am' ? 'ነዋሪ ፈልግ' : 'Search Resident')}
                </button>
                <button
                  type="button"
                  onClick={toggleHusbandNotFound}
                  className="text-orange-600 hover:text-orange-700 text-sm flex items-center gap-1"
                >
                  {husbandNotFound ? <FaSearch /> : <FaExclamationTriangle />}
                  {husbandNotFound ? (locale === 'am' ? 'ነዋሪ ፈልግ' : 'Search Resident') : (locale === 'am' ? 'አልተገኘም?' : 'Not found?')}
                </button>
              </div>

              {!husbandNotFound && searchHusband && (
                <ResidentSearch
                  onSelect={handleSelectHusband}
                  selectedResident={selectedHusband}
                  onClear={() => setSelectedHusband(null)}
                />
              )}

              {!husbandNotFound && selectedHusband && !searchHusband && (
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

              {/* Husband Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'ሙሉ ስም (እንግሊዝኛ)' : 'Full Name (English)'} *
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
                    {locale === 'am' ? 'ሙሉ ስም (አማርኛ)' : 'Full Name (Amharic)'}
                  </label>
                  <input
                    type="text"
                    lang="am"
                    value={formData.husband_name_am}
                    onChange={(e) => setFormData({...formData, husband_name_am: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-ethiopic"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'የአባት ስም' : "Father's Name"}
                  </label>
                  <input
                    type="text"
                    value={formData.husband_father_name}
                    onChange={(e) => setFormData({...formData, husband_father_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'የአያት ስም' : "Grandfather's Name"}
                  </label>
                  <input
                    type="text"
                    value={formData.husband_grandfather_name}
                    onChange={(e) => setFormData({...formData, husband_grandfather_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'የልደት ምዝገባ ቁጥር' : 'Birth Registration Number'}
                  </label>
                  <input
                    type="text"
                    value={formData.husband_birth_reg_number}
                    onChange={(e) => setFormData({...formData, husband_birth_reg_number: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., BTH-2024-XXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'ዜግነት' : 'Nationality'}
                  </label>
                  <input
                    type="text"
                    value={formData.husband_nationality}
                    onChange={(e) => setFormData({...formData, husband_nationality: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Husband Birth Date */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {locale === 'am' ? 'የልደት ቀን' : 'Date of Birth'}
                </label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setHusbandBirthCalendar('gc')}
                    className={`px-3 py-1 rounded-lg text-sm ${husbandBirthCalendar === 'gc' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                  >
                    Gregorian
                  </button>
                  <button
                    type="button"
                    onClick={() => setHusbandBirthCalendar('ec')}
                    className={`px-3 py-1 rounded-lg text-sm ${husbandBirthCalendar === 'ec' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                  >
                    Ethiopian
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {husbandBirthCalendar === 'gc' ? (
                    <>
                      <input
                        type="date"
                        value={formData.husband_birth_date_gc}
                        onChange={(e) => handleHusbandBirthDateChange(e.target.value, 'gc')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <input
                        type="text"
                        value={formData.husband_birth_date_ec}
                        readOnly
                        placeholder="Ethiopian date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-ethiopic"
                      />
                    </>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Year"
                          value={formData.husband_birth_date_ec?.split('-')[0] || ''}
                          onChange={(e) => {
                            const parts = formData.husband_birth_date_ec?.split('-') || ['', '', ''];
                            const newDate = `${e.target.value}-${parts[1] || ''}-${parts[2] || ''}`;
                            handleHusbandBirthDateChange(newDate, 'ec');
                          }}
                          className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <select
                          value={formData.husband_birth_date_ec?.split('-')[1] || ''}
                          onChange={(e) => {
                            const parts = formData.husband_birth_date_ec?.split('-') || ['', '', ''];
                            const newDate = `${parts[0] || ''}-${e.target.value}-${parts[2] || ''}`;
                            handleHusbandBirthDateChange(newDate, 'ec');
                          }}
                          className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">Month</option>
                          {ETHIOPIAN_MONTHS.map(month => (
                            <option key={month.value} value={month.value}>
                              {locale === 'am' ? month.nameAm : month.nameEn}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          placeholder="Day"
                          min="1"
                          max="30"
                          value={formData.husband_birth_date_ec?.split('-')[2] || ''}
                          onChange={(e) => {
                            const parts = formData.husband_birth_date_ec?.split('-') || ['', '', ''];
                            const newDate = `${parts[0] || ''}-${parts[1] || ''}-${e.target.value}`;
                            handleHusbandBirthDateChange(newDate, 'ec');
                          }}
                          className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.husband_birth_date_gc}
                        readOnly
                        placeholder="Gregorian date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ==================== WIFE SECTION ==================== */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                <FaUser className="text-pink-600" />
                {locale === 'am' ? 'የሙሽራ መረጃ' : 'Bride/Wife Information'}
              </h2>
              
              {/* Photo Section */}
              <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                {wifePhotoPreview ? (
                  <div className="relative">
                    <img src={wifePhotoPreview} alt="Wife" className="photo-preview" />
                    <button
                      type="button"
                      onClick={() => removePhoto('wife')}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ) : (
                  <div className="w-[100px] h-[120px] bg-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-500">
                    <FaCamera size={30} />
                    <span className="text-xs mt-1">{locale === 'am' ? 'ፎቶ' : 'Photo'}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startCamera('wife')}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1"
                  >
                    <FaCamera /> {locale === 'am' ? 'ካሜራ' : 'Camera'}
                  </button>
                  <button
                    type="button"
                    onClick={() => wifeFileInputRef.current?.click()}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center gap-1"
                  >
                    <FaUpload /> {locale === 'am' ? 'ስቀል' : 'Upload'}
                  </button>
                  <input
                    type="file"
                    ref={wifeFileInputRef}
                    onChange={(e) => handleFileUpload(e, 'wife')}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {locale === 'am' ? 'የሙሽራ ፎቶ ያስገቡ' : 'Upload bride\'s photo'}
                </span>
              </div>

              {/* Search/Manual Toggle */}
              <div className="flex justify-between items-center mb-3">
                <button
                  type="button"
                  onClick={() => { setSearchWife(!searchWife); setWifeNotFound(false); }}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                >
                  <FaSearch /> {searchWife ? (locale === 'am' ? 'ድበቅ' : 'Hide Search') : (locale === 'am' ? 'ነዋሪ ፈልግ' : 'Search Resident')}
                </button>
                <button
                  type="button"
                  onClick={toggleWifeNotFound}
                  className="text-orange-600 hover:text-orange-700 text-sm flex items-center gap-1"
                >
                  {wifeNotFound ? <FaSearch /> : <FaExclamationTriangle />}
                  {wifeNotFound ? (locale === 'am' ? 'ነዋሪ ፈልግ' : 'Search Resident') : (locale === 'am' ? 'አልተገኘም?' : 'Not found?')}
                </button>
              </div>

              {!wifeNotFound && searchWife && (
                <ResidentSearch
                  onSelect={handleSelectWife}
                  selectedResident={selectedWife}
                  onClear={() => setSelectedWife(null)}
                />
              )}

              {!wifeNotFound && selectedWife && !searchWife && (
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

              {/* Wife Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'ሙሉ ስም (እንግሊዝኛ)' : 'Full Name (English)'} *
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
                    {locale === 'am' ? 'ሙሉ ስም (አማርኛ)' : 'Full Name (Amharic)'}
                  </label>
                  <input
                    type="text"
                    lang="am"
                    value={formData.wife_name_am}
                    onChange={(e) => setFormData({...formData, wife_name_am: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-ethiopic"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'የአባት ስም' : "Father's Name"}
                  </label>
                  <input
                    type="text"
                    value={formData.wife_father_name}
                    onChange={(e) => setFormData({...formData, wife_father_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'የአያት ስም' : "Grandfather's Name"}
                  </label>
                  <input
                    type="text"
                    value={formData.wife_grandfather_name}
                    onChange={(e) => setFormData({...formData, wife_grandfather_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'የልደት ምዝገባ ቁጥር' : 'Birth Registration Number'}
                  </label>
                  <input
                    type="text"
                    value={formData.wife_birth_reg_number}
                    onChange={(e) => setFormData({...formData, wife_birth_reg_number: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., BTH-2024-XXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'ዜግነት' : 'Nationality'}
                  </label>
                  <input
                    type="text"
                    value={formData.wife_nationality}
                    onChange={(e) => setFormData({...formData, wife_nationality: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Wife Birth Date */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {locale === 'am' ? 'የልደት ቀን' : 'Date of Birth'}
                </label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setWifeBirthCalendar('gc')}
                    className={`px-3 py-1 rounded-lg text-sm ${wifeBirthCalendar === 'gc' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                  >
                    Gregorian
                  </button>
                  <button
                    type="button"
                    onClick={() => setWifeBirthCalendar('ec')}
                    className={`px-3 py-1 rounded-lg text-sm ${wifeBirthCalendar === 'ec' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                  >
                    Ethiopian
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {wifeBirthCalendar === 'gc' ? (
                    <>
                      <input
                        type="date"
                        value={formData.wife_birth_date_gc}
                        onChange={(e) => handleWifeBirthDateChange(e.target.value, 'gc')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <input
                        type="text"
                        value={formData.wife_birth_date_ec}
                        readOnly
                        placeholder="Ethiopian date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-ethiopic"
                      />
                    </>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Year"
                          value={formData.wife_birth_date_ec?.split('-')[0] || ''}
                          onChange={(e) => {
                            const parts = formData.wife_birth_date_ec?.split('-') || ['', '', ''];
                            const newDate = `${e.target.value}-${parts[1] || ''}-${parts[2] || ''}`;
                            handleWifeBirthDateChange(newDate, 'ec');
                          }}
                          className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <select
                          value={formData.wife_birth_date_ec?.split('-')[1] || ''}
                          onChange={(e) => {
                            const parts = formData.wife_birth_date_ec?.split('-') || ['', '', ''];
                            const newDate = `${parts[0] || ''}-${e.target.value}-${parts[2] || ''}`;
                            handleWifeBirthDateChange(newDate, 'ec');
                          }}
                          className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">Month</option>
                          {ETHIOPIAN_MONTHS.map(month => (
                            <option key={month.value} value={month.value}>
                              {locale === 'am' ? month.nameAm : month.nameEn}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          placeholder="Day"
                          min="1"
                          max="30"
                          value={formData.wife_birth_date_ec?.split('-')[2] || ''}
                          onChange={(e) => {
                            const parts = formData.wife_birth_date_ec?.split('-') || ['', '', ''];
                            const newDate = `${parts[0] || ''}-${parts[1] || ''}-${e.target.value}`;
                            handleWifeBirthDateChange(newDate, 'ec');
                          }}
                          className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.wife_birth_date_gc}
                        readOnly
                        placeholder="Gregorian date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ==================== MARRIAGE INFORMATION ==================== */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                <FaCalendarAlt className="text-purple-600" />
                {locale === 'am' ? 'የጋብቻ መረጃ' : 'Marriage Information'}
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
                    placeholder="e.g., MRG-001/2026"
                  />
                </div>
              </div>
              
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
                        {locale === 'am' ? 'የጋብቻ ቀን (ግሪጎሪያን)' : 'Marriage Date (GC)'} *
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
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Year"
                          value={formData.marriage_date_ec?.split('-')[0] || ''}
                          onChange={(e) => {
                            const parts = formData.marriage_date_ec?.split('-') || ['', '', ''];
                            const newDate = `${e.target.value}-${parts[1] || ''}-${parts[2] || ''}`;
                            handleMarriageDateChange(newDate, 'ec');
                          }}
                          className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <select
                          value={formData.marriage_date_ec?.split('-')[1] || ''}
                          onChange={(e) => {
                            const parts = formData.marriage_date_ec?.split('-') || ['', '', ''];
                            const newDate = `${parts[0] || ''}-${e.target.value}-${parts[2] || ''}`;
                            handleMarriageDateChange(newDate, 'ec');
                          }}
                          className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">Month</option>
                          {ETHIOPIAN_MONTHS.map(month => (
                            <option key={month.value} value={month.value}>
                              {locale === 'am' ? month.nameAm : month.nameEn}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          placeholder="Day"
                          min="1"
                          max="30"
                          value={formData.marriage_date_ec?.split('-')[2] || ''}
                          onChange={(e) => {
                            const parts = formData.marriage_date_ec?.split('-') || ['', '', ''];
                            const newDate = `${parts[0] || ''}-${parts[1] || ''}-${e.target.value}`;
                            handleMarriageDateChange(newDate, 'ec');
                          }}
                          className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
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
              </div>

              {/* Marriage Place - Full Address */}
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'የጋብቻ ቦታ (ከተማ/ቀበሌ)' : 'Marriage Place (City/Kebele)'}
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={formData.marriage_place}
                      onChange={(e) => setFormData({...formData, marriage_place: e.target.value})}
                      placeholder={locale === 'am' ? 'ቦታ (እንግሊዝኛ)' : 'Place (English)'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      lang="am"
                      value={formData.marriage_place_am}
                      onChange={(e) => setFormData({...formData, marriage_place_am: e.target.value})}
                      placeholder={locale === 'am' ? 'ቦታ (አማርኛ)' : 'Place (Amharic)'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-ethiopic"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'ዞን ቁጥር' : 'Zone Number'}
                    </label>
                    <input
                      type="text"
                      value={formData.zone}
                      onChange={(e) => setFormData({...formData, zone: e.target.value})}
                      placeholder="e.g., 1, 2, 3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'ወረዳ ቁጥር' : 'Woreda Number'}
                    </label>
                    <input
                      type="text"
                      value={formData.woreda}
                      onChange={(e) => setFormData({...formData, woreda: e.target.value})}
                      placeholder="e.g., 01, 02, 03"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'ክፍለ ከተማ' : 'Sub-City'}
                    </label>
                    <input
                      type="text"
                      value={formData.sub_city}
                      onChange={(e) => setFormData({...formData, sub_city: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'am' ? 'ቀበሌ' : 'Kebele'}
                    </label>
                    <input
                      type="text"
                      value={formData.kebele}
                      onChange={(e) => setFormData({...formData, kebele: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ==================== WITNESSES ==================== */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                <FaUsers className="text-green-600" />
                {locale === 'am' ? 'የምስክሮች መረጃ' : 'Witnesses Information'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'ምስክር 1 ስም' : 'Witness 1 Name'} *
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
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'ምስክር 2 ስም' : 'Witness 2 Name'} *
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
                  />
                </div>
              </div>
            </div>

            {/* ==================== REGISTRAR INFORMATION ==================== */}
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
                {locale === 'am' ? 'የጋብቻ ማስረጃ በተሳካ ሁኔታ ተሰጥቷል' : 'Marriage Certificate Issued Successfully!'}
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

        {/* Camera Modal */}
        {showCamera && (
          <div className="camera-container">
            <div className="bg-white p-4 rounded-xl max-w-md w-full">
              <h3 className="text-lg font-bold mb-3">
                {showCamera === 'husband' ? (locale === 'am' ? 'የሙሽር ፎቶ' : 'Groom Photo') : (locale === 'am' ? 'የሙሽራ ፎቶ' : 'Bride Photo')}
              </h3>
              <video ref={videoRef} autoPlay playsInline className="camera-video"></video>
              <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2"
                >
                  <FaCamera /> {locale === 'am' ? 'ፎቶ አንሳ' : 'Capture'}
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg"
                >
                  {locale === 'am' ? 'ዝጋ' : 'Close'}
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
'use client';

import { withAuth } from '@/components/withAuth';
import Layout from '@/components/Layout';
import { useTranslation } from '@/hooks/useTranslation';
import { useState, useEffect } from 'react';
import { 
  FaGavel, FaPlus, FaSearch, FaEye, FaEdit, 
  FaCalendarAlt, FaFileAlt, FaCheckCircle, 
  FaSpinner, FaTimesCircle, FaUser, FaUsers,
  FaBalanceScale, FaClock, FaArrowLeft, FaUserCheck,
  FaGavel as FaJudge, FaFileSignature, FaHourglassHalf,
  FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendarDay,
  FaGlobe, FaInfoCircle
} from 'react-icons/fa';
import { MdPending, MdVerified, MdLocationOn } from 'react-icons/md';

function SocialCourtPage() {
  const { t, locale } = useTranslation();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showHearingModal, setShowHearingModal] = useState(false);
  const [showJudgmentModal, setShowJudgmentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Form data for case filing
  const [formData, setFormData] = useState({
    plaintiff_id: '',
    plaintiff_name: '',
    defendant_id: '',
    defendant_name: '',
    case_type: 'FAMILY_DISPUTE',
    claim_amount: '',
    description: '',
    assigned_judge_id: ''
  });

  // Search states for plaintiff and defendant
  const [plaintiffSearch, setPlaintiffSearch] = useState('');
  const [defendantSearch, setDefendantSearch] = useState('');
  const [showPlaintiffDropdown, setShowPlaintiffDropdown] = useState(false);
  const [showDefendantDropdown, setShowDefendantDropdown] = useState(false);
  
  // Judge selection states (up to 3 judges)
  const [selectedJudges, setSelectedJudges] = useState([]);
  const [availableJudges, setAvailableJudges] = useState([]);
  const [judgeSearch, setJudgeSearch] = useState('');
  const [showJudgeDropdown, setShowJudgeDropdown] = useState(false);

  const [editData, setEditData] = useState({
    status: '',
    assigned_judge_id: '',
    description: ''
  });
  const [hearingData, setHearingData] = useState({
    hearing_date: '',
    location: 'Kebele Social Court',
    hearing_type: 'REGULAR',
    notes: ''
  });
  const [judgmentData, setJudgmentData] = useState({
    judgment_text: '',
    judgment_amount: '',
    appealed: false,
    appeal_deadline: ''
  });
  const [residents, setResidents] = useState([]);
  const [staff, setStaff] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [caseTypes, setCaseTypes] = useState([]);

  // Open modals
  const openHearingModal = (caseItem) => {
    setSelectedCase(caseItem);
    setHearingData({
      hearing_date: '',
      location: 'Kebele Social Court',
      hearing_type: 'REGULAR',
      notes: ''
    });
    setShowHearingModal(true);
  };

  const openJudgmentModal = (caseItem) => {
    setSelectedCase(caseItem);
    setJudgmentData({
      judgment_text: '',
      judgment_amount: '',
      appealed: false,
      appeal_deadline: ''
    });
    setShowJudgmentModal(true);
  };

  const openEditModal = (caseItem) => {
    setSelectedCase(caseItem);
    setEditData({
      status: caseItem.status,
      description: caseItem.description || ''
    });
    setShowEditModal(true);
  };

  // Fetch all data on mount
  useEffect(() => {
    fetchCases();
    fetchResidents();
    fetchStaff();
    fetchJudges();
    fetchCaseTypes();
  }, []);

  const fetchCases = async () => {
    try {
      const res = await fetch('/api/social-court/cases');
      const data = await res.json();
      if (data.success) {
        setCases(data.cases);
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResidents = async () => {
    try {
      const res = await fetch('/api/residents');
      const data = await res.json();
      if (data.success) {
        setResidents(data.residents);
      }
    } catch (error) {
      console.error('Error fetching residents:', error);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/auth/admin/get-staff');
      const data = await res.json();
      if (Array.isArray(data)) {
        setStaff(data);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const fetchJudges = async () => {
    try {
      const res = await fetch('/api/auth/admin/judges?active=true');
      if (!res.ok) {
        console.error('Failed to fetch judges:', res.status);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setAvailableJudges(data.judges);
      }
    } catch (error) {
      console.error('Error fetching judges:', error);
    }
  };

  const fetchCaseTypes = () => {
    const types = [
      { value: 'FAMILY_DISPUTE', labelEn: '🏠 Family Dispute', labelAm: '🏠 የቤተሰብ ክርክር', labelOm: '🏠 Lolaa Maatii' },
      { value: 'PROPERTY_DISPUTE', labelEn: '🏘️ Property Dispute', labelAm: '🏘️ የንብረት ክርክር', labelOm: '🏘️ Lolaa Qabeenyaa' },
      { value: 'DEBT_COLLECTION', labelEn: '💰 Debt Collection', labelAm: '💰 የዕዳ ማስከፈል', labelOm: '💰 Waldaa Liqii' },
      { value: 'LAND_DISPUTE', labelEn: '🌾 Land Dispute', labelAm: '🌾 የመሬት ክርክር', labelOm: '🌾 Lolaa Lafaa' },
      { value: 'BOUNDARY_DISPUTE', labelEn: '📏 Boundary Dispute', labelAm: '📏 የድንበር ክርክር', labelOm: '📏 Lolaa Daangaa' },
      { value: 'INHERITANCE', labelEn: '📜 Inheritance', labelAm: '📜 ውርስ', labelOm: '📜 Dhaala' },
      { value: 'CONTRACT_BREACH', labelEn: '📝 Contract Breach', labelAm: '📝 የውል ጥሰት', labelOm: '📝 Cabsa Walligaltee' },
      { value: 'NEIGHBOR_DISPUTE', labelEn: '👥 Neighbor Dispute', labelAm: '👥 የጎረቤት ክርክር', labelOm: '👥 Lolaa Ollaa' },
      { value: 'FAMILY_MATTERS', labelEn: '👨‍👩‍👧‍👦 Family Matters', labelAm: '👨‍👩‍👧‍👦 የቤተሰብ ጉዳይ', labelOm: '👨‍👩‍👧‍👦 Waan Maatii' },
      { value: 'LABOR_DISPUTE', labelEn: '⚙️ Labor Dispute', labelAm: '⚙️ የሠራተኛ ክርክር', labelOm: '⚙️ Lolaa Hojjetaa' },
      { value: 'COMPENSATION_CLAIM', labelEn: '💵 Compensation Claim', labelAm: '💵 የካሳ ጥያቄ', labelOm: '💵 Iyyannaa Kirii' },
      { value: 'OTHER_CIVIL', labelEn: '📋 Other Civil Matter', labelAm: '📋 ሌላ ሲቪል ጉዳይ', labelOm: '📋 Waan Biroo Sibiilii' }
    ];
    setCaseTypes(types);
  };

  // Filter residents for search
  const filteredPlaintiffs = residents.filter(r => 
    `${r.fname} ${r.lname}`.toLowerCase().includes(plaintiffSearch.toLowerCase()) ||
    r.house_id?.toLowerCase().includes(plaintiffSearch.toLowerCase())
  ).slice(0, 10);

  const filteredDefendants = residents.filter(r => 
    `${r.fname} ${r.lname}`.toLowerCase().includes(defendantSearch.toLowerCase()) ||
    r.house_id?.toLowerCase().includes(defendantSearch.toLowerCase())
  ).slice(0, 10);

  // Filter judges for selection
  const filteredJudges = availableJudges.filter(j => 
    j.full_name.toLowerCase().includes(judgeSearch.toLowerCase())
  ).slice(0, 10);

  // Selection handlers
  const selectPlaintiff = (resident) => {
    setFormData(prev => ({
      ...prev,
      plaintiff_id: resident.resident_id,
      plaintiff_name: `${resident.fname} ${resident.lname}`
    }));
    setPlaintiffSearch(`${resident.fname} ${resident.lname}`);
    setShowPlaintiffDropdown(false);
  };

  const selectDefendant = (resident) => {
    setFormData(prev => ({
      ...prev,
      defendant_id: resident.resident_id,
      defendant_name: `${resident.fname} ${resident.lname}`
    }));
    setDefendantSearch(`${resident.fname} ${resident.lname}`);
    setShowDefendantDropdown(false);
  };

  const addJudge = (judge) => {
    if (selectedJudges.length >= 3) {
      alert(locale === 'am' ? 'ለአንድ ጉዳይ እስከ 3 ዳኞችን ብቻ መምረጥ ይችላሉ' : 
             locale === 'om' ? 'Murtiidhaa tokkoof abbootii murtii 3 qofa filachuu dandeessu' : 
             'You can only select up to 3 judges for a case');
      return;
    }
    if (!selectedJudges.find(j => j.judge_id === judge.judge_id)) {
      setSelectedJudges([...selectedJudges, judge]);
    }
    setJudgeSearch('');
    setShowJudgeDropdown(false);
  };

  const removeJudge = (judgeId) => {
    setSelectedJudges(selectedJudges.filter(j => j.judge_id !== judgeId));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      plaintiff_id: '',
      plaintiff_name: '',
      defendant_id: '',
      defendant_name: '',
      case_type: 'FAMILY_DISPUTE',
      claim_amount: '',
      description: '',
      assigned_judge_id: ''
    });
    setPlaintiffSearch('');
    setDefendantSearch('');
    setSelectedJudges([]);
    setJudgeSearch('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedJudges.length === 0) {
      alert(locale === 'am' ? 'እባክዎ ለዚህ ጉዳይ ቢያንስ አንድ ዳኛ ይምረጡ' : 
             locale === 'om' ? 'Murtiidhaa kanaaf murtii tokkoo filadhu' : 
             'Please select at least one judge for this case');
      return;
    }
    
    setSubmitting(true);
    
    const submissionData = {
      plaintiff_id: formData.plaintiff_id || null,
      plaintiff_name: formData.plaintiff_name,
      defendant_id: formData.defendant_id || null,
      defendant_name: formData.defendant_name,
      case_type: formData.case_type,
      claim_amount: formData.claim_amount === '' ? null : formData.claim_amount,
      description: formData.description,
      assigned_judge_ids: selectedJudges.map(j => j.judge_id)
    };
    
    try {
      const res = await fetch('/api/social-court/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert(locale === 'am' ? 'ጉዳዩ በተሳካ ሁኔታ ቀርቧል!' : 
               locale === 'om' ? 'Dhimichi milkaa\'inaan dhiyaate!' : 
               'Case filed successfully!');
        setShowModal(false);
        resetForm();
        fetchCases();
      } else {
        alert(data.error || (locale === 'am' ? 'ጉዳዩን ማቅረብ አልተቻለም' : 
               locale === 'om' ? 'Dhimichi dhiyaachuu hin danda\'ne' : 
               'Failed to file case'));
      }
    } catch (error) {
      console.error('Error filing case:', error);
      alert(locale === 'am' ? 'የአውታረ መረብ ስህተት እባክዎ ይደግሙ' : 
             locale === 'om' ? 'Dogoggora netiworkii Mee irra deebi\'aa' : 
             'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCase = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const res = await fetch('/api/social-court/cases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: selectedCase.case_id,
          ...editData
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert(locale === 'am' ? 'ጉዳዩ ተሻሽሏል!' : 
               locale === 'om' ? 'Dhimichi fooyya\'e!' : 
               'Case updated successfully!');
        setShowEditModal(false);
        fetchCases();
        viewCaseDetails(selectedCase.case_id);
      } else {
        alert(data.error || (locale === 'am' ? 'ጉዳዩን ማሻሻል አልተቻለም' : 
               locale === 'om' ? 'Dhimichi fooyya\'uu hin danda\'ne' : 
               'Failed to update case'));
      }
    } catch (error) {
      console.error('Error updating case:', error);
      alert(locale === 'am' ? 'የአውታረ መረብ ስህተት' : 
             locale === 'om' ? 'Dogoggora netiworkii' : 
             'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const scheduleHearing = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const res = await fetch('/api/social-court/hearings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: selectedCase.case_id,
          ...hearingData
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert(locale === 'am' ? 'ችሎት በተሳካ ሁኔታ ቀጠሮ ተይዟል!' : 
               locale === 'om' ? 'Murtiin milkaa\'inaan qindaa\'e!' : 
               'Hearing scheduled successfully!');
        setShowHearingModal(false);
        setHearingData({
          hearing_date: '',
          location: 'Kebele Social Court',
          hearing_type: 'REGULAR',
          notes: ''
        });
        fetchCases();
        if (selectedCase) {
          viewCaseDetails(selectedCase.case_id);
        }
      } else {
        alert(data.error || (locale === 'am' ? 'ችሎት ቀጠሮ ማስያዝ አልተቻለም' : 
               locale === 'om' ? 'Murtiin qindaa\'uu hin danda\'ne' : 
               'Failed to schedule hearing'));
      }
    } catch (error) {
      console.error('Error scheduling hearing:', error);
      alert(locale === 'am' ? 'የአውታረ መረብ ስህተት' : 
             locale === 'om' ? 'Dogoggora netiworkii' : 
             'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const issueJudgment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const res = await fetch('/api/social-court/judgments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: selectedCase.case_id,
          ...judgmentData
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert(locale === 'am' ? 'ውሳኔ በተሳካ ሁኔታ ተሰጥቷል!' : 
               locale === 'om' ? 'Murtiin milkaa\'inaan kenneefame!' : 
               'Judgment issued successfully!');
        setShowJudgmentModal(false);
        setJudgmentData({
          judgment_text: '',
          judgment_amount: '',
          appealed: false,
          appeal_deadline: ''
        });
        fetchCases();
        if (selectedCase) {
          viewCaseDetails(selectedCase.case_id);
        }
      } else {
        alert(data.error || (locale === 'am' ? 'ውሳኔ መስጠት አልተቻለም' : 
               locale === 'om' ? 'Murtiin kennamee hin danda\'ne' : 
               'Failed to issue judgment'));
      }
    } catch (error) {
      console.error('Error issuing judgment:', error);
      alert(locale === 'am' ? 'የአውታረ መረብ ስህተት' : 
             locale === 'om' ? 'Dogoggora netiworkii' : 
             'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const viewCaseDetails = async (caseId) => {
    try {
      const [caseRes, hearingsRes, judgmentRes] = await Promise.all([
        fetch(`/api/social-court/cases?case_id=${caseId}`),
        fetch(`/api/social-court/hearings?case_id=${caseId}`),
        fetch(`/api/social-court/judgments?case_id=${caseId}`)
      ]);
      
      const caseData = await caseRes.json();
      const hearingsData = await hearingsRes.json();
      const judgmentDataObj = await judgmentRes.json();
      
      if (caseData.success && caseData.cases.length > 0) {
        setSelectedCase({
          ...caseData.cases[0],
          hearings: hearingsData.hearings || [],
          judgment: judgmentDataObj.judgment
        });
        setEditData({
          status: caseData.cases[0].status,
          assigned_judge_id: caseData.cases[0].assigned_judge_id || '',
          description: caseData.cases[0].description || ''
        });
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Error fetching case details:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusLabels = {
      PENDING: locale === 'am' ? 'በመጠባበቅ ላይ' : locale === 'om' ? 'Eega' : 'Pending',
      IN_PROGRESS: locale === 'am' ? 'በሂደት ላይ' : locale === 'om' ? 'Adeemsa irra' : 'In Progress',
      RESOLVED: locale === 'am' ? 'ተፈቷል' : locale === 'om' ? 'Xumurame' : 'Resolved',
      APPEALED: locale === 'am' ? 'ይግባኝ ቀርቧል' : locale === 'om' ? 'Murtii ol-eesse' : 'Appealed',
      CLOSED: locale === 'am' ? 'ተዘግቷል' : locale === 'om' ? 'Cufame' : 'Closed'
    };
    
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      IN_PROGRESS: 'bg-blue-100 text-blue-700',
      RESOLVED: 'bg-green-100 text-green-700',
      APPEALED: 'bg-purple-100 text-purple-700',
      CLOSED: 'bg-gray-100 text-gray-700'
    };
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.PENDING}`}>
        {statusLabels[status] || statusLabels.PENDING}
      </span>
    );
  };

  const getCaseTypeLabel = (type) => {
    const found = caseTypes.find(ct => ct.value === type);
    if (!found) return type;
    if (locale === 'am') return found.labelAm;
    if (locale === 'om') return found.labelOm;
    return found.labelEn;
  };

  const filteredCases = cases.filter(c => {
    const matchesSearch = c.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.plaintiff_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.defendant_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: cases.length,
    pending: cases.filter(c => c.status === 'PENDING').length,
    inProgress: cases.filter(c => c.status === 'IN_PROGRESS').length,
    resolved: cases.filter(c => c.status === 'RESOLVED').length
  };

  return (
    <Layout role="Kebele Manager">
      <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FaGavel className="text-blue-600" /> 
              {locale === 'am' ? 'የማህበረሰብ ፍርድ ቤት አስተዳደር' : 
               locale === 'om' ? 'Bulchiinsa Murtii Hawaasa' : 
               'Social Court Management'}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {locale === 'am' ? 'ጉዳዮችን ያስተዳድሩ፣ ችሎቶችን ይያዙ እና ውሳኔዎችን ይስጡ' : 
               locale === 'om' ? 'Dhimmaawwan bulchi, murtiiwwan qindeessi, fi murtiiwwan kenni' : 
               'Manage cases, schedule hearings, and issue judgments'}
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition flex items-center gap-2 shadow-sm"
          >
            <FaPlus size={14} /> 
            {locale === 'am' ? 'አዲስ ጉዳይ አቅርብ' : 
             locale === 'om' ? 'Dhimicha Haaraa Galmeessi' : 
             'File New Case'}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                <p className="text-xs text-gray-500">
                  {locale === 'am' ? 'ጠቅላላ ጉዳዮች' : locale === 'om' ? 'Dhimmaawwan Waligalaa' : 'Total Cases'}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FaGavel className="text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-xs text-gray-500">
                  {locale === 'am' ? 'በመጠባበቅ ላይ' : locale === 'om' ? 'Eega' : 'Pending'}
                </p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <MdPending className="text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                <p className="text-xs text-gray-500">
                  {locale === 'am' ? 'በሂደት ላይ' : locale === 'om' ? 'Adeemsa irra' : 'In Progress'}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FaHourglassHalf className="text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                <p className="text-xs text-gray-500">
                  {locale === 'am' ? 'ተፈትቷል' : locale === 'om' ? 'Xumurame' : 'Resolved'}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <FaCheckCircle className="text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={locale === 'am' ? 'በጉዳይ ቁጥር፣ ከሳሽ ወይም ተከሳሽ ይፈልጉ...' : 
                           locale === 'om' ? 'Lakkoofsa dhimichaa, himataa ykn himatamaa barbaadi...' : 
                           'Search by case number, plaintiff, or defendant...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{locale === 'am' ? 'ሁሉም ሁኔታ' : locale === 'om' ? 'Haala Hunda' : 'All Status'}</option>
              <option value="PENDING">{locale === 'am' ? 'በመጠባበቅ ላይ' : locale === 'om' ? 'Eega' : 'Pending'}</option>
              <option value="IN_PROGRESS">{locale === 'am' ? 'በሂደት ላይ' : locale === 'om' ? 'Adeemsa irra' : 'In Progress'}</option>
              <option value="RESOLVED">{locale === 'am' ? 'ተፈትቷል' : locale === 'om' ? 'Xumurame' : 'Resolved'}</option>
              <option value="APPEALED">{locale === 'am' ? 'ይግባኝ ቀርቧል' : locale === 'om' ? 'Murtii ol-eesse' : 'Appealed'}</option>
              <option value="CLOSED">{locale === 'am' ? 'ተዘግቷል' : locale === 'om' ? 'Cufame' : 'Closed'}</option>
            </select>
          </div>
        </div>

        {/* Cases Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <FaSpinner className="animate-spin text-4xl text-blue-600" />
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="text-center py-12">
              <FaGavel className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600">
                {locale === 'am' ? 'ምንም ጉዳዮች አልተገኙም' : 
                 locale === 'om' ? 'Dhimmaawwan hin argamne' : 
                 'No cases found'}
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                {locale === 'am' ? 'ለመጀመር "አዲስ ጉዳይ አቅርብ" ን ጠቅ ያድርጉ' : 
                 locale === 'om' ? 'Waan eegaluuf “Dhimicha Haaraa Galmeessi” tuqi' : 
                 'Click "File New Case" to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      {locale === 'am' ? 'የጉዳይ ቁጥር' : locale === 'om' ? 'Lakkoofsa Dhimichaa' : 'Case Number'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      {locale === 'am' ? 'ከሳሽ' : locale === 'om' ? 'Himataa' : 'Plaintiff'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      {locale === 'am' ? 'ተከሳሽ' : locale === 'om' ? 'Himatamaa' : 'Defendant'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      {locale === 'am' ? 'አይነት' : locale === 'om' ? 'Gosa' : 'Type'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      {locale === 'am' ? 'ቀን' : locale === 'om' ? 'Guyyaa' : 'Date'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      {locale === 'am' ? 'ሁኔታ' : locale === 'om' ? 'Haala' : 'Status'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      {locale === 'am' ? 'ድርጊቶች' : locale === 'om' ? 'Gocha' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCases.map((caseItem) => (
                    <tr key={caseItem.case_id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-mono text-sm font-medium text-gray-800">{caseItem.case_number}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{caseItem.plaintiff_name || caseItem.plaintiff_full_name || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{caseItem.defendant_name || caseItem.defendant_full_name || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{getCaseTypeLabel(caseItem.case_type)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(caseItem.filing_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(caseItem.status)}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => viewCaseDetails(caseItem.case_id)}
                          className="text-blue-600 hover:text-blue-700 p-1 transition"
                          title={locale === 'am' ? 'ዝርዝሮችን ይመልከቱ' : locale === 'om' ? 'Gadifageenya ilaali' : 'View Details'}
                        >
                          <FaEye size={18} />
                        </button>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ================= CREATE CASE MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FaPlus className="text-blue-600" /> 
                {locale === 'am' ? 'አዲስ ጉዳይ አቅርብ' : locale === 'om' ? 'Dhimicha Haaraa Galmeessi' : 'File New Case'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimesCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Plaintiff Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'ከሳሽ ይፈልጉ' : locale === 'om' ? 'Himataa Barbaadi' : 'Search Plaintiff (Optional)'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={plaintiffSearch}
                      onChange={(e) => {
                        setPlaintiffSearch(e.target.value);
                        setShowPlaintiffDropdown(true);
                        if (!e.target.value) {
                          setFormData(prev => ({ ...prev, plaintiff_id: '', plaintiff_name: '' }));
                        }
                      }}
                      onFocus={() => setShowPlaintiffDropdown(true)}
                      placeholder={locale === 'am' ? 'በስም ወይም ቤት ቁጥር ይፈልጉ...' : locale === 'om' ? 'Maqaadhaan ykn lakkoofsa manaatiin barbaadi...' : 'Search by name or house number...'}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {showPlaintiffDropdown && filteredPlaintiffs.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {filteredPlaintiffs.map(r => (
                          <button
                            key={r.resident_id}
                            type="button"
                            onClick={() => selectPlaintiff(r)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                          >
                            <div className="font-medium">{r.fname} {r.lname}</div>
                            <div className="text-xs text-gray-500">House: {r.house_id}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Defendant Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'ተከሳሽ ይፈልጉ' : locale === 'om' ? 'Himatamaa Barbaadi' : 'Search Defendant (Optional)'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={defendantSearch}
                      onChange={(e) => {
                        setDefendantSearch(e.target.value);
                        setShowDefendantDropdown(true);
                        if (!e.target.value) {
                          setFormData(prev => ({ ...prev, defendant_id: '', defendant_name: '' }));
                        }
                      }}
                      onFocus={() => setShowDefendantDropdown(true)}
                      placeholder={locale === 'am' ? 'በስም ወይም ቤት ቁጥር ይፈልጉ...' : locale === 'om' ? 'Maqaadhaan ykn lakkoofsa manaatiin barbaadi...' : 'Search by name or house number...'}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {showDefendantDropdown && filteredDefendants.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {filteredDefendants.map(r => (
                          <button
                            key={r.resident_id}
                            type="button"
                            onClick={() => selectDefendant(r)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                          >
                            <div className="font-medium">{r.fname} {r.lname}</div>
                            <div className="text-xs text-gray-500">House: {r.house_id}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Plaintiff Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'የከሳሽ ስም' : locale === 'om' ? 'Maqaa Himataa' : 'Plaintiff Name'} *
                  </label>
                  <input
                    type="text"
                    name="plaintiff_name"
                    value={formData.plaintiff_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* Defendant Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'የተከሳሽ ስም' : locale === 'om' ? 'Maqaa Himatamaa' : 'Defendant Name'} *
                  </label>
                  <input
                    type="text"
                    name="defendant_name"
                    value={formData.defendant_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* Case Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'የጉዳይ አይነት' : locale === 'om' ? 'Gosa Dhimichaa' : 'Case Type'} *
                  </label>
                  <select
                    name="case_type"
                    value={formData.case_type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {caseTypes.map(type => {
                      let label;
                      if (locale === 'am') label = type.labelAm;
                      else if (locale === 'om') label = type.labelOm;
                      else label = type.labelEn;
                      return (
                        <option key={type.value} value={type.value}>{label}</option>
                      );
                    })}
                  </select>
                </div>
                
                {/* Claim Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'የይገባኛል ጥያቄ መጠን (ብር)' : locale === 'om' ? 'Gatii Iyyannoo (Birrii)' : 'Claim Amount (Birr)'}
                  </label>
                  <input
                    type="number"
                    name="claim_amount"
                    value={formData.claim_amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                    min="0"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {locale === 'am' ? 'ለገንዘብ ላልሆኑ ጉዳዮች ባዶ ይተው' : 
                     locale === 'om' ? 'Dhimmawwan maallaqa hin taaneef duwwaa dhiisi' : 
                     'Leave empty for non-monetary cases'}
                  </p>
                </div>
                
                {/* Judges Selection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'የዳኞች ቡድን' : locale === 'om' ? 'Garee Abbaa Murtii' : 'Judges Panel'} *
                  </label>
                  
                  {/* Selected Judges Display */}
                  {selectedJudges.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {selectedJudges.map(judge => (
                        <div key={judge.judge_id} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                          <FaUserCheck className="text-xs" />
                          {judge.full_name}
                          <button
                            type="button"
                            onClick={() => removeJudge(judge.judge_id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FaTimesCircle size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Judge Search Dropdown */}
                  <div className="relative">
                    <input
                      type="text"
                      value={judgeSearch}
                      onChange={(e) => {
                        setJudgeSearch(e.target.value);
                        setShowJudgeDropdown(true);
                      }}
                      onFocus={() => setShowJudgeDropdown(true)}
                      placeholder={selectedJudges.length >= 3 ? 
                      (locale === 'am' ? 'ከፍተኛ 3 ዳኞች ተመርጠዋል' : 
                      locale === 'om' ? 'Abbootiin murtii 3 filataniiru' : 
                      'Maximum 3 judges selected') : 
                      (locale === 'am' ? 'ዳኞችን ይፈልጉ እና ይጨምሩ...' : 
                      locale === 'om' ? 'Abbaawwan murtii barbaadii iddu...' : 
                      'Search and add judges...')}
                      disabled={selectedJudges.length >= 3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                    {showJudgeDropdown && filteredJudges.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {filteredJudges
                          .filter(j => !selectedJudges.find(sj => sj.judge_id === j.judge_id))
                          .map(judge => (
                            <button
                              key={judge.judge_id}
                              type="button"
                              onClick={() => addJudge(judge)}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0 flex justify-between items-center"
                            >
                              <div>
                                <div className="font-medium">{judge.full_name}</div>
                                <div className="text-xs text-gray-500">
                                  {judge.experience_years} {locale === 'am' ? 'ዓመታት ልምድ' : locale === 'om' ? 'waggaa muuxannoo' : 'years exp.'}
                                </div>
                              </div>
                              <FaPlus className="text-green-600 text-xs" />
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {locale === 'am' ? `${selectedJudges.length}/3 ዳኞች ተመርጠዋል` : 
                     locale === 'om' ? `${selectedJudges.length}/3 abbootiin murtii filataniiru` : 
                     `${selectedJudges.length}/3 judges selected`}
                  </p>
                </div>
                
                {/* Case Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'የጉዳዩ መግለጫ' : locale === 'om' ? 'Ibsa Dhimichaa' : 'Case Description'} *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows="5"
                    placeholder={locale === 'am' ? 'የጉዳዩን ዝርዝር፣ ክርክር እና ጥያቄዎች ይግለጹ...' : 
                      locale === 'om' ? 'Ibsa dhimichaa, lolaa fi iyyannoo ibsi...' : 
                      'Describe the case details, dispute, and claims...'}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  {locale === 'am' ? 'ሰርዝ' : locale === 'om' ? 'Haqi' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center justify-center gap-2"
                >
                  {submitting ? <FaSpinner className="animate-spin" /> : <FaGavel />}
                  {submitting ? (locale === 'am' ? 'በማስገባት ላይ...' : locale === 'om' ? 'Galmeessaa...' : 'Filing...') : 
                  (locale === 'am' ? 'ጉዳይ አቅርብ' : locale === 'om' ? 'Dhimicha Galmeessi' : 'File Case')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= CASE DETAILS MODAL ================= */}
      {showDetailsModal && selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FaEye className="text-blue-600" /> 
                {locale === 'am' ? 'የጉዳይ ዝርዝሮች' : locale === 'om' ? 'Gadifageenya Dhimichaa' : 'Case Details'}
              </h2>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimesCircle size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Case Header */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <p className="text-xs text-gray-500">
                      {locale === 'am' ? 'የጉዳይ ቁጥር' : locale === 'om' ? 'Lakkoofsa Dhimichaa' : 'Case Number'}
                    </p>
                    <p className="text-lg font-bold text-gray-800 font-mono">{selectedCase.case_number}</p>
                  </div>
                  <div>
                    {getStatusBadge(selectedCase.status)}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-xs text-gray-500">
                      {locale === 'am' ? 'የተመደበ ቀን' : locale === 'om' ? 'Guyyaa Ramadame' : 'Filed Date'}
                    </p>
                    <p className="text-sm">{new Date(selectedCase.filing_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">
                      {locale === 'am' ? 'የጉዳይ አይነት' : locale === 'om' ? 'Gosa Dhimichaa' : 'Case Type'}
                    </p>
                    <p className="text-sm">{getCaseTypeLabel(selectedCase.case_type)}</p>
                  </div>
                </div>
              </div>
              
              {/* Parties */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                  <p className="text-xs text-green-600 uppercase font-semibold">
                    {locale === 'am' ? 'ከሳሽ' : locale === 'om' ? 'Himataa' : 'PLAINTIFF'}
                  </p>
                  <p className="text-lg font-medium text-gray-800">{selectedCase.plaintiff_name || selectedCase.plaintiff_full_name || '—'}</p>
                  {selectedCase.plaintiff_id && (
                    <p className="text-xs text-gray-500 mt-1">ID: {selectedCase.plaintiff_id}</p>
                  )}
                </div>
                <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
                  <p className="text-xs text-red-600 uppercase font-semibold">
                    {locale === 'am' ? 'ተከሳሽ' : locale === 'om' ? 'Himatamaa' : 'DEFENDANT'}
                  </p>
                  <p className="text-lg font-medium text-gray-800">{selectedCase.defendant_name || selectedCase.defendant_full_name || '—'}</p>
                  {selectedCase.defendant_id && (
                    <p className="text-xs text-gray-500 mt-1">ID: {selectedCase.defendant_id}</p>
                  )}
                </div>
              </div>
              
              {/* Assigned Judges */}
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-xs text-blue-600 uppercase font-semibold mb-2">
                  {locale === 'am' ? 'የተመደቡ ዳኞች' : locale === 'om' ? 'Abbootii Murtii Ramadamani' : 'Assigned Judges'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedCase.assigned_judges && selectedCase.assigned_judges.length > 0 ? (
                    selectedCase.assigned_judges.map((judge, idx) => (
                      <div key={idx} className="bg-white px-3 py-1 rounded-full text-sm flex items-center gap-2 shadow-sm">
                        <FaUserCheck className="text-blue-600 text-xs" />
                        {judge.name}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">—</p>
                  )}
                </div>
              </div>
              
              {/* Claim Amount */}
              {selectedCase.claim_amount && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-xs text-yellow-600 uppercase font-semibold">
                    {locale === 'am' ? 'የይገባኛል ጥያቄ መጠን' : locale === 'om' ? 'Gatii Iyyannoo' : 'Claim Amount'}
                  </p>
                  <p className="text-lg font-bold text-gray-800">Br {parseFloat(selectedCase.claim_amount).toLocaleString()}</p>
                </div>
              )}
              
              {/* Description */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                  {locale === 'am' ? 'መግለጫ' : locale === 'om' ? 'Ibsa' : 'Description'}
                </p>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedCase.description || '—'}</p>
              </div>
              
              {/* Hearings Section */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <FaCalendarAlt className="text-green-600" />
                    {locale === 'am' ? 'ችሎቶች' : locale === 'om' ? 'Murtiiwwan' : 'Hearings'}
                  </h3>
                  {selectedCase.status !== 'RESOLVED' && selectedCase.status !== 'CLOSED' && (
                    <button
                      onClick={() => openHearingModal(selectedCase)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition flex items-center gap-1"
                    >
                      <FaPlus size={12} /> 
                      {locale === 'am' ? 'ችሎት ያዝ' : locale === 'om' ? 'Murtii Qindeessi' : 'Schedule Hearing'}
                    </button>
                  )}
                </div>
                {selectedCase.hearings && selectedCase.hearings.length > 0 ? (
                  <div className="space-y-2">
                    {selectedCase.hearings.map((hearing, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-800">
                              {new Date(hearing.hearing_date).toLocaleDateString()} 
                              {hearing.hearing_type === 'EMERGENCY' && ' 🚨'}
                            </p>
                            <p className="text-sm text-gray-600">{hearing.location}</p>
                          </div>
                          {hearing.outcome && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              {hearing.outcome}
                            </span>
                          )}
                        </div>
                        {hearing.notes && <p className="text-xs text-gray-500 mt-1">{hearing.notes}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    {locale === 'am' ? 'ምንም ችሎቶች አልተያዙም' : locale === 'om' ? 'Murtiin kamillee hin qindaa\'anne' : 'No hearings scheduled'}
                  </p>
                )}
              </div>
              
              {/* Judgment Section */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <FaGavel className="text-purple-600" />
                    {locale === 'am' ? 'ውሳኔ' : locale === 'om' ? 'Murtii' : 'Judgment'}
                  </h3>
                  {!selectedCase.judgment && selectedCase.status !== 'RESOLVED' && selectedCase.status !== 'CLOSED' && (
                    <button
                      onClick={() => openJudgmentModal(selectedCase)}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition flex items-center gap-1"
                    >
                      <FaGavel size={12} /> 
                      {locale === 'am' ? 'ውሳኔ ስጥ' : locale === 'om' ? 'Murtii Kenni' : 'Issue Judgment'}
                    </button>
                  )}
                </div>
                {selectedCase.judgment ? (
                  <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedCase.judgment.judgment_text}</p>
                    {selectedCase.judgment.judgment_amount && (
                      <p className="text-sm font-semibold text-gray-800 mt-2">
                        {locale === 'am' ? 'የውሳኔ መጠን:' : locale === 'om' ? 'Gatii Murtii:' : 'Judgment Amount:'} Br {parseFloat(selectedCase.judgment.judgment_amount).toLocaleString()}
                      </p>
                    )}
                    {selectedCase.judgment.appealed && (
                      <p className="text-xs text-orange-600 mt-2">
                        {locale === 'am' ? 'ይግባኝ ቀርቧል' : locale === 'om' ? 'Murtii ol-eesse' : 'Appealed'}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    {locale === 'am' ? 'ውሳኔ አልተሰጠም' : locale === 'om' ? 'Murtii hin kennamne' : 'No judgment issued yet'}
                  </p>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => openEditModal(selectedCase)}
                  className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition flex items-center justify-center gap-2"
                >
                  <FaEdit /> {locale === 'am' ? 'አርትዕ' : locale === 'om' ? 'Fooyyeessi' : 'Edit'}
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition"
                >
                  {locale === 'am' ? 'ዝጋ' : locale === 'om' ? 'Cufi' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= HEARING MODAL ================= */}
      {showHearingModal && selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                {locale === 'am' ? 'ችሎት ያዝ' : locale === 'om' ? 'Murtii Qindeessi' : 'Schedule Hearing'}
              </h2>
              <button onClick={() => setShowHearingModal(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimesCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={scheduleHearing} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale === 'am' ? 'ቀን እና ሰዓት' : locale === 'om' ? 'Guyyaa fi Yeroo' : 'Date & Time'} *
                </label>
                <input
                  type="datetime-local"
                  value={hearingData.hearing_date}
                  onChange={(e) => setHearingData({...hearingData, hearing_date: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale === 'am' ? 'ቦታ' : locale === 'om' ? 'Iddoo' : 'Location'}
                </label>
                <input
                  type="text"
                  value={hearingData.location}
                  onChange={(e) => setHearingData({...hearingData, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale === 'am' ? 'የችሎት አይነት' : locale === 'om' ? 'Gosa Murtii' : 'Hearing Type'}
                </label>
                <select
                  value={hearingData.hearing_type}
                  onChange={(e) => setHearingData({...hearingData, hearing_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="REGULAR">Regular</option>
                  <option value="EMERGENCY">Emergency</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale === 'am' ? 'ማስታወሻ' : locale === 'om' ? 'Yaadannoo' : 'Notes'}
                </label>
                <textarea
                  value={hearingData.notes}
                  onChange={(e) => setHearingData({...hearingData, notes: e.target.value})}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowHearingModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  {locale === 'am' ? 'ሰርዝ' : locale === 'om' ? 'Haqi' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2"
                >
                  {submitting ? <FaSpinner className="animate-spin" /> : <FaCalendarAlt />}
                  {locale === 'am' ? 'ችሎት ያዝ' : locale === 'om' ? 'Murtii Qindeessi' : 'Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= JUDGMENT MODAL ================= */}
      {showJudgmentModal && selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                {locale === 'am' ? 'ውሳኔ ስጥ' : locale === 'om' ? 'Murtii Kenni' : 'Issue Judgment'}
              </h2>
              <button onClick={() => setShowJudgmentModal(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimesCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={issueJudgment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale === 'am' ? 'የውሳኔ ይዘት' : locale === 'om' ? 'Ibsa Murtii' : 'Judgment Text'} *
                </label>
                <textarea
                  value={judgmentData.judgment_text}
                  onChange={(e) => setJudgmentData({...judgmentData, judgment_text: e.target.value})}
                  required
                  rows="6"
                  placeholder={locale === 'am' ? 'የውሳኔውን ዝርዝር ይግለጹ...' : 'Enter judgment details...'}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale === 'am' ? 'የውሳኔ መጠን (ብር)' : locale === 'om' ? 'Gatii Murtii (Birrii)' : 'Judgment Amount (Birr)'}
                </label>
                <input
                  type="number"
                  value={judgmentData.judgment_amount}
                  onChange={(e) => setJudgmentData({...judgmentData, judgment_amount: e.target.value})}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  step="0.01"
                />
              </div>
              
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={judgmentData.appealed}
                    onChange={(e) => setJudgmentData({...judgmentData, appealed: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">
                    {locale === 'am' ? 'ይግባኝ ቀርቧል' : locale === 'om' ? 'Murtii ol-eesse' : 'Appealed'}
                  </span>
                </label>
              </div>
              
              {judgmentData.appealed && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'am' ? 'የይግባኝ ቀነ ገደብ' : locale === 'om' ? 'Yeroo daangaa murtii ol-eessaa' : 'Appeal Deadline'}
                  </label>
                  <input
                    type="date"
                    value={judgmentData.appeal_deadline}
                    onChange={(e) => setJudgmentData({...judgmentData, appeal_deadline: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowJudgmentModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  {locale === 'am' ? 'ሰርዝ' : locale === 'om' ? 'Haqi' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center justify-center gap-2"
                >
                  {submitting ? <FaSpinner className="animate-spin" /> : <FaGavel />}
                  {locale === 'am' ? 'ውሳኔ ስጥ' : locale === 'om' ? 'Murtii Kenni' : 'Issue Judgment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT CASE MODAL ================= */}
      {showEditModal && selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                {locale === 'am' ? 'ጉዳይ አርትዕ' : locale === 'om' ? 'Dhimicha Fooyyeessi' : 'Edit Case'}
              </h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimesCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateCase} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale === 'am' ? 'ሁኔታ' : locale === 'om' ? 'Haala' : 'Status'}
                </label>
                <select
                  name="status"
                  value={editData.status}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="APPEALED">Appealed</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale === 'am' ? 'መግለጫ' : locale === 'om' ? 'Ibsa' : 'Description'}
                </label>
                <textarea
                  name="description"
                  value={editData.description}
                  onChange={handleEditChange}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  {locale === 'am' ? 'ሰርዝ' : locale === 'om' ? 'Haqi' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg flex items-center justify-center gap-2"
                >
                  {submitting ? <FaSpinner className="animate-spin" /> : <FaEdit />}
                  {locale === 'am' ? 'አርትዕ' : locale === 'om' ? 'Fooyyeessi' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

// ✅ Only ONE default export - the wrapped component
export default withAuth(SocialCourtPage, ['Kebele Manager']);
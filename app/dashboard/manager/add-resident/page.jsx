'use client';

import { withAuth } from '@/components/withAuth';
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  FaUser, FaHome, FaBriefcase, FaPhone, FaIdCard,
  FaCheckCircle, FaChevronRight, FaChevronLeft,
  FaUserFriends, FaMapMarkerAlt,
  FaCalendarAlt, FaSave, FaSearch, FaPlus, FaTimes,
  FaSpinner, FaExclamationTriangle, FaExchangeAlt,
  FaUpload, FaFilePdf, FaInfoCircle, FaGlobe,
  FaLanguage  
} from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';
import { GiFamilyHouse } from 'react-icons/gi';
import { IoPersonAddSharp } from 'react-icons/io5';
import { useTranslation } from '@/hooks/useTranslation';
import Sidebar from '@/components/Sidebar';

// ==================== STEPS DEFINITION ====================
const STEPS = [
  { 
    id: 1, 
    labelKey: 'addResident.steps.personalInfo', 
    descKey: 'addResident.steps.personalInfoDesc', 
    icon: FaUser 
  },
  { 
    id: 2, 
    labelKey: 'addResident.steps.household', 
    descKey: 'addResident.steps.householdDesc', 
    icon: GiFamilyHouse 
  },
  { 
    id: 3, 
    labelKey: 'addResident.steps.contactJob', 
    descKey: 'addResident.steps.contactJobDesc', 
    icon: FaPhone 
  },
  { 
    id: 4, 
    labelKey: 'addResident.steps.review', 
    descKey: 'addResident.steps.reviewDesc', 
    icon: MdVerified 
  },
];

// ==================== CONSTANTS ====================
const HOUSEHOLD_ROLES = [
  { labelKey: 'addResident.labels.head', value: 'Head' },
  { labelKey: 'addResident.labels.spouse', value: 'Spouse' },
  { labelKey: 'addResident.labels.son', value: 'Son' },
  { labelKey: 'addResident.labels.daughter', value: 'Daughter' },
  { labelKey: 'addResident.labels.father', value: 'Father' },
  { labelKey: 'addResident.labels.mother', value: 'Mother' },
  { labelKey: 'addResident.labels.otherDependent', value: 'Other Dependent' },
];

const GENDERS = [
  { labelKey: 'addResident.labels.male', value: 'Male' },
  { labelKey: 'addResident.labels.female', value: 'Female' },
];

const MARITAL_STATUSES = [
  { labelKey: 'addResident.labels.single', value: 'Single' },
  { labelKey: 'addResident.labels.married', value: 'Married' },
  { labelKey: 'addResident.labels.divorced', value: 'Divorced' },
  { labelKey: 'addResident.labels.widowed', value: 'Widowed' },
];

const EDUCATION_LEVELS_EN = [
  'No Formal Education', 'Primary (1-8)', 'Secondary (9-12)', 'TVET / College', 'University', 'Postgraduate'
];

const EDUCATION_LEVELS_AM = [
  'መደበኛ ትምህርት የሌለው', 'አንደኛ ደረጃ (1-8)', 'ሁለተኛ ደረጃ (9-12)', 'ቴክኒክ / ኮሌጅ', 'ዩኒቨርሲቲ', 'ድህረ ምረቃ'
];

const EDUCATION_LEVELS_OM = [
  'Barnoota Hinbaranne', 'Sadarkaa Duraa (1-8)', 'Sadarkaa Lammeessaa (9-12)', 'TVET / Kolleejii', 'Yunivarsiitii', 'Digrii Boodaa'
];

const RELIGIONS_EN = [
  'Orthodox', 'Muslim', 'Protestant', 'Catholic', 'Traditional', 'Other'
];

const RELIGIONS_AM = [
  'ኦርቶዶክስ', 'ሙስሊም', 'ፕሮቴስታንት', 'ካቶሊክ', 'ባህላዊ', 'ሌላ'
];

const RELIGIONS_OM = [
  'Ortodoksii', 'Musliima', 'Protestant', 'Kaawolikii', 'Aadaa', 'Kan Biroo'
];

// Helper to get education levels based on locale
const getEducationLevels = (locale) => {
  if (locale === 'am') return EDUCATION_LEVELS_AM;
  if (locale === 'om') return EDUCATION_LEVELS_OM;
  return EDUCATION_LEVELS_EN;
};

// Helper to get religions based on locale
const getReligions = (locale) => {
  if (locale === 'am') return RELIGIONS_AM;
  if (locale === 'om') return RELIGIONS_OM;
  return RELIGIONS_EN;
};

// ==================== UI HELPERS ====================
const Field = ({ label, labelAm, labelOm, required, children, hint, hintAm, hintOm, error }) => {
  const { locale } = useTranslation();
  
  const getLabel = () => {
    if (locale === 'am' && labelAm) return labelAm;
    if (locale === 'om' && labelOm) return labelOm;
    return label;
  };
  
  const getHint = () => {
    if (locale === 'am' && hintAm) return hintAm;
    if (locale === 'om' && hintOm) return hintOm;
    return hint;
  };
  
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-1">
        {getLabel()} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-500 flex items-center gap-1"><FaExclamationTriangle className="text-[10px]" />{error}</p>}
      {!error && getHint() && <p className="text-[11px] text-gray-400 italic">{getHint()}</p>}
    </div>
  );
};

const Input = ({ icon: Icon, ...props }) => (
  <div className="relative">
    {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />}
    <input
      {...props}
      className={`w-full bg-white border border-gray-200 rounded-xl py-2.5 text-sm text-gray-800
        placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        transition-all duration-200 hover:border-gray-300
        ${Icon ? 'pl-10 pr-4' : 'px-4'} ${props.className || ''}`}
    />
  </div>
);

const Select = ({ icon: Icon, children, ...props }) => (
  <div className="relative">
    {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />}
    <select
      {...props}
      className={`w-full bg-white border border-gray-200 rounded-xl py-2.5 text-sm text-gray-700
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        transition-all duration-200 hover:border-gray-300 appearance-none cursor-pointer
        ${Icon ? 'pl-10 pr-8' : 'px-4'} ${props.className || ''}`}
    >
      {children}
    </select>
    <FaChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs rotate-90 pointer-events-none" />
  </div>
);

function SectionHeader({ icon: Icon, title, titleAm, titleOm, subtitle, subtitleAm, subtitleOm }) {
  const { locale } = useTranslation();
  
  const getTitle = () => {
    if (locale === 'am' && titleAm) return titleAm;
    if (locale === 'om' && titleOm) return titleOm;
    return title;
  };
  
  const getSubtitle = () => {
    if (locale === 'am' && subtitleAm) return subtitleAm;
    if (locale === 'om' && subtitleOm) return subtitleOm;
    return subtitle;
  };
  
  return (
    <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
      <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
        <Icon className="text-white text-sm" />
      </div>
      <div>
        <h3 className="font-bold text-gray-800 text-base">{getTitle()}</h3>
        <p className="text-xs text-gray-400">{getSubtitle()}</p>
      </div>
    </div>
  );
}

// ==================== STEP 1: PERSONAL INFO ====================
function StepPersonal({ data, onChange, t }) {
  const { locale } = useTranslation();
  
  const safeT = (key, fallback = '') => {
    const result = t(key);
    return typeof result === 'string' ? result : (fallback || key.split('.').pop() || key);
  };

  const [showTransferSection, setShowTransferSection] = useState(false);
  const [showMultilingual, setShowMultilingual] = useState(false);
  const [transferFile, setTransferFile] = useState(null);
  const [transferPreview, setTransferPreview] = useState(null);
  const [transferFileName, setTransferFileName] = useState('');

  const handleTransferFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        alert(safeT('addResident.errors.invalidFileType', 'Please select a PDF or image file'));
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert(safeT('addResident.errors.fileTooLarge', 'File size must be less than 5MB'));
        return;
      }
      
      setTransferFile(file);
      setTransferFileName(file.name);
      onChange('transfer_clearance_file', file);
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setTransferPreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setTransferPreview('pdf');
      }
    }
  };

  const removeTransferFile = () => {
    setTransferFile(null);
    setTransferPreview(null);
    setTransferFileName('');
    onChange('transfer_clearance_file', null);
    onChange('previous_kebele', '');
  };

  return (
    <div className="space-y-6">
      <SectionHeader 
        icon={FaUser} 
        title="Personal Information"
        titleAm="የግል መረጃ"
        titleOm="Odeeffannoo Dhuunfaa"
        subtitle="Basic information about the resident"
        subtitleAm="ስለ ነዋሪ መሰረታዊ መረጃ"
        subtitleOm="Odeeffannoo bu'uuraa ilaalchisee jiraataa"
      />
      
      {/* English Names Section - Required */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <FaGlobe className="text-blue-600" />
          <h3 className="text-sm font-semibold text-blue-800">
            {locale === 'am' ? 'የእንግሊዝኛ ስሞች' : locale === 'om' ? 'Maqoo Ingliffaa' : 'English Names'}
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field 
            label="First Name" 
            labelAm="ስም" 
            labelOm="Maqaa" 
            required
          >
            <Input icon={FaUser} placeholder={locale === 'am' ? 'ስም ያስገቡ' : locale === 'om' ? 'Maqaa galchi' : 'Enter first name'} value={data.first_name} onChange={e => onChange('first_name', e.target.value)} />
          </Field>
          <Field 
            label="Father's Name" 
            labelAm="የአባት ስም" 
            labelOm="Maqaa Abbaa" 
            required
          >
            <Input icon={FaUser} placeholder={locale === 'am' ? 'የአባት ስም ያስገቡ' : locale === 'om' ? 'Maqaa abbaa galchi' : "Enter father's name"} value={data.father_name} onChange={e => onChange('father_name', e.target.value)} />
          </Field>
          <Field 
            label="Grandfather's Name" 
            labelAm="የአያት ስም" 
            labelOm="Maqaa Akakaa" 
            required
          >
            <Input icon={FaUser} placeholder={locale === 'am' ? 'የአያት ስም ያስገቡ' : locale === 'om' ? 'Maqaa akakaa galchi' : "Enter grandfather's name"} value={data.grandfather_name} onChange={e => onChange('grandfather_name', e.target.value)} />
          </Field>
        </div>
      </div>

      {/* Toggle for Multilingual Names */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaLanguage className="text-green-600" />
          <span className="text-sm font-medium text-gray-700">
            {locale === 'am' ? 'ተጨማሪ ቋንቋዎች' : locale === 'om' ? 'Afaanota Dabalataa' : 'Additional Languages'}
          </span>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showMultilingual}
            onChange={(e) => setShowMultilingual(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600">
            {locale === 'am' ? 'አማርኛ እና አፋን ኦሮሞ ስሞች ያስገቡ' : locale === 'om' ? 'Maqoo Afaan Oromoo fi Amaaraa galchi' : 'Add Amharic & Afaan Oromoo names'}
          </span>
        </label>
      </div>

      {/* Amharic and Oromo Names Section */}
      {showMultilingual && (
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🇪🇹</span>
            <h3 className="text-sm font-semibold text-amber-800">
              {locale === 'am' ? 'የአማርኛ እና የኦሮምኛ ስሞች' : locale === 'om' ? 'Maqoo Afaan Amaaraa fi Afaan Oromoo' : 'Amharic & Afaan Oromoo Names'}
            </h3>
          </div>
          
          {/* Amharic Names */}
          <div className="bg-white rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-amber-700">አማርኛ / Amharic</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ስም / First Name</label>
                <input
                  type="text"
                  value={data.am_first_name || ''}
                  onChange={(e) => onChange('am_first_name', e.target.value)}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg font-ethiopic"
                  placeholder="ስም በአማርኛ"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">የአባት ስም / Father's Name</label>
                <input
                  type="text"
                  value={data.am_father_name || ''}
                  onChange={(e) => onChange('am_father_name', e.target.value)}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg font-ethiopic"
                  placeholder="የአባት ስም በአማርኛ"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">የአያት ስም / Grandfather's Name</label>
                <input
                  type="text"
                  value={data.am_grandfather_name || ''}
                  onChange={(e) => onChange('am_grandfather_name', e.target.value)}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg font-ethiopic"
                  placeholder="የአያት ስም በአማርኛ"
                />
              </div>
            </div>
          </div>
          
          {/* Oromo Names */}
          <div className="bg-white rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-amber-700">Afaan Oromoo </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Maqaa / First Name</label>
                <input
                  type="text"
                  value={data.om_first_name || ''}
                  onChange={(e) => onChange('om_first_name', e.target.value)}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg"
                  placeholder="Maqaa Afaan Oromootiin"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Maqaa Abbaa / Father's Name</label>
                <input
                  type="text"
                  value={data.om_father_name || ''}
                  onChange={(e) => onChange('om_father_name', e.target.value)}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg"
                  placeholder="Maqaa abbaa Afaan Oromootiin"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Maqaa Akakaa / Grandfather's Name</label>
                <input
                  type="text"
                  value={data.om_grandfather_name || ''}
                  onChange={(e) => onChange('om_grandfather_name', e.target.value)}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg"
                  placeholder="Maqaa akakaa Afaan Oromootiin"
                />
              </div>
            </div>
          </div>
          
          <p className="text-xs text-amber-600 mt-2">
            💡 {locale === 'am' 
              ? 'እባክዎ የነዋሪውን ስም በአማርኛ እና በኦሮምኛ ያስገቡ (ካለ)'
              : locale === 'om'
              ? 'Maqaa jiraataa Afaan Amaaraafi Oromootiin galchi (yoo jiraate)'
              : 'Enter the resident\'s name in Amharic and Afaan Oromo (if available)'}
          </p>
        </div>
      )}

      {/* Rest of the personal info fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field 
          label="Date of Birth" 
          labelAm="የልደት ቀን" 
          labelOm="Guyyaa Dhalootaa" 
          required
        >
          <Input icon={FaCalendarAlt} type="date" value={data.date_of_birth} onChange={e => onChange('date_of_birth', e.target.value)} />
        </Field>
        <Field 
          label="Gender" 
          labelAm="ጾታ" 
          labelOm="Saalaa" 
          required
        >
          <Select value={data.gender} onChange={e => onChange('gender', e.target.value)}>
            <option value="">{locale === 'am' ? 'ይምረጡ' : locale === 'om' ? 'Filadhu' : 'Select'}</option>
            {GENDERS.map(g => <option key={g.value} value={g.value}>{locale === 'am' ? (g.value === 'Male' ? 'ወንድ' : 'ሴት') : locale === 'om' ? (g.value === 'Male' ? 'Dhiiraa' : 'Dhalaa') : g.value}</option>)}
          </Select>
        </Field>
        <Field 
          label="Marital Status" 
          labelAm="የጋብቻ ሁኔታ" 
          labelOm="Haala Fuudhaa/Hermaa" 
          required
        >
          <Select value={data.marital_status} onChange={e => onChange('marital_status', e.target.value)}>
            <option value="">{locale === 'am' ? 'ይምረጡ' : locale === 'om' ? 'Filadhu' : 'Select'}</option>
            {MARITAL_STATUSES.map(s => {
              let label = s.value;
              if (locale === 'am') {
                if (s.value === 'Single') label = 'ያላገባ/ያላገባች';
                else if (s.value === 'Married') label = 'አግብቷል/አግብታለች';
                else if (s.value === 'Divorced') label = 'ፈትቷል/ፍትታለች';
                else if (s.value === 'Widowed') label = 'ባል/ሚስት ሞቷል';
              } else if (locale === 'om') {
                if (s.value === 'Single') label = 'Kan Hin Fuudhin/Hin Heerumin';
                else if (s.value === 'Married') label = 'Fuudhee/Hermatte';
                else if (s.value === 'Divorced') label = 'Haaraa';
                else if (s.value === 'Widowed') label = 'Gaa\'ee/Jaate';
              }
              return <option key={s.value} value={s.value}>{label}</option>;
            })}
          </Select>
        </Field>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field 
          label="Place of Birth" 
          labelAm="የትውልድ ቦታ" 
          labelOm="Iddoo Dhalootaa" 
        >
          <Input icon={FaMapMarkerAlt} placeholder={locale === 'am' ? 'የትውልድ ቦታ' : locale === 'om' ? 'Iddoo dhalootaa' : 'Place of birth'} value={data.place_of_birth} onChange={e => onChange('place_of_birth', e.target.value)} />
        </Field>
        <Field 
          label="Nationality" 
          labelAm="ዜግነት" 
          labelOm="Biiliseemmaa" 
        >
          <Input icon={FaIdCard} placeholder={locale === 'am' ? 'ዜግነት' : locale === 'om' ? 'Biiliseemmaa' : 'Nationality'} value={data.nationality} onChange={e => onChange('nationality', e.target.value)} />
        </Field>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field 
          label="National ID Number" 
          labelAm="ብሔራዊ መታወቂያ ቁጥር" 
          labelOm="Lakkoofsa Eenyummaa Biyyaalessaa" 
          hint="Leave blank if not available"
          hintAm="ከሌለ ባዶ ይተው"
          hintOm="Yoo hin jiraatin duwwaa dhiisi"
        >
          <Input icon={FaIdCard} placeholder={locale === 'am' ? 'ብሄራዊ መታወቂያ ቁጥር' : locale === 'om' ? 'Lakkoofsa waraqaa Eenyummaa' : 'National ID number'} value={data.national_id} onChange={e => onChange('national_id', e.target.value)} />
        </Field>
        <Field 
          label="Proof of Residence" 
          labelAm="የመኖሪያ ማረጋገጫ" 
          labelOm="Ragaayii Jireenyaa" 
          hint="e.g., utility bill, rental agreement"
          hintAm="ለምሳሌ፡ የመገልገያ ክፍያ ደረሰኝ፣ የኪራይ ውል"
          hintOm="Fkn: bilil eeletirikii, walii galtee kiraa"
        >
          <Input icon={FaHome} placeholder={locale === 'am' ? 'የመኖሪያ ማረጋገጫ' : locale === 'om' ? 'Ragaayii jireenyaa' : 'Proof of residence'} value={data.proof_of_residence} onChange={e => onChange('proof_of_residence', e.target.value)} />
        </Field>
      </div>

      {/* ==================== TRANSFER CLEARANCE SECTION ==================== */}
      <div className="border-t border-gray-200 pt-4 mt-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FaExchangeAlt className="text-orange-500" />
              <span>{locale === 'am' ? 'የማስተላለፊያ ፍቃድ' : locale === 'om' ? 'Hayyama Gadhiifamaa' : 'Transfer Clearance'}</span>
            </h4>
            <p className="text-xs text-gray-400 mt-0.5">
              {locale === 'am' 
                ? 'ነዋሪው ከሌላ ቀበሌ የሚዛወር ከሆነ' 
                : locale === 'om'
                ? 'Yoo jiraanni kun qondaala biraa gadhiifamu'
                : 'If the resident is transferring from another kebele'}
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showTransferSection}
              onChange={(e) => {
                setShowTransferSection(e.target.checked);
                if (!e.target.checked) {
                  removeTransferFile();
                }
              }}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">
              {locale === 'am' 
                ? 'ነዋሪው ከሌላ ቀበሌ እየተዘዋወረ ነው' 
                : locale === 'om'
                ? 'Jiraanni kun qondaala biraa irraa gadhiifamaa jira'
                : 'Resident is transferring from another kebele'}
            </span>
          </label>
        </div>

        {showTransferSection && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <Field 
                label="Previous Kebele" 
                labelAm="የቀድሞ ቀበሌ" 
                labelOm="Qondaala Duraa" 
                required={showTransferSection}
                hint="Name of the kebele the resident is coming from"
                hintAm="ነዋሪው ከየትኛው ቀበሌ እንደሚዛወር"
                hintOm="Maqaa qondaalaa jiraanni kun irraa gadhiifame"
              >
                <Input 
                  icon={FaMapMarkerAlt} 
                  placeholder={locale === 'am' ? 'የቀድሞ ቀበሌ' : locale === 'om' ? 'Qondaala duraa' : 'Previous kebele'} 
                  value={data.previous_kebele} 
                  onChange={e => onChange('previous_kebele', e.target.value)} 
                />
              </Field>
            </div>

            {/* File Upload Section */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                {locale === 'am' ? 'የማስተላለፊያ ፍቃድ ሰነድ' : locale === 'om' ? 'Waraqaa Hayyama Gadhiifamaa' : 'Transfer Clearance Document'}
                <span className="text-red-400 ml-1">*</span>
              </label>
              
              <div className="border-2 border-dashed border-orange-300 rounded-xl p-6 text-center bg-white">
                {!transferPreview ? (
                  <div>
                    <FaFilePdf className="text-4xl text-orange-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-2">
                      {locale === 'am' ? 'የማስተላለፊያ ፍቃድ ሰነድ ይምረጡ' : locale === 'om' ? 'Waraqaa hayyamaa gadhiifamaa filadhu' : 'Upload transfer clearance document'}
                    </p>
                    <p className="text-xs text-gray-400 mb-4">
                      {locale === 'am' 
                        ? 'የሚደገፉ ቅርጸቶች: PDF, JPEG, PNG (ከፍተኛ መጠን: 5MB)' 
                        : locale === 'om' 
                          ? "Foormaatoota deeggaraman: PDF, JPEG, PNG (Ulfina ol ta'aa: 5MB)" 
                          : 'Supported formats: PDF, JPEG, PNG (Max: 5MB)'}
                    </p>
                    <label className="cursor-pointer bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm transition-colors">
                      <FaUpload className="text-sm" />
                      {locale === 'am' ? 'ፋይል ምረጥ' : locale === 'om' ? 'Faayilaa Filadhu' : 'Choose File'}
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleTransferFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    {transferPreview === 'pdf' ? (
                      <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center gap-3">
                        <FaFilePdf className="text-red-500 text-5xl" />
                        <div className="text-left">
                          <p className="font-medium text-gray-800">{transferFileName}</p>
                          <p className="text-xs text-gray-500">PDF Document</p>
                        </div>
                      </div>
                    ) : (
                      <div className="relative inline-block">
                        <img src={transferPreview} alt="Preview" className="max-h-48 rounded-lg border shadow-sm" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={removeTransferFile}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-md"
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                )}
              </div>
              
              {transferFile && (
                <div className="mt-2 flex items-center gap-2 text-green-600 text-xs">
                  <FaCheckCircle />
                  <span>{locale === 'am' ? 'ፋይል ተመርጧል' : locale === 'om' ? 'Faayilli filatame' : 'File selected'}: {transferFileName}</span>
                </div>
              )}
            </div>

            <div className="bg-amber-100 rounded-lg p-3 flex items-start gap-2">
              <FaInfoCircle className="text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800">
                {locale === 'am' 
                  ? 'ማስታወሻ: የማስተላለፊያ ፍቃድ ሰነድ ከነዋሪው መዝገብ ጋር ይቀመጣል እና በኋላ ማግኘት ይቻላል።'
                  : locale === 'om'
                  ? 'Yaadannoo: Waraqaan hayyamaa gadhiifamaa waliin galmee jiraataa ni kuufama, booda ni argama.'
                  : 'Note: The transfer clearance document will be stored with the resident\'s record and can be accessed later.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== STEP 2: HOUSEHOLD ====================
function StepHousehold({ data, onChange, searchMode, setSearchMode, t }) {
  const { locale } = useTranslation();
  
  const safeT = (key, fallback = '') => {
    const result = t(key);
    return typeof result === 'string' ? result : (fallback || key.split('.').pop() || key);
  };

  const [houseInfo, setHouseInfo] = useState(null);
  const [householdInfo, setHouseholdInfo] = useState(null);
  const [searching, setSearching] = useState({ house: false, household: false });
  const [searchError, setSearchError] = useState({ house: null, household: null });
  const [searchHouseholdCode, setSearchHouseholdCode] = useState('');

  const searchHouse = useCallback(async () => {
    if (!data.house_id) return;
    setSearching(s => ({ ...s, house: true }));
    setSearchError(s => ({ ...s, house: null }));
    setHouseInfo(null);
    try {
      const res = await fetch(`/api/houses/${encodeURIComponent(data.house_id)}`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message);
      }
      const info = await res.json();
      setHouseInfo(info);
    } catch (e) {
      setSearchError(s => ({ ...s, house: e.message }));
    } finally {
      setSearching(s => ({ ...s, house: false }));
    }
  }, [data.house_id]);

  const searchHousehold = useCallback(async () => {
    if (!searchHouseholdCode) return;
    setSearching(s => ({ ...s, household: true }));
    setSearchError(s => ({ ...s, household: null }));
    setHouseholdInfo(null);
    try {
      const res = await fetch(`/api/households/code/${encodeURIComponent(searchHouseholdCode)}`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message);
      }
      const info = await res.json();
      setHouseholdInfo(info);
      
      if (info.head_name && info.head_name !== 'null') {
        onChange('household_head_name', info.head_name);
      } else {
        onChange('household_head_name', safeT('addResident.messages.noHeadAssigned'));
      }
      
      onChange('household_id', info.household_id);
      onChange('household_code', info.household_code);
      
      if (data.house_id && String(info.house_id) !== String(data.house_id)) {
        setSearchError(s => ({ 
          ...s, 
          household: `⚠️ Warning: This household belongs to house "${info.house_id}", not "${data.house_id}".` 
        }));
      } else {
        setSearchError(s => ({ ...s, household: null }));
      }
    } catch (e) {
      console.error('Search error:', e);
      setSearchError(s => ({ ...s, household: e.message }));
      setHouseholdInfo(null);
      onChange('household_id', null);
      onChange('household_code', '');
      onChange('household_head_name', '');
    } finally {
      setSearching(s => ({ ...s, household: false }));
    }
  }, [searchHouseholdCode, data.house_id, onChange, safeT]);

  return (
    <div className="space-y-6">
      <SectionHeader 
        icon={GiFamilyHouse} 
        title="Household Information"
        titleAm="የቤተሰብ መረጃ"
        titleOm="Odeeffannoo Maatii"
        subtitle="Residence and family details"
        subtitleAm="የመኖሪያ እና የቤተሰብ ዝርዝሮች"
        subtitleOm="Ibsa jireenyaa fi maatii"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field 
          label="House ID" 
          labelAm="የቤት መለያ" 
          labelOm="Iddeettii Manaa" 
          required 
          hint="Enter the house number or ID"
          hintAm="የቤት ቁጥር ወይም መለያ ያስገቡ"
          hintOm="Lakkoofsa ykn Iddeettii Manaa galchi"
          error={searchError.house}
        >
          <div className="flex gap-2">
            <Input icon={FaHome} placeholder={locale === 'am' ? 'የቤት መለያ' : locale === 'om' ? 'Iddeettii Manaa' : 'House ID'} value={data.house_id} onChange={e => onChange('house_id', e.target.value)} />
            <button onClick={searchHouse} disabled={searching.house || !data.house_id}
              className="flex-shrink-0 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 text-blue-600 border border-blue-200 rounded-xl px-3 transition-colors">
              {searching.house ? <FaSpinner className="text-sm animate-spin" /> : <FaSearch className="text-sm" />}
            </button>
          </div>
          {houseInfo && (
            <div className="mt-1.5 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700">
              <p className="flex items-center gap-2">
                <FaCheckCircle /> <strong>{locale === 'am' ? 'ቤት ተገኝቷል' : locale === 'om' ? 'Manni argame' : 'House found'}</strong>
              </p>
              <p>House ID: {houseInfo.house_id}</p>
              <p>House No: {houseInfo.house_no}</p>
              <p>Kebele: {houseInfo.kebele_name}</p>
              <p>Zone: {houseInfo.zone}</p>
            </div>
          )}
        </Field>
        <Field 
          label="Household Role" 
          labelAm="የቤተሰብ ሚና" 
          labelOm="Gahee Maatii" 
          required 
          hint="Role within the family"
          hintAm="በቤተሰብ ውስጥ ያለዎት ሚና"
          hintOm="Gahee keessan maatii keessatti"
        >
          <Select icon={FaUserFriends} value={data.household_role} onChange={e => onChange('household_role', e.target.value)}>
            <option value="">{locale === 'am' ? 'ይምረጡ' : locale === 'om' ? 'Filadhu' : 'Select'}</option>
            {HOUSEHOLD_ROLES.map(r => {
              let label = r.value;
              if (locale === 'am') {
                if (r.value === 'Head') label = 'የቤተሰብ ኃላፊ';
                else if (r.value === 'Spouse') label = 'ባል/ሚስት';
                else if (r.value === 'Son') label = 'ወንድ ልጅ';
                else if (r.value === 'Daughter') label = 'ሴት ልጅ';
                else if (r.value === 'Father') label = 'አባት';
                else if (r.value === 'Mother') label = 'እናት';
                else if (r.value === 'Other Dependent') label = 'ሌላ ጥገኛ';
              } else if (locale === 'om') {
                if (r.value === 'Head') label = 'Abbaa Maatii';
                else if (r.value === 'Spouse') label = 'Jaalalle';
                else if (r.value === 'Son') label = 'Ilma';
                else if (r.value === 'Daughter') label = 'Intala';
                else if (r.value === 'Father') label = 'Abbaa';
                else if (r.value === 'Mother') label = 'Haadha';
                else if (r.value === 'Other Dependent') label = 'Kan Biroo';
              }
              return <option key={r.value} value={r.value}>{label}</option>;
            })}
          </Select>
        </Field>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
          {locale === 'am' ? 'የቤተሰብ መዝገብ' : locale === 'om' ? 'Galmee Maatii' : 'Household Record'}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setSearchMode('existing');
              setSearchHouseholdCode('');
              setHouseholdInfo(null);
              onChange('create_new_household', false);
              onChange('household_id', null);
              onChange('household_code', '');
              onChange('household_head_name', '');
              setSearchError(s => ({ ...s, household: null }));
            }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200
              ${searchMode === 'existing' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
            🔗 {locale === 'am' ? 'ነባር ቤተሰብ አገናኝ' : locale === 'om' ? 'Maatii Jiraa Hidhi' : 'Link Existing Household'}
          </button>
          <button
            onClick={() => {
              setSearchMode('new');
              setHouseholdInfo(null);
              onChange('create_new_household', true);
              onChange('household_id', null);
              onChange('household_code', '');
              onChange('household_head_name', '');
              setSearchError(s => ({ ...s, household: null }));
            }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200
              ${searchMode === 'new' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
            ➕ {locale === 'am' ? 'አዲስ ፍጠር' : locale === 'om' ? 'Haaraa Uumi' : 'Create New'}
          </button>
        </div>

        {searchMode === 'existing' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field 
                label="Household Code" 
                labelAm="የቤተሰብ ኮድ" 
                labelOm="Koodii Maatii" 
                required 
                hint="Enter the household code"
                hintAm="የቤተሰብ ኮድ ያስገቡ"
                hintOm="Koodii maatii galchi"
                error={searchError.household}
              >
                <div className="flex gap-2">
                  <Input 
                    icon={GiFamilyHouse} 
                    placeholder={locale === 'am' ? 'የቤተሰብ ኮድ' : locale === 'om' ? 'Koodii Maatii' : 'Household Code'} 
                    value={searchHouseholdCode} 
                    onChange={e => setSearchHouseholdCode(e.target.value.toUpperCase())} 
                  />
                  <button onClick={searchHousehold} disabled={searching.household || !searchHouseholdCode}
                    className="flex-shrink-0 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 text-blue-600 border border-blue-200 rounded-xl px-3 transition-colors">
                    {searching.household ? <FaSpinner className="text-sm animate-spin" /> : <FaSearch className="text-sm" />}
                  </button>
                </div>
              </Field>
              <Field 
                label="Household Head Name" 
                labelAm="የቤተሰብ ኃላፊ ስም" 
                labelOm="Maqaa Abbaa Maatii" 
                hint="Auto-filled from search"
                hintAm="ከፍለጋ በራስ-ሰር ይሞላል"
                hintOm="Biyyeeessa irraa otomaatiikkan guutama"
              >
                <Input 
                  placeholder={locale === 'am' ? 'የቤተሰብ ኃላፊ ስም' : locale === 'om' ? 'Maqaa Abbaa Maatii' : 'Household Head Name'} 
                  value={data.household_head_name} 
                  onChange={e => onChange('household_head_name', e.target.value)} 
                  className={householdInfo ? "bg-green-50" : "bg-gray-50"}
                />
              </Field>
            </div>
            
            {householdInfo && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FaCheckCircle className="text-green-600" />
                  <h4 className="font-semibold text-green-800">
                    {locale === 'am' ? 'የቤተሰብ መረጃ' : locale === 'om' ? 'Odeeffannoo Maatii' : 'Household Information'}
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">{locale === 'am' ? 'የቤተሰብ ኮድ' : locale === 'om' ? 'Koodii Maatii' : 'Household Code'}:</p>
                    <p className="font-mono font-semibold text-green-700">{householdInfo.household_code}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Household ID:</p>
                    <p className="font-mono text-green-700">{householdInfo.household_id}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">House ID:</p>
                    <p className="font-mono text-green-700">{householdInfo.house_id}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">{locale === 'am' ? 'የቤተሰብ ኃላፊ ስም' : locale === 'om' ? 'Maqaa Abbaa Maatii' : 'Household Head Name'}:</p>
                    <p className="font-semibold text-green-800">{householdInfo.head_name || safeT('addResident.messages.notAssigned')}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">{locale === 'am' ? 'ጠቅላላ አባላት' : locale === 'om' ? 'Waligalaa miseensota' : 'Total Members'}:</p>
                    <p className="font-semibold text-green-800">{householdInfo.member_count || 0}</p>
                  </div>
                </div>
                
                {householdInfo.members && householdInfo.members.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <p className="text-sm font-semibold text-green-800 mb-2">
                      {locale === 'am' ? 'የቤተሰብ አባላት' : locale === 'om' ? 'Miseensoota Maatii' : 'Household Members'}:
                    </p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {householdInfo.members.map((member, idx) => (
                        <div key={member.resident_id || idx} className="flex items-center gap-2 text-sm">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span>{member.full_name || `${member.fname} ${member.lname}`}</span>
                          {member.is_head && (
                            <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">
                              {locale === 'am' ? 'ኃላፊ' : locale === 'om' ? 'Abbaa' : 'Head'}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">({member.household_role || 'Member'})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="font-semibold">
                {locale === 'am' ? 'አዲስ ቤተሰብ መፍጠር' : locale === 'om' ? 'Maatii Haaraa Uumuu' : 'Creating New Household'}
              </p>
              <p className="text-xs mt-0.5">
                {locale === 'am' 
                  ? 'አዲስ ቤተሰብ ሲፈጥሩ፣ አዲስ የቤተሰብ ኮድ በራስ-ሰር ይመነጫል'
                  : locale === 'om'
                  ? 'Yeroo maatii haaraa uumtan, koodiin maatii haaraa otomaatiikkan uumama'
                  : 'When creating a new household, a new household code will be auto-generated'}
              </p>
              <p className="text-xs mt-1 font-semibold">
                ⚠️ {locale === 'am' 
                  ? 'እባክዎ የቤተሰብ ሚና በትክክል መምረጥዎን ያረጋግጡ'
                  : locale === 'om'
                  ? 'Mee gahee maatii sirriitti filachuu mirkaneeffadhaa'
                  : 'Please ensure you select the correct household role'}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-3">
        <p className="text-xs font-semibold text-green-700 uppercase tracking-widest flex items-center gap-2">
          <MdVerified /> {locale === 'am' ? 'የማረጋገጫ መረጃ' : locale === 'om' ? 'Odeeffannoo Mirkaneessaa' : 'Verification Information'}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field 
            label="Verified By" 
            labelAm="ያረጋገጠው ሰው" 
            labelOm="Mirkaneesse" 
            hint="Name of the person who verified"
            hintAm="ያረጋገጠው ሰው ስም"
            hintOm="Maqaa namicha mirkaneesse"
          >
            <Input placeholder={locale === 'am' ? 'ለምሳሌ፡ ለምለም ታደሰ' : locale === 'om' ? 'Fkn: Lemlem Tadesse' : 'e.g., Lemlem Tadesse'} value={data.verified_by} onChange={e => onChange('verified_by', e.target.value)} />
          </Field>
          <Field 
            label="Verification Date" 
            labelAm="የማረጋገጫ ቀን" 
            labelOm="Guyyaa Mirkaneessaa"
          >
            <Input icon={FaCalendarAlt} type="date" value={data.verification_date} onChange={e => onChange('verification_date', e.target.value)} />
          </Field>
        </div>
        <Field 
          label="Verification Note" 
          labelAm="የማረጋገጫ ማስታወሻ" 
          labelOm="Hubachiisa Mirkaneessaa"
        >
          <textarea rows={2} placeholder={locale === 'am' ? 'ማስታወሻ...' : locale === 'om' ? 'Hubachiisa...' : 'Notes...'}
            value={data.verification_note} onChange={e => onChange('verification_note', e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none transition-all" />
        </Field>
      </div>
    </div>
  );
}

// ==================== STEP 3: CONTACT & JOB ====================
function StepContactJob({ data, onChange, phones, setPhones, t }) {
  const { locale } = useTranslation();
  const educationLevels = getEducationLevels(locale);
  const religions = getReligions(locale);
  
  const safeT = (key, fallback = '') => {
    const result = t(key);
    return typeof result === 'string' ? result : (fallback || key.split('.').pop() || key);
  };

  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobSearchTerm, setJobSearchTerm] = useState('');
  const [showJobDropdown, setShowJobDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const addPhone = () => setPhones(p => [...p, '']);
  const removePhone = i => setPhones(p => p.filter((_, idx) => idx !== i));
  const updatePhone = (i, val) => setPhones(p => p.map((v, idx) => idx === i ? val : v));

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('/api/jobs');
        if (response.ok) {
          const data = await response.json();
          setJobs(data.jobs || []);
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setLoadingJobs(false);
      }
    };
    fetchJobs();
  }, []);

  useEffect(() => {
    if (data.job_title) {
      setJobSearchTerm(data.job_title);
    }
  }, [data.job_title]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowJobDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredJobs = jobs.filter(job =>
    job.job_title.toLowerCase().includes(jobSearchTerm.toLowerCase())
  );

  const handleJobSelect = (jobTitle) => {
    onChange('job_title', jobTitle);
    setJobSearchTerm(jobTitle);
    setShowJobDropdown(false);
  };

  const handleJobInputChange = (e) => {
    const value = e.target.value;
    setJobSearchTerm(value);
    onChange('job_title', value);
    setShowJobDropdown(true);
  };

  const handleCreateNewJob = async () => {
    if (!jobSearchTerm.trim()) return;
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_title: jobSearchTerm.trim() })
      });
      if (response.ok) {
        const jobsResponse = await fetch('/api/jobs');
        if (jobsResponse.ok) {
          const jobsData = await jobsResponse.json();
          setJobs(jobsData.jobs || []);
        }
        onChange('job_title', jobSearchTerm.trim());
        setShowJobDropdown(false);
      }
    } catch (error) {
      console.error('Error creating job:', error);
    }
  };

  const isExistingJob = jobs.some(job => 
    job.job_title.toLowerCase() === jobSearchTerm.toLowerCase()
  );

  return (
    <div className="space-y-6">
      <SectionHeader 
        icon={FaPhone} 
        title="Contact & Employment"
        titleAm="አድራሻ እና ሥራ"
        titleOm="Qunnamtii fi Hojii"
        subtitle="Contact details and job information"
        subtitleAm="የአድራሻ እና የሥራ መረጃ"
        subtitleOm="Ibsa quunnamtii fi hojii"
      />
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            {locale === 'am' ? 'ስልክ ቁጥሮች' : locale === 'om' ? 'Lakkoofsoota Bilbilaa' : 'Phone Numbers'}
          </p>
          <button onClick={addPhone} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-xs font-semibold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
            <FaPlus className="text-[10px]" /> {locale === 'am' ? 'ስልክ ቁጥር ጨምር' : locale === 'om' ? 'Lakkofsa Bilbilaa Dabali' : 'Add Phone'}
          </button>
        </div>
        {phones.map((phone, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input icon={FaPhone} placeholder={locale === 'am' ? 'ስልክ ቁጥር' : locale === 'om' ? 'Lakkoofsa Bilbilaa' : 'Phone number'} value={phone} onChange={e => updatePhone(i, e.target.value)} />
            {phones.length > 1 && (
              <button onClick={() => removePhone(i)} className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-xl p-2.5 transition-colors flex-shrink-0">
                <FaTimes className="text-sm" />
              </button>
            )}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field 
          label="Occupation / Job Title" 
          labelAm="ሙያ / ሥራ" 
          labelOm="Hojii / Maqaa Hojii" 
          hint="Search or enter your job title"
          hintAm="ሥራዎን ይፈልጉ ወይም ያስገቡ"
          hintOm="Maqaa hojii keessan barbaadaa ykn galchaa"
        >
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <FaBriefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none z-10" />
              <input
                type="text"
                value={jobSearchTerm}
                onChange={handleJobInputChange}
                onFocus={() => setShowJobDropdown(true)}
                placeholder={locale === 'am' ? 'ሥራ ይፈልጉ ወይም ያስገቡ' : locale === 'om' ? 'Hojii barbaadi ykn galchi' : 'Search or enter occupation'}
                className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-800
                  placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  transition-all duration-200 hover:border-gray-300"
              />
            </div>
            
            {showJobDropdown && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {loadingJobs ? (
                  <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                    <FaSpinner className="animate-spin" /> 
                    {locale === 'am' ? 'በመጫን ላይ...' : locale === 'om' ? 'Haaduu...' : 'Loading...'}
                  </div>
                ) : filteredJobs.length > 0 ? (
                  <>
                    {filteredJobs.map((job) => (
                      <button
                        key={job.job_id}
                        onClick={() => handleJobSelect(job.job_title)}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors text-sm text-gray-700 border-b border-gray-100 last:border-0 flex items-center justify-between group"
                      >
                        <span>{job.job_title}</span>
                        <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          {locale === 'am' ? 'ምረጥ' : locale === 'om' ? 'Filadhu' : 'Select'}
                        </span>
                      </button>
                    ))}
                    {jobSearchTerm && !isExistingJob && (
                      <button
                        onClick={handleCreateNewJob}
                        className="w-full text-left px-4 py-2.5 hover:bg-green-50 transition-colors text-sm text-green-600 border-t border-gray-200 flex items-center gap-2"
                      >
                        <FaPlus className="text-xs" />
                        {locale === 'am' ? 'አዲስ ሥራ ፍጠር' : locale === 'om' ? 'Hojii Haaraa Uumi' : 'Create Job'}: "{jobSearchTerm}"
                      </button>
                    )}
                  </>
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    {jobSearchTerm ? (
                      <button
                        onClick={handleCreateNewJob}
                        className="w-full text-left text-blue-600 hover:text-blue-700 flex items-center gap-2"
                      >
                        <FaPlus className="text-xs" />
                        {locale === 'am' ? 'አዲስ ሥራ ፍጠር' : locale === 'om' ? 'Hojii Haaraa Uumi' : 'Create Job'}: "{jobSearchTerm}"
                      </button>
                    ) : (
                      locale === 'am' ? 'ምንም ሥራ አልተገኘም' : locale === 'om' ? 'Hojii miti' : 'No jobs found'
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </Field>
        
        <Field 
          label="Employer" 
          labelAm="አሠሪ" 
          labelOm="Abba Hojii" 
          hint="Name of employer or organization"
          hintAm="የአሠሪ ወይም ድርጅት ስም"
          hintOm="Maqaa abbaa hojii ykn dhaabbataa"
        >
          <Input icon={FaMapMarkerAlt} placeholder={locale === 'am' ? 'አሠሪ' : locale === 'om' ? 'Abba Hojii' : 'Employer'} value={data.employer} onChange={e => onChange('employer', e.target.value)} />
        </Field>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field 
          label="Education Level" 
          labelAm="የትምህርት ደረጃ" 
          labelOm="Sadarkaa Barnootaa"
        >
          <Select value={data.education_level} onChange={e => onChange('education_level', e.target.value)}>
            <option value="">{locale === 'am' ? 'ይምረጡ' : locale === 'om' ? 'Filadhu' : 'Select'}</option>
            {educationLevels.map((level, idx) => (
              <option key={level} value={EDUCATION_LEVELS_EN[idx] || level}>{level}</option>
            ))}
          </Select>
        </Field>
        <Field 
          label="Religion" 
          labelAm="ሃይማኖት" 
          labelOm="Amantaa"
        >
          <Select value={data.religion} onChange={e => onChange('religion', e.target.value)}>
            <option value="">{locale === 'am' ? 'ይምረጡ' : locale === 'om' ? 'Filadhu' : 'Select'}</option>
            {religions.map((religion, idx) => (
              <option key={religion} value={RELIGIONS_EN[idx] || religion}>{religion}</option>
            ))}
          </Select>
        </Field>
      </div>
      
      <Field 
        label="Additional Notes" 
        labelAm="ተጨማሪ ማስታወሻ" 
        labelOm="Hubachiisa Dabalaa"
      >
        <textarea rows={3} placeholder={locale === 'am' ? 'ማስታወሻ...' : locale === 'om' ? 'Hubachiisa...' : 'Notes...'}
          value={data.notes} onChange={e => onChange('notes', e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all" />
      </Field>
    </div>
  );
}

// ==================== STEP 4: REVIEW ====================
function StepReview({ personal, household, contactJob, phones, t }) {
  const { locale } = useTranslation();
  
  const safeT = (key, fallback = '') => {
    const result = t(key);
    return typeof result === 'string' ? result : (fallback || key.split('.').pop() || key);
  };

  const Row = ({ label, labelAm, labelOm, value }) => value ? (
    <div className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-400 w-44 flex-shrink-0 pt-0.5 uppercase tracking-wide">
        {locale === 'am' && labelAm ? labelAm : locale === 'om' && labelOm ? labelOm : label}
      </span>
      <span className="text-sm text-gray-800 font-medium">{value}</span>
    </div>
  ) : null;

  const Card = ({ title, titleAm, titleOm, icon: Icon, color, children }) => (
    <div className={`rounded-2xl border ${color} p-5 space-y-1`}>
      <p className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-3 ${color.includes('blue') ? 'text-blue-600' : color.includes('green') ? 'text-green-600' : color.includes('purple') ? 'text-purple-600' : 'text-amber-600'}`}>
        <Icon /> {locale === 'am' && titleAm ? titleAm : locale === 'om' && titleOm ? titleOm : title}
      </p>
      {children}
    </div>
  );

  const fullName = [personal.first_name, personal.father_name, personal.grandfather_name].filter(Boolean).join(' ');

  return (
    <div className="space-y-5">
      <SectionHeader 
        icon={MdVerified} 
        title="Review & Submit"
        titleAm="ገምግም እና አስገባ"
        titleOm="Madaali fi Galmeessi"
        subtitle="Verify all information before submission"
        subtitleAm="ከማስገባትዎ በፊት ሁሉንም መረጃ ያረጋግጡ"
        subtitleOm="Odeeffannoo hunda erga galmeessitan dura mirkaneessa"
      />
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white flex items-center gap-4">
        <div className="w-14 h-14 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center text-2xl">
          <IoPersonAddSharp />
        </div>
        <div>
          <p className="font-bold text-lg">{fullName || '—'}</p>
          <p className="text-blue-200 text-sm">
            {locale === 'am' 
              ? `${personal.gender === 'Male' ? 'ወንድ' : personal.gender === 'Female' ? 'ሴት' : personal.gender} · ${personal.date_of_birth} · ${personal.marital_status === 'Single' ? 'ያላገባ' : personal.marital_status === 'Married' ? 'አግብቷል' : personal.marital_status}`
              : locale === 'om'
              ? `${personal.gender === 'Male' ? 'Dhiiraa' : personal.gender === 'Female' ? 'Dhalaa' : personal.gender} · ${personal.date_of_birth} · ${personal.marital_status === 'Single' ? 'Kan Hin Fuudhin' : personal.marital_status === 'Married' ? 'Fuudhee/Hermatte' : personal.marital_status}`
              : `${personal.gender} · ${personal.date_of_birth} · ${personal.marital_status}`}
          </p>
          <p className="text-blue-100 text-xs mt-0.5">
            {locale === 'am' ? 'የቤተሰብ ሚና' : locale === 'om' ? 'Gahee Maatii' : 'Household Role'}: {household.household_role || '—'}
          </p>
          <p className="text-blue-100 text-xs">{household.create_new_household ? (locale === 'am' ? 'አዲስ ቤተሰብ' : locale === 'om' ? 'Maatii Haaraa' : 'New Household') : `Household ID: ${household.household_id || '—'}`}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          title="Personal Information" 
          titleAm="የግል መረጃ"
          titleOm="Odeeffannoo Dhuunfaa"
          icon={FaUser} 
          color="border-blue-100 bg-blue-50"
        >
          <Row label="Full Name" labelAm="ሙሉ ስም" labelOm="Maqaa Guutuu" value={fullName} />
          <Row label="Date of Birth" labelAm="የልደት ቀን" labelOm="Guyyaa Dhalootaa" value={personal.date_of_birth} />
          <Row label="Nationality" labelAm="ዜግነት" labelOm="Biiliseemmaa" value={personal.nationality} />
          <Row label="Place of Birth" labelAm="የትውልድ ቦታ" labelOm="Iddoo Dhalootaa" value={personal.place_of_birth} />
          <Row label="National ID Number" labelAm="ብሔራዊ መታወቂያ ቁጥር" labelOm="Lakkoofsa Eenyummaa" value={personal.national_id} />
          <Row label="Previous Kebele" labelAm="የቀድሞ ቀበሌ" labelOm="Qondaala Duraa" value={personal.previous_kebele} />
          {personal.transfer_clearance_file && (
            <Row label="Transfer Clearance" labelAm="የማስተላለፊያ ፍቃድ" labelOm="Hayyama Gadhiifamaa" value="Document uploaded ✓" />
          )}
        </Card>
        <Card 
          title="Household Information" 
          titleAm="የቤተሰብ መረጃ"
          titleOm="Odeeffannoo Maatii"
          icon={GiFamilyHouse} 
          color="border-green-100 bg-green-50"
        >
          <Row label="House ID" labelAm="የቤት መለያ" labelOm="Iddeettii Manaa" value={household.house_id} />
          <Row label="Household Code" labelAm="የቤተሰብ ኮድ" labelOm="Koodii Maatii" value={household.household_code || (household.create_new_household ? (locale === 'am' ? 'አዲስ ይመነጫል' : locale === 'om' ? 'Haaraa uumama' : 'New - will be auto-generated') : '—')} />
          <Row label="Household ID" value={household.create_new_household ? (locale === 'am' ? 'አዲስ' : locale === 'om' ? 'Haaraa' : 'New') : household.household_id} />
          <Row label="Household Role" labelAm="የቤተሰብ ሚና" labelOm="Gahee Maatii" value={household.household_role} />
          <Row label="Household Head Name" labelAm="የቤተሰብ ኃላፊ ስም" labelOm="Maqaa Abbaa Maatii" value={household.household_head_name} />
          <Row label="Verified By" labelAm="ያረጋገጠው ሰው" labelOm="Mirkaneesse" value={household.verified_by} />
          <Row label="Verification Date" labelAm="የማረጋገጫ ቀን" labelOm="Guyyaa Mirkaneessaa" value={household.verification_date} />
        </Card>
        <Card 
          title="Contact & Employment" 
          titleAm="አድራሻ እና ሥራ"
          titleOm="Qunnamtii fi Hojii"
          icon={FaPhone} 
          color="border-purple-100 bg-purple-50"
        >
          <Row label="Phone Numbers" labelAm="ስልክ ቁጥሮች" labelOm="Lakkoofsoota Bilbilaa" value={phones.filter(Boolean).join(', ')} />
          <Row label="Occupation" labelAm="ሙያ" labelOm="Hojii" value={contactJob.job_title} />
          <Row label="Employer" labelAm="አሠሪ" labelOm="Abba Hojii" value={contactJob.employer} />
          <Row label="Education Level" labelAm="የትምህርት ደረጃ" labelOm="Sadarkaa Barnootaa" value={contactJob.education_level} />
          <Row label="Religion" labelAm="ሃይማኖት" labelOm="Amantaa" value={contactJob.religion} />
        </Card>
        <Card 
          title="Proof & Notes" 
          titleAm="ማስረጃ እና ማስታወሻ"
          titleOm="Ragaayii fi Hubachiisa"
          icon={FaIdCard} 
          color="border-amber-100 bg-amber-50"
        >
          <Row label="Proof of Residence" labelAm="የመኖሪያ ማረጋገጫ" labelOm="Ragaayii Jireenyaa" value={personal.proof_of_residence} />
          <Row label="Verification Note" labelAm="የማረጋገጫ ማስታወሻ" labelOm="Hubachiisa Mirkaneessaa" value={household.verification_note} />
          <Row label="Additional Notes" labelAm="ተጨማሪ ማስታወሻ" labelOm="Hubachiisa Dabalaa" value={contactJob.notes} />
        </Card>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-sm text-amber-800">
        <span className="text-lg">📋</span>
        <p>
          {locale === 'am' 
            ? 'እባክዎ ለማስገባት ከመጫንዎ በፊት ሁሉም መረጃዎች ትክክል መሆናቸውን ያረጋግጡ። ከገቡ በኋላ ማሻሻል ይቻላል።'
            : locale === 'om'
            ? "Mee odeeffannoon hundi sirri ta'uu isaanii erga galmeessitan duras mirkaneessa. Erga galmeessitan booda fooyyessi ni danda'ama."
            : 'Please verify all information is correct before submitting. You can edit after submission.'}
        </p>
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
export default function AddResidentPage() {
  const { t, loading: translationLoading, locale } = useTranslation();
  
  const safeT = (key, fallback = '') => {
    const result = t(key);
    return typeof result === 'string' ? result : (fallback || key.split('.').pop() || key);
  };
  
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [apiErrors, setApiErrors] = useState([]);
  const [searchMode, setSearchMode] = useState('existing');

  const BLANK_PERSONAL = {
    first_name: '', father_name: '', grandfather_name: '', date_of_birth: '',
    gender: '', marital_status: '', place_of_birth: '', nationality: 'Ethiopian',
    national_id: '', previous_kebele: '', proof_of_residence: '',
    transfer_clearance_file: null,
    // Multilingual name fields
    am_first_name: '', am_father_name: '', am_grandfather_name: '',
    om_first_name: '', om_father_name: '', om_grandfather_name: '',
  };

  const BLANK_HOUSEHOLD = {
    house_id: '', household_id: null, household_role: '', household_head_name: '',
    verified_by: '', verification_date: '', verification_note: '',
    create_new_household: false
  };

  const BLANK_CONTACT = {
    job_title: '', employer: '', education_level: '', religion: '', notes: ''
  };

  const [personal, setPersonal] = useState(BLANK_PERSONAL);
  const [household, setHousehold] = useState(BLANK_HOUSEHOLD);
  const [contactJob, setContactJob] = useState(BLANK_CONTACT);
  const [phones, setPhones] = useState(['']);

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

  useEffect(() => {
    if (searchMode === 'new') {
      setHousehold(prev => ({
        ...prev,
        create_new_household: true,
        household_id: null
      }));
    } else {
      setHousehold(prev => ({
        ...prev,
        create_new_household: false
      }));
    }
  }, [searchMode]);

  const updatePersonal = useCallback((k, v) => setPersonal(p => ({ ...p, [k]: v })), []);
  const updateHousehold = useCallback((k, v) => setHousehold(h => ({ ...h, [k]: v })), []);
  const updateContact = useCallback((k, v) => setContactJob(c => ({ ...c, [k]: v })), []);

  const validateHouseholdStep = () => {
    if (!household.house_id) {
      return safeT('addResident.errors.houseIdRequired');
    }
    if (!household.household_role) {
      return safeT('addResident.errors.householdRoleRequired');
    }
    if (!household.create_new_household && (!household.household_id || household.household_id === null)) {
      return safeT('addResident.errors.householdIdRequired');
    }
    return null;
  };

 const handleSubmit = async () => {
  setApiErrors([]);
  setSubmitting(true);

  let transferClearanceBase64 = null;
  if (personal.transfer_clearance_file) {
    transferClearanceBase64 = await convertToBase64(personal.transfer_clearance_file);
  }

  const payload = {
    // English names (required)
    first_name: personal.first_name,
    father_name: personal.father_name,
    grandfather_name: personal.grandfather_name,
    date_of_birth: personal.date_of_birth,
    gender: personal.gender,
    marital_status: personal.marital_status,
    place_of_birth: personal.place_of_birth,
    nationality: personal.nationality,
    national_id: personal.national_id,
    previous_kebele: personal.previous_kebele,
    proof_of_residence: personal.proof_of_residence,
    transfer_clearance_file: transferClearanceBase64,
    
    // Amharic names (optional)
    first_name_am: personal.am_first_name,
    father_name_am: personal.am_father_name,
    grandfather_name_am: personal.am_grandfather_name,
    
    // Oromo names (optional)
    first_name_om: personal.om_first_name,
    father_name_om: personal.om_father_name,
    grandfather_name_om: personal.om_grandfather_name,
    
    // Household data
    house_id: household.house_id,
    household_role: household.household_role,
    household_head_name: household.household_head_name,
    verified_by: household.verified_by,
    verification_date: household.verification_date,
    verification_note: household.verification_note,
    create_new_household: household.create_new_household === true,
    household_id: household.create_new_household ? null : (household.household_id ? Number(household.household_id) : null),
    
    // Contact & Job
    job_title: contactJob.job_title,
    employer: contactJob.employer,
    education_level: contactJob.education_level,
    religion: contactJob.religion,
    notes: contactJob.notes,
    phones: phones.filter(Boolean),
  };

  console.log('Submitting payload with multilingual names:', {
    amharic: {
      first: payload.first_name_am,
      father: payload.father_name_am,
      grandfather: payload.grandfather_name_am
    },
    oromo: {
      first: payload.first_name_om,
      father: payload.father_name_om,
      grandfather: payload.grandfather_name_om
    }
  });

  try {
    const res = await fetch('/api/manager/add-resident', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      setApiErrors(data.errors || [data.message || data.error || 'An error occurred.']);
      return;
    }

    setSubmitResult(data);
  } catch (err) {
    setApiErrors(['Network error. Please check your connection and try again.']);
  } finally {
    setSubmitting(false);
  }
};

  const resetForm = () => {
    setSubmitResult(null);
    setStep(1);
    setSearchMode('existing');
    setPersonal(BLANK_PERSONAL);
    setHousehold(BLANK_HOUSEHOLD);
    setContactJob(BLANK_CONTACT);
    setPhones(['']);
    setApiErrors([]);
  };

  if (translationLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (submitResult) {
    const fullName = [personal.first_name, personal.father_name].filter(Boolean).join(' ');
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar role="Kebele Manager" />
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <FaCheckCircle className="text-green-500 text-4xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {locale === 'am' ? 'ተሳክቷል!' : locale === 'om' ? 'Milkaa\'e!' : 'Success!'}
              </h2>
              <p className="text-gray-500 mt-1">
                {fullName} {locale === 'am' ? 'በተሳካ ሁኔታ ተመዝግቧል' : locale === 'om' ? 'milkaa\'inaan galmeeffame' : 'registered successfully'}
              </p>
              <div className="mt-3 flex items-center justify-center gap-4 text-sm">
                <span className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full font-mono">
                  ID: {submitResult.resident_id}
                </span>
                <span className="bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full font-mono">
                  {locale === 'am' ? 'የቤተሰብ መለያ' : locale === 'om' ? 'Iddeettii Maatii' : 'Household ID'}: {submitResult.household_id}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                {locale === 'am' ? 'ሌላ መዝግብ' : locale === 'om' ? 'Kan biraa galmeessi' : 'Register Another'}
              </button>
              <a href="/dashboard/manager/residents" className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                {locale === 'am' ? 'ነዋሪዎችን ይመልከቱ' : locale === 'om' ? 'Jiraattota ilaali' : 'View Residents'}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role="Kebele Manager" />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <IoPersonAddSharp className="text-blue-600" /> 
                {locale === 'am' ? 'አዲስ ነዋሪ መዝግብ' : locale === 'om' ? 'Jiraata Haaraa Galmeessi' : 'Add New Resident'}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {locale === 'am' 
                  ? 'የነዋሪውን ሙሉ መረጃ ይሙሉ' 
                  : locale === 'om'
                  ? 'Odeeffannoo guutuu jiraataa guuti'
                  : 'Fill in complete resident information'}
              </p>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
              {safeT('addResident.stepIndicator', { current: step, total: STEPS.length })}
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-0">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const done = step > s.id;
                const active = step === s.id;
                let label = String(safeT(s.labelKey) || s.labelKey);
                let desc = String(safeT(s.descKey) || s.descKey);
                
                if (locale === 'am') {
                  if (s.id === 1) { label = 'ግላዊ መረጃ'; desc = 'መሰረታዊ መረጃ'; }
                  else if (s.id === 2) { label = 'ቤተሰብ'; desc = 'መኖሪያ እና ቤተሰብ'; }
                  else if (s.id === 3) { label = 'አድራሻ እና ሥራ'; desc = 'የአድራሻ እና ሥራ መረጃ'; }
                  else if (s.id === 4) { label = 'ግምገማ'; desc = 'ማረጋገጫ እና ማስገባት'; }
                } else if (locale === 'om') {
                  if (s.id === 1) { label = 'Odeeffannoo Dhuunfaa'; desc = 'Odeeffannoo bu\'uuraa'; }
                  else if (s.id === 2) { label = 'Maatii'; desc = 'Jireenya fi maatii'; }
                  else if (s.id === 3) { label = 'Qunnamtii fi Hojii'; desc = 'Odeeffannoo quunnamtii fi hojii'; }
                  else if (s.id === 4) { label = 'Madaalli'; desc = 'Mirkaneessaa fi galmeessuu'; }
                }
                
                return (
                  <div key={s.id} className="flex items-center flex-1">
                    <button onClick={() => done && setStep(s.id)}
                      className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${done ? 'cursor-pointer' : 'cursor-default'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
                        ${done ? 'bg-green-500 text-white shadow-md' : active ? 'bg-blue-600 text-white shadow-lg ring-4 ring-blue-100' : 'bg-gray-100 text-gray-400'}`}>
                        {done ? <FaCheckCircle className="text-sm" /> : <Icon className="text-sm" />}
                      </div>
                      <div className="text-center hidden md:block">
                        <p className={`text-xs font-bold ${active ? 'text-blue-600' : done ? 'text-green-600' : 'text-gray-400'}`}>{label}</p>
                        <p className="text-[10px] text-gray-400">{desc}</p>
                      </div>
                    </button>
                    {i < STEPS.length - 1 && (
                      <div className={`h-0.5 w-6 md:w-12 flex-shrink-0 rounded-full transition-all duration-300 ${step > s.id ? 'bg-green-400' : 'bg-gray-200'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 min-h-[400px]">
            {step === 1 && <StepPersonal data={personal} onChange={updatePersonal} t={t} />}
            {step === 2 && <StepHousehold 
              data={household} 
              onChange={updateHousehold}
              searchMode={searchMode}
              setSearchMode={setSearchMode}
              t={t}
            />}
            {step === 3 && <StepContactJob data={contactJob} onChange={updateContact} phones={phones} setPhones={setPhones} t={t} />}
            {step === 4 && <StepReview personal={personal} household={household} contactJob={contactJob} phones={phones} t={t} />}
          </div>

          {apiErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
              <FaExclamationTriangle className="text-red-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                {apiErrors.map((e, i) => <p key={i} className="text-sm text-red-700">{e}</p>)}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button onClick={() => setStep(s => s - 1)} disabled={step === 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              <FaChevronLeft className="text-xs" /> {locale === 'am' ? 'ቀዳሚ' : locale === 'om' ? 'Durbaa' : 'Previous'}
            </button>
            <div className="flex items-center gap-2">
              {STEPS.map(s => (
                <div key={s.id} className={`rounded-full transition-all duration-300 ${step === s.id ? 'w-6 h-2 bg-blue-600' : step > s.id ? 'w-2 h-2 bg-green-400' : 'w-2 h-2 bg-gray-200'}`} />
              ))}
            </div>
            {step < STEPS.length ? (
              <button onClick={() => {
                if (step === 2) {
                  const error = validateHouseholdStep();
                  if (error) {
                    setApiErrors([error]);
                    return;
                  }
                }
                setStep(s => s + 1);
                setApiErrors([]);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all">
                {locale === 'am' ? 'ቀጣይ' : locale === 'om' ? 'Itti aansee' : 'Next'} <FaChevronRight className="text-xs" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white shadow-md hover:shadow-lg transition-all">
                {submitting ? <><FaSpinner className="animate-spin text-sm" /> {locale === 'am' ? 'በማስገባት ላይ...' : locale === 'om' ? 'Galmeessaa...' : 'Submitting...'}</> : <><FaSave className="text-sm" /> {locale === 'am' ? 'አስገባ' : locale === 'om' ? 'Galmeessi' : 'Submit'}</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
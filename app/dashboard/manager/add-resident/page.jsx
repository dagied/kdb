'use client';

import { withAuth } from '@/components/withAuth';
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  FaUser, FaHome, FaBriefcase, FaPhone, FaIdCard,
  FaCheckCircle, FaChevronRight, FaChevronLeft,
  FaUserFriends, FaMapMarkerAlt,
  FaCalendarAlt, FaSave, FaSearch, FaPlus, FaTimes,
  FaSpinner, FaExclamationTriangle
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

const EDUCATION_LEVELS = [
  'No Formal Education', 'Primary (1-8)', 'Secondary (9-12)', 'TVET / College', 'University', 'Postgraduate'
];

const RELIGIONS = [
  'Orthodox', 'Muslim', 'Protestant', 'Catholic', 'Traditional', 'Other'
];

// ==================== UI HELPERS ====================
const Field = ({ label, required, children, hint, error }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-1">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {error && <p className="text-[11px] text-red-500 flex items-center gap-1"><FaExclamationTriangle className="text-[10px]" />{error}</p>}
    {!error && hint && <p className="text-[11px] text-gray-400 italic">{hint}</p>}
  </div>
);

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

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
      <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
        <Icon className="text-white text-sm" />
      </div>
      <div>
        <h3 className="font-bold text-gray-800 text-base">{title}</h3>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
    </div>
  );
}

// ==================== STEP 1: PERSONAL INFO ====================
function StepPersonal({ data, onChange, t }) {
  const safeT = (key, fallback = '') => {
    const result = t(key);
    return typeof result === 'string' ? result : (fallback || key.split('.').pop() || key);
  };

  return (
    <div className="space-y-6">
      <SectionHeader icon={FaUser} title={safeT('addResident.sections.personal.title')} subtitle={safeT('addResident.sections.personal.subtitle')} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label={safeT('addResident.fields.firstName')} required>
          <Input icon={FaUser} placeholder={safeT('addResident.placeholders.firstName')} value={data.first_name} onChange={e => onChange('first_name', e.target.value)} />
        </Field>
        <Field label={safeT('addResident.fields.fatherName')} required>
          <Input icon={FaUser} placeholder={safeT('addResident.placeholders.fatherName')} value={data.father_name} onChange={e => onChange('father_name', e.target.value)} />
        </Field>
        <Field label={safeT('addResident.fields.grandfatherName')} required>
          <Input icon={FaUser} placeholder={safeT('addResident.placeholders.grandfatherName')} value={data.grandfather_name} onChange={e => onChange('grandfather_name', e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label={safeT('addResident.fields.dateOfBirth')} required>
          <Input icon={FaCalendarAlt} type="date" value={data.date_of_birth} onChange={e => onChange('date_of_birth', e.target.value)} />
        </Field>
        <Field label={safeT('addResident.fields.gender')} required>
          <Select value={data.gender} onChange={e => onChange('gender', e.target.value)}>
            <option value="">{safeT('buttons.select')}</option>
            {GENDERS.map(g => <option key={g.value} value={g.value}>{safeT(g.labelKey)}</option>)}
          </Select>
        </Field>
        <Field label={safeT('addResident.fields.maritalStatus')} required>
          <Select value={data.marital_status} onChange={e => onChange('marital_status', e.target.value)}>
            <option value="">{safeT('buttons.select')}</option>
            {MARITAL_STATUSES.map(s => <option key={s.value} value={s.value}>{safeT(s.labelKey)}</option>)}
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label={safeT('addResident.fields.placeOfBirth')}>
          <Input icon={FaMapMarkerAlt} placeholder={safeT('addResident.placeholders.placeOfBirth')} value={data.place_of_birth} onChange={e => onChange('place_of_birth', e.target.value)} />
        </Field>
        <Field label={safeT('addResident.fields.nationality')}>
          <Input icon={FaIdCard} placeholder={safeT('addResident.placeholders.nationality')} value={data.nationality} onChange={e => onChange('nationality', e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label={safeT('addResident.fields.nationalIdNumber')} hint={safeT('addResident.hints.leaveBlank')}>
          <Input icon={FaIdCard} placeholder={safeT('addResident.placeholders.nationalId')} value={data.national_id} onChange={e => onChange('national_id', e.target.value)} />
        </Field>
        <Field label={safeT('addResident.fields.previousKebele')}>
          <Input icon={FaMapMarkerAlt} placeholder={safeT('addResident.placeholders.previousKebele')} value={data.previous_kebele} onChange={e => onChange('previous_kebele', e.target.value)} />
        </Field>
      </div>
      <Field label={safeT('addResident.fields.proofOfResidence')} hint={safeT('addResident.hints.proofOfResidence')}>
        <Input icon={FaHome} placeholder={safeT('addResident.placeholders.proofOfResidence')} value={data.proof_of_residence} onChange={e => onChange('proof_of_residence', e.target.value)} />
      </Field>
    </div>
  );
}

// ==================== STEP 2: HOUSEHOLD ====================
function StepHousehold({ data, onChange, searchMode, setSearchMode, t }) {
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
      <SectionHeader icon={GiFamilyHouse} title={safeT('addResident.sections.household.title')} subtitle={safeT('addResident.sections.household.subtitle')} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label={safeT('addResident.fields.houseId')} required hint={safeT('addResident.hints.houseId')} error={searchError.house}>
          <div className="flex gap-2">
            <Input icon={FaHome} placeholder={safeT('addResident.placeholders.houseId')} value={data.house_id} onChange={e => onChange('house_id', e.target.value)} />
            <button onClick={searchHouse} disabled={searching.house || !data.house_id}
              className="flex-shrink-0 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 text-blue-600 border border-blue-200 rounded-xl px-3 transition-colors">
              {searching.house ? <FaSpinner className="text-sm animate-spin" /> : <FaSearch className="text-sm" />}
            </button>
          </div>
          {houseInfo && (
            <div className="mt-1.5 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700">
              <p className="flex items-center gap-2">
                <FaCheckCircle /> <strong>{safeT('addResident.actions.houseFound')}</strong>
              </p>
              <p>House ID: {houseInfo.house_id}</p>
              <p>House No: {houseInfo.house_no}</p>
              <p>Kebele: {houseInfo.kebele_name}</p>
              <p>Zone: {houseInfo.zone}</p>
            </div>
          )}
        </Field>
        <Field label={safeT('addResident.fields.householdRole')} required hint={safeT('addResident.hints.householdRole')}>
          <Select icon={FaUserFriends} value={data.household_role} onChange={e => onChange('household_role', e.target.value)}>
            <option value="">{safeT('buttons.select')}</option>
            {HOUSEHOLD_ROLES.map(r => <option key={r.value} value={r.value}>{safeT(r.labelKey)}</option>)}
          </Select>
        </Field>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{safeT('addResident.sections.householdRecord.title')}</p>
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
            🔗 {safeT('addResident.actions.linkExisting')}
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
            ➕ {safeT('addResident.actions.createNew')}
          </button>
        </div>

        {searchMode === 'existing' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label={safeT('addResident.fields.householdCode')} required hint={safeT('addResident.hints.householdCode')} error={searchError.household}>
                <div className="flex gap-2">
                  <Input 
                    icon={GiFamilyHouse} 
                    placeholder={safeT('addResident.placeholders.householdCode')} 
                    value={searchHouseholdCode} 
                    onChange={e => setSearchHouseholdCode(e.target.value.toUpperCase())} 
                  />
                  <button onClick={searchHousehold} disabled={searching.household || !searchHouseholdCode}
                    className="flex-shrink-0 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 text-blue-600 border border-blue-200 rounded-xl px-3 transition-colors">
                    {searching.household ? <FaSpinner className="text-sm animate-spin" /> : <FaSearch className="text-sm" />}
                  </button>
                </div>
              </Field>
              <Field label={safeT('addResident.fields.householdHeadName')} hint={safeT('addResident.hints.autoFilled')}>
                <Input 
                  placeholder={safeT('addResident.placeholders.householdHeadName')} 
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
                  <h4 className="font-semibold text-green-800">{safeT('addResident.actions.householdInformation')}</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">{safeT('addResident.fields.householdCode')}:</p>
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
                    <p className="text-gray-600">{safeT('addResident.fields.householdHeadName')}:</p>
                    <p className="font-semibold text-green-800">{householdInfo.head_name || safeT('addResident.messages.notAssigned')}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Members:</p>
                    <p className="font-semibold text-green-800">{householdInfo.member_count || 0}</p>
                  </div>
                </div>
                
                {householdInfo.members && householdInfo.members.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <p className="text-sm font-semibold text-green-800 mb-2">{safeT('addResident.actions.householdMembers')}:</p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {householdInfo.members.map((member, idx) => (
                        <div key={member.resident_id || idx} className="flex items-center gap-2 text-sm">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span>{member.full_name || `${member.fname} ${member.lname}`}</span>
                          {member.is_head && (
                            <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">{safeT('addResident.labels.head')}</span>
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
              <p className="font-semibold">{safeT('addResident.actions.newHouseholdNotice')}</p>
              <p className="text-xs mt-0.5">{safeT('addResident.actions.newHouseholdHelp')}</p>
              <p className="text-xs mt-1">{safeT('addResident.actions.householdAutoGenerated')}</p>
              <p className="text-xs mt-1 font-semibold">⚠️ {safeT('addResident.actions.newHouseholdRoleHint')}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-3">
        <p className="text-xs font-semibold text-green-700 uppercase tracking-widest flex items-center gap-2">
          <MdVerified /> {safeT('addResident.sections.verification.title')}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={safeT('addResident.fields.verifiedBy')} hint={safeT('addResident.hints.verificationBy')}>
            <Input placeholder="e.g. Lemlem Tadesse" value={data.verified_by} onChange={e => onChange('verified_by', e.target.value)} />
          </Field>
          <Field label={safeT('addResident.fields.verificationDate')}>
            <Input icon={FaCalendarAlt} type="date" value={data.verification_date} onChange={e => onChange('verification_date', e.target.value)} />
          </Field>
        </div>
        <Field label={safeT('addResident.fields.verificationNote')}>
          <textarea rows={2} placeholder={safeT('addResident.placeholders.notes')}
            value={data.verification_note} onChange={e => onChange('verification_note', e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none transition-all" />
        </Field>
      </div>
    </div>
  );
}

// ==================== STEP 3: CONTACT & JOB ====================
function StepContactJob({ data, onChange, phones, setPhones, t }) {
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
      <SectionHeader icon={FaPhone} title={safeT('addResident.sections.contact.title')} subtitle={safeT('addResident.sections.contact.subtitle')} />
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{safeT('addResident.actions.phoneNumbers')}</p>
          <button onClick={addPhone} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-xs font-semibold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
            <FaPlus className="text-[10px]" /> {safeT('addResident.actions.addPhone')}
          </button>
        </div>
        {phones.map((phone, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input icon={FaPhone} placeholder={safeT('addResident.placeholders.phoneNumber')} value={phone} onChange={e => updatePhone(i, e.target.value)} />
            {phones.length > 1 && (
              <button onClick={() => removePhone(i)} className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-xl p-2.5 transition-colors flex-shrink-0">
                <FaTimes className="text-sm" />
              </button>
            )}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label={safeT('addResident.fields.occupation')} hint={safeT('addResident.hints.occupation')}>
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <FaBriefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none z-10" />
              <input
                type="text"
                value={jobSearchTerm}
                onChange={handleJobInputChange}
                onFocus={() => setShowJobDropdown(true)}
                placeholder={safeT('addResident.placeholders.occupation')}
                className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-800
                  placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  transition-all duration-200 hover:border-gray-300"
              />
            </div>
            
            {showJobDropdown && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {loadingJobs ? (
                  <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                    <FaSpinner className="animate-spin" /> Loading jobs...
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
                        <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">Select</span>
                      </button>
                    ))}
                    {jobSearchTerm && !isExistingJob && (
                      <button
                        onClick={handleCreateNewJob}
                        className="w-full text-left px-4 py-2.5 hover:bg-green-50 transition-colors text-sm text-green-600 border-t border-gray-200 flex items-center gap-2"
                      >
                        <FaPlus className="text-xs" />
                        {safeT('addResident.actions.createJob')}: "{jobSearchTerm}"
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
                        {safeT('addResident.actions.createJob')}: "{jobSearchTerm}"
                      </button>
                    ) : (
                      'No jobs found'
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </Field>
        
        <Field label={safeT('addResident.fields.employer')} hint={safeT('addResident.hints.employer')}>
          <Input icon={FaMapMarkerAlt} placeholder={safeT('addResident.placeholders.employer')} value={data.employer} onChange={e => onChange('employer', e.target.value)} />
        </Field>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label={safeT('addResident.fields.educationLevel')}>
          <Select value={data.education_level} onChange={e => onChange('education_level', e.target.value)}>
            <option value="">{safeT('buttons.select')}</option>
            {EDUCATION_LEVELS.map(l => <option key={l}>{l}</option>)}
          </Select>
        </Field>
        <Field label={safeT('addResident.fields.religion')}>
          <Select value={data.religion} onChange={e => onChange('religion', e.target.value)}>
            <option value="">{safeT('buttons.select')}</option>
            {RELIGIONS.map(r => <option key={r}>{r}</option>)}
          </Select>
        </Field>
      </div>
      
      <Field label={safeT('addResident.fields.additionalNotes')}>
        <textarea rows={3} placeholder={safeT('addResident.placeholders.notes')}
          value={data.notes} onChange={e => onChange('notes', e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all" />
      </Field>
    </div>
  );
}

// ==================== STEP 4: REVIEW ====================
function StepReview({ personal, household, contactJob, phones, t }) {
  const safeT = (key, fallback = '') => {
    const result = t(key);
    return typeof result === 'string' ? result : (fallback || key.split('.').pop() || key);
  };

  const Row = ({ label, value }) => value ? (
    <div className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-400 w-36 flex-shrink-0 pt-0.5 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-gray-800 font-medium">{value}</span>
    </div>
  ) : null;

  const Card = ({ title, icon: Icon, color, children }) => (
    <div className={`rounded-2xl border ${color} p-5 space-y-1`}>
      <p className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-3 ${color.includes('blue') ? 'text-blue-600' : color.includes('green') ? 'text-green-600' : color.includes('purple') ? 'text-purple-600' : 'text-amber-600'}`}>
        <Icon /> {title}
      </p>
      {children}
    </div>
  );

  const fullName = [personal.first_name, personal.father_name, personal.grandfather_name].filter(Boolean).join(' ');

  return (
    <div className="space-y-5">
      <SectionHeader icon={MdVerified} title={safeT('addResident.sections.review.title')} subtitle={safeT('addResident.sections.review.subtitle')} />
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white flex items-center gap-4">
        <div className="w-14 h-14 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center text-2xl">
          <IoPersonAddSharp />
        </div>
        <div>
          <p className="font-bold text-lg">{fullName || '—'}</p>
          <p className="text-blue-200 text-sm">{personal.gender} · {personal.date_of_birth} · {personal.marital_status}</p>
          <p className="text-blue-100 text-xs mt-0.5">{safeT('addResident.fields.householdRole')}: {household.household_role || '—'}</p>
          <p className="text-blue-100 text-xs">{household.create_new_household ? safeT('addResident.actions.newHouseholdNotice') : `Household ID: ${household.household_id || '—'}`}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title={safeT('addResident.review.personalInfo')} icon={FaUser} color="border-blue-100 bg-blue-50">
          <Row label={safeT('addResident.review.fullName')} value={fullName} />
          <Row label={safeT('addResident.fields.dateOfBirth')} value={personal.date_of_birth} />
          <Row label={safeT('addResident.fields.nationality')} value={personal.nationality} />
          <Row label={safeT('addResident.fields.placeOfBirth')} value={personal.place_of_birth} />
          <Row label={safeT('addResident.fields.nationalIdNumber')} value={personal.national_id} />
          <Row label={safeT('addResident.fields.previousKebele')} value={personal.previous_kebele} />
        </Card>
        <Card title={safeT('addResident.review.household')} icon={GiFamilyHouse} color="border-green-100 bg-green-50">
          <Row label={safeT('addResident.fields.houseId')} value={household.house_id} />
          <Row label={safeT('addResident.fields.householdCode')} value={household.household_code || (household.create_new_household ? safeT('addResident.review.newHouseholdAuto') : '—')} />
          <Row label="Household ID" value={household.create_new_household ? safeT('addResident.review.newHousehold') : household.household_id} />
          <Row label={safeT('addResident.fields.householdRole')} value={household.household_role} />
          <Row label={safeT('addResident.fields.householdHeadName')} value={household.household_head_name} />
          <Row label={safeT('addResident.fields.verifiedBy')} value={household.verified_by} />
          <Row label={safeT('addResident.fields.verificationDate')} value={household.verification_date} />
        </Card>
        <Card title={safeT('addResident.review.contactJob')} icon={FaPhone} color="border-purple-100 bg-purple-50">
          <Row label={safeT('addResident.review.phoneNumbers')} value={phones.filter(Boolean).join(', ')} />
          <Row label={safeT('addResident.fields.occupation')} value={contactJob.job_title} />
          <Row label={safeT('addResident.fields.employer')} value={contactJob.employer} />
          <Row label={safeT('addResident.fields.educationLevel')} value={contactJob.education_level} />
          <Row label={safeT('addResident.fields.religion')} value={contactJob.religion} />
        </Card>
        <Card title={safeT('addResident.review.proofNotes')} icon={FaIdCard} color="border-amber-100 bg-amber-50">
          <Row label={safeT('addResident.fields.proofOfResidence')} value={personal.proof_of_residence} />
          <Row label={safeT('addResident.fields.verificationNote')} value={household.verification_note} />
          <Row label={safeT('addResident.fields.additionalNotes')} value={contactJob.notes} />
        </Card>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-sm text-amber-800">
        <span className="text-lg">📋</span>
        <p>{safeT('addResident.actions.reviewConfirm')}</p>
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
export default function AddResidentPage() {
  const { t, loading } = useTranslation();
  
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
    national_id: '', previous_kebele: '', proof_of_residence: ''
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

    const payload = {
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
      house_id: household.house_id,
      household_role: household.household_role,
      household_head_name: household.household_head_name,
      verified_by: household.verified_by,
      verification_date: household.verification_date,
      verification_note: household.verification_note,
      create_new_household: household.create_new_household === true,
      household_id: household.create_new_household ? null : (household.household_id ? Number(household.household_id) : null),
      job_title: contactJob.job_title,
      employer: contactJob.employer,
      education_level: contactJob.education_level,
      religion: contactJob.religion,
      notes: contactJob.notes,
      phones: phones.filter(Boolean),
    };

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

  if (loading) {
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
              <h2 className="text-2xl font-bold text-gray-800">{safeT('addResident.actions.successTitle')}</h2>
              <p className="text-gray-500 mt-1">{fullName} {safeT('addResident.actions.successSubtitle')}</p>
              <div className="mt-3 flex items-center justify-center gap-4 text-sm">
                <span className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full font-mono">
                  ID: {submitResult.resident_id}
                </span>
                <span className="bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full font-mono">
                  Household ID: {submitResult.household_id}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                {safeT('addResident.actions.addAnother')}
              </button>
              <a href="/dashboard/manager/residents" className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                {safeT('addResident.actions.viewResidents')}
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
                <IoPersonAddSharp className="text-blue-600" /> {safeT('addResident.title')}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">{safeT('addResident.description')}</p>
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
                const label = String(safeT(s.labelKey) || s.labelKey);
                const desc = String(safeT(s.descKey) || s.descKey);
                
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
              <FaChevronLeft className="text-xs" /> {safeT('buttons.previous')}
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
                {safeT('buttons.next')} <FaChevronRight className="text-xs" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white shadow-md hover:shadow-lg transition-all">
                {submitting ? <><FaSpinner className="animate-spin text-sm" /> {safeT('buttons.submitting')}</> : <><FaSave className="text-sm" /> {safeT('buttons.submit')}</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
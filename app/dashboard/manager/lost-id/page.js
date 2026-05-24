// app/dashboard/manager/lost-id/page.js - Fixed translations
'use client';

import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Sidebar from '@/components/Sidebar';
import {
  FaSearch, FaIdCard, FaCheckCircle, FaTimes,
  FaExclamationTriangle, FaPrint, FaUserCheck,
  FaHome, FaUsers, FaUser, FaBan,
  FaSpinner, FaInfoCircle, FaArrowLeft, FaUpload,
  FaFilePdf, FaImage, FaTrash
} from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';
import { GiConfirmed, GiFamilyHouse } from 'react-icons/gi';

export default function LostIdRequestPage() {
  const { t, locale, loading: translationLoading } = useTranslation();
  
  // Search state
  const [searchType, setSearchType] = useState('house');
  const [searchValue, setSearchValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Resident and ID data
  const [activeIdCard, setActiveIdCard] = useState(null);
  const [resident, setResident] = useState(null);
  const [searchError, setSearchError] = useState('');
  
  // Police report document
  const [policeReportFile, setPoliceReportFile] = useState(null);
  const [policeReportPreview, setPoliceReportPreview] = useState(null);
  const [policeReportNumber, setPoliceReportNumber] = useState('');
  const [policeReportError, setPoliceReportError] = useState('');
  
  // Lost ID processing
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmationSlip, setConfirmationSlip] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Verification state (simplified - just document uploaded)
  const [hasPoliceReport, setHasPoliceReport] = useState(false);

  // Translations
const translations = {
  en: {
    title: 'Lost ID Request Processing',
    subtitle: 'Search for resident, upload police report, and issue replacement ID',
    'Lost ID': 'Lost ID Management',
    'to make the lost id inactive': 'Mark lost ID as inactive and issue replacement',
    step1: 'Step 1: Find Resident',
    step2: 'Step 2: Upload Police Report',
    step3: 'Step 3: Confirmation Slip Generated',
    searchBy: 'Search by:',
    houseNumber: 'House Number',
    householdNumber: 'Household Code',
    name: 'Full Name',
    enterHouseNumber: 'Enter house number (e.g., H-0001)',
    enterHouseholdNumber: 'Enter household code (e.g., HH-8923)',
    enterName: 'Enter full name',
    search: 'Search',
    searching: 'Searching...',
    residentFound: 'Resident Found',
    idInformation: 'ID Information',
    fullName: 'Full Name',
    idNumber: 'ID Number',
    fathersName: "Father's Name",
    houseNumberLabel: 'House Number',
    birthDate: 'Birth Date',
    idStatus: 'ID Status',
    issueDate: 'Issue Date',
    expiryDate: 'Expiry Date',
    active: 'ACTIVE',
    cancelled: 'CANCELLED',
    policeReportRequired: 'Police Report Required',
    policeReportInstructions: 'Upload the police report document confirming the ID is lost',
    policeReportNumber: 'Police Report Number',
    enterPoliceReportNumber: 'Enter police report number',
    uploadPoliceReport: 'Upload Police Report',
    supportedFormats: 'Supported formats: PDF, JPEG, PNG (Max: 5MB)',
    chooseFile: 'Choose File',
    fileSelected: 'File selected',
    removeFile: 'Remove',
    requiredDocument: 'Police report is required to process lost ID',
    processLostId: 'Process Lost ID & Issue New ID',
    processing: 'Processing...',
    note: 'Note',
    cancellationNote: 'The police report will be stored with the resident\'s record. Once cancelled, the old ID cannot be reactivated.',
    printSlip: 'Print Slip',
    processAnother: 'Process Another Request',
    nextSteps: 'Next Steps',
    instruction1: 'Give this slip to the resident',
    instruction2: 'Resident takes slip to Record Officer',
    instruction3: 'Record Officer issues new ID card',
    instruction4: 'Old ID number is permanently invalidated',
    issuedOn: 'Issued on',
    slipNumber: 'Slip Number',
    residentName: 'Resident Name',
    lostIdNumber: 'Lost ID Number',
    newIdNumber: 'New ID Number',
    dateReported: 'Date Reported',
    status: 'Status',
    processedBy: 'Processed by',
    kebele: 'Kebele',
    policeReportNumberLabel: 'Police Report #',
    back: 'Back',
    idCancelled: 'ID Cancelled',
    newIdIssued: 'New ID Issued',
    residentNotFound: 'Resident not found. Please check the information and try again.',
    noActiveId: 'No active ID card found for this resident.',
    selectResident: 'Select a resident from search results'
  },
  am: {
    title: 'የጠፋ መታወቂያ ማመልከቻ ሂደት',
    subtitle: 'ነዋሪን ይፈልጉ፣ የፖሊስ ሪፖርት ይስቀሉ፣ እና መተኪያ መታወቂያ ይስጡ',
    'Lost ID': 'የጠፋ መታወቂያ ያስተዳደርሉ',
    'to make the lost id inactive': 'ጠፋውን መታወቂያ ወደ ተግባራ ያልሆነ ደረጃ ይዋቅሩ እና መተኪያ ይወጡ',
    step1: 'ደረጃ 1: ነዋሪን ይፈልጉ',
    step2: 'ደረጃ 2: የፖሊስ ሪፖርት ይስቀሉ',
    step3: 'ደረጃ 3: የማረጋገጫ ወረቀት ተዘጋጅቷል',
    searchBy: 'ፈልግ በ:',
    houseNumber: 'ቤት ቁጥር',
    householdNumber: 'የቤተሰብ ኮድ',
    name: 'ሙሉ ስም',
    enterHouseNumber: 'የቤት ቁጥር ያስገቡ',
    enterHouseholdNumber: 'የቤተሰብ ኮድ ያስገቡ',
    enterName: 'ሙሉ ስም ያስገቡ',
    search: 'ፈልግ',
    searching: 'በመፈለግ ላይ...',
    residentFound: 'ነዋሪ ተገኝቷል',
    idInformation: 'የመታወቂያ መረጃ',
    fullName: 'ሙሉ ስም',
    idNumber: 'የመታወቂያ ቁጥር',
    fathersName: 'የአባት ስም',
    houseNumberLabel: 'ቤት ቁጥር',
    birthDate: 'የልደት ቀን',
    idStatus: 'የመታወቂያ ሁኔታ',
    issueDate: 'የተሰጠበት ቀን',
    expiryDate: 'የሚያበቃበት ቀን',
    active: 'ንቁ',
    cancelled: 'ተሰርዟል',
    policeReportRequired: 'የፖሊስ ሪፖርት ያስፈልጋል',
    policeReportInstructions: 'ፖሊስ ሪፖርት መታወቂያው መጥፋቱን የሚያረጋግጥ ሰነድ ይስቀሉ',
    policeReportNumber: 'የፖሊስ ሪፖርት ቁጥር',
    enterPoliceReportNumber: 'የፖሊስ ሪፖርት ቁጥር ያስገቡ',
    uploadPoliceReport: 'የፖሊስ ሪፖርት ስቀል',
    supportedFormats: 'የሚደገፉ ቅርጸቶች: PDF, JPEG, PNG (ከፍተኛ 5MB)',
    chooseFile: 'ፋይል ምረጥ',
    fileSelected: 'ፋይል ተመርጧል',
    removeFile: 'አስወግድ',
    requiredDocument: 'የጠፋ መታወቂያ ለማስኬድ የፖሊስ ሪፖርት ያስፈልጋል',
    processLostId: 'የጠፋውን መታወቂያ አስኬድ እና አዲስ አውጣ',
    processing: 'በማስኬድ ላይ...',
    note: 'ማስታወሻ',
    cancellationNote: 'የፖሊስ ሪፖርት ከነዋሪው መዝገብ ጋር ይቀመጣል። አንዴ ከተሰረዘ በኋላ የድሮው መታወቂያ እንደገና ጥቅም ላይ ሊውል አይችልም።',
    printSlip: 'ማረጋገጫ አትም',
    processAnother: 'ሌላ ጥያቄ አስኬድ',
    nextSteps: 'ቀጣይ እርምጃዎች',
    instruction1: 'ይህን ማረጋገጫ ለነዋሪ ይስጡ',
    instruction2: 'ነዋሪው ማረጋገጫውን ለመዝገብ ኃላፊ ያቀርባል',
    instruction3: 'መዝገብ ኃላፊ አዲስ መታወቂያ ያወጣል',
    instruction4: 'የቆየው መታወቂያ ቁጥር በቋሚነት ይሰረዛል',
    issuedOn: 'የተሰጠበት ቀን',
    slipNumber: 'የማረጋገጫ ቁጥር',
    residentName: 'የነዋሪ ስም',
    lostIdNumber: 'የጠፋው መታወቂያ ቁጥር',
    newIdNumber: 'አዲስ መታወቂያ ቁጥር',
    dateReported: 'የተዘገበበት ቀን',
    status: 'ሁኔታ',
    processedBy: 'ያስኬደው ሰው',
    kebele: 'ቀበሌ',
    policeReportNumberLabel: 'የፖሊስ ሪፖርት ቁጥር',
    back: 'ተመለስ',
    idCancelled: 'መታወቂያ ተሰርዟል',
    newIdIssued: 'አዲስ መታወቂያ ተሰጥቷል',
    residentNotFound: 'ነዋሪ አልተገኘም',
    noActiveId: 'ምንም ንቁ መታወቂያ አልተገኘም'
  },
  om: {
    title: 'Eenvoo ID Baddeessa',
    subtitle: 'Bilisa barbaadi, ragaa poolisii baafadhu, fi ID bakka bu\'aa kenni',
    'Lost ID': 'Bulchiinsa ID Badeessaa',
    'to make the lost id inactive': 'ID badeesse gochuu hin hojjatin fi ID bakka bu\'aa kenni',
    step1: 'Tarkaanfi 1: Bilisa Barbaadi',
    step2: 'Tarkaanfi 2: Ragaa Poolisii Baafadhu',
    step3: 'Tarkaanfi 3: Waraqaa Mirkaneessaa Uumame',
    searchBy: 'Barbaadi:',
    houseNumber: 'Lakkoofsa Mana',
    householdNumber: 'Koodii Maatii',
    name: 'Maqaa Guutuu',
    enterHouseNumber: 'Lakkoofsa mana galchi',
    enterHouseholdNumber: 'Koodii maatii galchi',
    enterName: 'Maqaa guutuu galchi',
    search: 'Barbaadi',
    searching: 'Barbaadamaa jira...',
    residentFound: 'Bilisa Arganne',
    idInformation: 'Odeeffannoo ID',
    fullName: 'Maqaa Guutuu',
    idNumber: 'Lakkoofsa ID',
    fathersName: 'Maqaa Abbaa',
    houseNumberLabel: 'Lakkoofsa Mana',
    birthDate: 'Guyyaa Dhaloota',
    idStatus: 'Haala ID',
    issueDate: 'Guyyaa Kennamedha',
    expiryDate: 'Guyyaa Xumurawa',
    active: 'Aktiivii',
    cancelled: 'Haquf',
    policeReportRequired: 'Ragaa Poolisii Barbaachisa',
    policeReportInstructions: 'Ragaa poolisii ID baddeesse jiraachuu isaa mirkaneessu baafadhu',
    policeReportNumber: 'Lakkoofsa Ragaalee Poolisii',
    enterPoliceReportNumber: 'Lakkoofsa ragaalee poolisii galchi',
    uploadPoliceReport: 'Ragaa Poolisii Baafadhu',
    supportedFormats: 'Foormaatota deeggaraman: PDF, JPEG, PNG (Ol ta\'aa: 5MB)',
    chooseFile: 'Faayilaa Filadhu',
    fileSelected: 'Faayilli filatame',
    removeFile: 'Balleessi',
    requiredDocument: 'Ragaan poolisii ID badeessaa hojjechuuf barbaachisa',
    processLostId: 'ID Badeessaa Hojjechi fi Haaraa Kenni',
    processing: 'Itoophiyaa...',
    note: 'Hubadhaa',
    cancellationNote: 'Ragaaleen poolisii galmee jiraataa waliin ni kuufama. Yeroo haquf ID moofaan deebi\'ee itti fayyadamuu hin danda\'u.',
    printSlip: 'Waraqaa Maxxansuu',
    processAnother: 'Kadhaa Biroo Hojjechi',
    nextSteps: 'Tarkaanfiiwwan Ittaan',
    instruction1: 'Waraqaa mirkaneessaa kana jiraataaf kenni',
    instruction2: 'Jiraataan waraqaa Record Officer kenni',
    instruction3: 'Record Officer ID haaraa kenna',
    instruction4: 'Lakkoofsi ID moofaan haquf',
    issuedOn: 'Guyyaa Kennamedhe',
    slipNumber: 'Lakkoofsa Waraqaa',
    residentName: 'Maqaa Bilisaa',
    lostIdNumber: 'Lakkoofsa ID Badeesse',
    newIdNumber: 'Lakkoofsa ID Haaraa',
    dateReported: 'Guyyaa Gabaasame',
    status: 'Haala',
    processedBy: 'Kan Hojjechise',
    kebele: 'Qeebele',
    policeReportNumberLabel: 'Lakkoofsa Ragaalee Poolisii #',
    back: 'Duuba',
    idCancelled: 'ID Haquf',
    newIdIssued: 'ID Haaraa Kennamte',
    residentNotFound: 'Bilisa hin argamne',
    noActiveId: 'ID aktiivii hin argamne'
  }
};

  const tText = (key) => {
    return translations[locale]?.[key] || translations.en[key] || key;
  };

  // Handle police report file upload
  const handlePoliceReportUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setPoliceReportError('Please select a PDF or image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setPoliceReportError('File size must be less than 5MB');
        return;
      }
      
      setPoliceReportFile(file);
      setPoliceReportError('');
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setPoliceReportPreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setPoliceReportPreview('pdf');
      }
    }
  };

  const removePoliceReport = () => {
    setPoliceReportFile(null);
    setPoliceReportPreview(null);
    setPoliceReportNumber('');
  };

  // Search resident
  const handleSearch = async () => {
    if (!searchValue.trim()) {
      setSearchError('Please enter a search value');
      return;
    }

    setIsSearching(true);
    setSearchError('');
    setResident(null);
    setActiveIdCard(null);
    setHasPoliceReport(false);
    setConfirmationSlip(null);

    try {
      let apiType = '';
      if (searchType === 'houseNumber') {
        apiType = 'house';
      } else if (searchType === 'householdNumber') {
        apiType = 'household';
      } else {
        apiType = 'name';
      }

      const url = `/api/manager/residents/search?q=${encodeURIComponent(searchValue.trim())}&type=${apiType}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      
      const data = await response.json();

      if (!data.success || !data.residents || data.residents.length === 0) {
        setSearchError(tText('residentNotFound'));
        return;
      }
      
      const selectedResident = data.residents[0];
      setResident(selectedResident);

      // Fetch active ID card
      const idResponse = await fetch(`/api/manager/id-card/active?residentId=${selectedResident.resident_id}`);
      const idData = await idResponse.json();

      if (idData.success && idData.idCard) {
        setActiveIdCard(idData.idCard);
      } else {
        setSearchError(tText('noActiveId'));
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError(tText('residentNotFound'));
    } finally {
      setIsSearching(false);
    }
  };

  // Process lost ID with police report
  // app/dashboard/manager/lost-id/page.js
// Update the handleProcessLostId function

// Process lost ID with police report (UPDATED - No new ID issuance)
// Process lost ID with police report
const handleProcessLostId = async () => {
  if (!activeIdCard || !resident) return;
  
  if (!policeReportFile && !policeReportNumber) {
    setPoliceReportError(tText('requiredDocument'));
    return;
  }
  
  setIsProcessing(true);
  setSearchError('');
  
  try {
    // Convert file to base64 if exists
    let policeReportBase64 = null;
    if (policeReportFile) {
      const reader = new FileReader();
      policeReportBase64 = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(policeReportFile);
      });
    }

    const response = await fetch('/api/manager/lost-id', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resident_id: resident.resident_id,
        police_report_number: policeReportNumber,
        police_report_document: policeReportBase64,
        loss_reason: 'lost'
      })
    });

    const data = await response.json();
    
    console.log('API Response:', data);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to process lost ID');
    }
    
    if (data.success) {
      // Create confirmation slip
      const slip = {
        slipNumber: data.data.confirmation_slip.slip_number,
        residentName: data.data.resident.full_name,
        houseNumber: data.data.resident.house_number,
        oldIdNumber: data.data.old_id.id_number,
        policeReportNumber: policeReportNumber || data.data.confirmation_slip.police_report,
        reportDate: data.data.confirmation_slip.report_date,
        status: 'CANCELLED',
        officerName: data.data.confirmation_slip.verified_by || 'Kebele Manager',
        kebeleName: 'Bossa Addis Kebele'
      };
      
      setConfirmationSlip(slip);
      setSuccessMessage(`ID Cancelled! The ID ${data.data.old_id.id_number} has been deactivated.`);
      setHasPoliceReport(true);
      
      // Update the activeIdCard to show it's cancelled
      setActiveIdCard({
        ...activeIdCard,
        status: 'cancelled'
      });
    } else {
      throw new Error(data.message || 'Unknown error occurred');
    }
  } catch (error) {
    console.error('Error:', error);
    setSearchError(error.message);
  } finally {
    setIsProcessing(false);
  }
};

  const handlePrintSlip = () => {
    const printContent = document.getElementById('confirmation-slip');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      printWindow?.document.write(`
        <html>
          <head>
            <title>Lost ID Confirmation Slip</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; }
              .slip { max-width: 600px; margin: 0 auto; border: 2px solid #333; padding: 20px; border-radius: 10px; }
              .header { text-align: center; border-bottom: 2px solid #333; margin-bottom: 20px; padding-bottom: 10px; }
              .content { margin: 20px 0; }
              .footer { margin-top: 30px; font-size: 12px; text-align: center; border-top: 1px solid #ccc; padding-top: 20px; }
              .label { font-weight: bold; min-width: 150px; display: inline-block; }
              .status { color: #dc2626; font-weight: bold; }
              .instructions { background: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 20px; }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      printWindow?.print();
      printWindow?.close();
    }
  };

 const resetForm = () => {
  setResident(null);
  setActiveIdCard(null);
  setConfirmationSlip(null);
  setSearchValue('');
  setPoliceReportFile(null);
  setPoliceReportPreview(null);
  setPoliceReportNumber('');
  setPoliceReportError('');
  setSuccessMessage('');
  setSearchError('');
  setHasPoliceReport(false);
};

  if (translationLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar role="Kebele Manager" />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role="Kebele Manager" />
      
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <FaIdCard className="text-blue-600" />
                {tText('Lost ID')}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">{tText('to make the lost id inactive')}</p>
            </div>
            
            {/* Language Selector */}
            <LanguageSwitcher />
          </div>

          {/* Step 1: Search Resident */}
          {!resident && !confirmationSlip && (
            <div className="bg-white rounded-2xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
                <FaSearch className="text-blue-600" />
                {tText('step1')}
              </h2>
              
              <div className="mb-5">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                  {tText('searchBy')}
                </label>
                <div className="flex gap-4 flex-wrap">
                  <label className="flex items-center gap-2">
                    <input type="radio" value="house" checked={searchType === 'houseNumber'} onChange={() => setSearchType('houseNumber')} />
                    <FaHome /> {tText('houseNumber')}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" value="household" checked={searchType === 'householdNumber'} onChange={() => setSearchType('householdNumber')} />
                    <GiFamilyHouse /> {tText('householdNumber')}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" value="name" checked={searchType === 'name'} onChange={() => setSearchType('name')} />
                    <FaUser /> {tText('name')}
                  </label>
                </div>
              </div>
              
              <div className="flex gap-3">
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={
                    searchType === 'houseNumber' ? tText('enterHouseNumber') :
                    searchType === 'householdNumber' ? tText('enterHouseholdNumber') :
                    tText('enterName')
                  }
                  className="flex-1 px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
                >
                  {isSearching ? <FaSpinner className="animate-spin" /> : <FaSearch />}
                  {isSearching ? tText('searching') : tText('search')}
                </button>
              </div>
              
              {searchError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                  <FaExclamationTriangle /> {searchError}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Upload Police Report */}
          {resident && activeIdCard && !confirmationSlip && (
            <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FaUserCheck className="text-green-600" />
                {tText('step2')}
              </h2>
              
             

              {/* Resident Info Card - Add a refresh button */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-blue-900">{tText('residentFound')}</h3>
                    <button 
                      onClick={async () => {
                        // Refresh ID card status
                        const idResponse = await fetch(`/api/manager/id-card/active?residentId=${resident.resident_id}`);
                        const idData = await idResponse.json();
                        if (idData.success && idData.idCard) {
                          setActiveIdCard(idData.idCard);
                        }
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Refresh Status
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="font-medium">{tText('fullName')}:</span> {activeIdCard?.full_name || `${resident.fname} ${resident.lname}`}</div>
                    <div><span className="font-medium">{tText('idNumber')}:</span> {activeIdCard?.id_number}</div>
                    <div><span className="font-medium">{tText('houseNumberLabel')}:</span> {resident.house_number || resident.house_id}</div>
                    <div><span className="font-medium">{tText('idStatus')}:</span> 
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                        activeIdCard?.status === 'active' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                      }`}>
                        {activeIdCard?.status === 'active' ? tText('active') : tText('cancelled')}
                      </span>
                    </div>
                  </div>
                </div>

              {/* Police Report Upload Section */}
              <div className="border-2 border-dashed border-red-300 rounded-xl p-6 bg-red-50">
                <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                  <FaFilePdf /> {tText('policeReportRequired')}
                </h3>
                <p className="text-sm text-red-600 mb-4">{tText('policeReportInstructions')}</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {tText('policeReportNumber')}
                    </label>
                    <input
                      type="text"
                      value={policeReportNumber}
                      onChange={(e) => setPoliceReportNumber(e.target.value)}
                      placeholder={tText('enterPoliceReportNumber')}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {tText('uploadPoliceReport')}
                    </label>
                    
                    {!policeReportPreview ? (
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:bg-gray-50">
                        <FaUpload className="text-3xl text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">{tText('chooseFile')}</p>
                        <p className="text-xs text-gray-400 mt-1">{tText('supportedFormats')}</p>
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handlePoliceReportUpload} className="hidden" />
                      </label>
                    ) : (
                      <div className="border rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {policeReportPreview === 'pdf' ? (
                              <FaFilePdf className="text-red-500 text-3xl" />
                            ) : (
                              <img src={policeReportPreview} alt="Preview" className="w-16 h-16 object-cover rounded" />
                            )}
                            <div>
                              <p className="font-medium text-sm">{policeReportFile?.name}</p>
                              <p className="text-xs text-gray-500">{(policeReportFile?.size / 1024).toFixed(2)} KB</p>
                            </div>
                          </div>
                          <button onClick={removePoliceReport} className="text-red-500 hover:text-red-700">
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {policeReportError && (
                    <p className="text-red-600 text-sm flex items-center gap-1">
                      <FaExclamationTriangle /> {policeReportError}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                <p className="text-yellow-800 text-sm flex items-center gap-2">
                  <FaInfoCircle />
                  <strong>{tText('note')}:</strong> {tText('cancellationNote')}
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setResident(null);
                    setActiveIdCard(null);
                    setSearchValue('');
                  }}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 flex items-center justify-center gap-2"
                >
                  <FaArrowLeft /> {tText('back')}
                </button>
                <button
                  onClick={handleProcessLostId}
                  disabled={isProcessing || (!policeReportFile && !policeReportNumber)}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  {isProcessing ? <FaSpinner className="animate-spin" /> : <FaBan />}
                  {isProcessing ? tText('processing') : tText('processLostId')}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation Slip */}
          {/* Step 3: Confirmation Slip - No new ID displayed */}
          {confirmationSlip && (
            <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <GiConfirmed className="text-green-600" />
                {tText('step3')}
              </h2>
              
              {successMessage && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                  {successMessage}
                </div>
              )}
              
              <div id="confirmation-slip" className="border-2 rounded-xl p-6">
                <div className="text-center border-b pb-4 mb-4">
                  <h2 className="text-xl font-bold">Bossa Addis Kebele</h2>
                  <p className="text-gray-500 text-sm">{tText('title')}</p>
                </div>
                
                <div className="space-y-2 mb-4">
                  <p><span className="font-medium">{tText('slipNumber')}:</span> {confirmationSlip.slipNumber}</p>
                  <p><span className="font-medium">{tText('residentName')}:</span> {confirmationSlip.residentName}</p>
                  <p><span className="font-medium">{tText('houseNumberLabel')}:</span> {confirmationSlip.houseNumber}</p>
                  <p><span className="font-medium">{tText('lostIdNumber')}:</span> {confirmationSlip.oldIdNumber}</p>
                  <p><span className="font-medium">{tText('policeReportNumberLabel')}:</span> {confirmationSlip.policeReportNumber}</p>
                  <p><span className="font-medium">{tText('dateReported')}:</span> {confirmationSlip.reportDate}</p>
                  <p><span className="font-medium">{tText('status')}:</span> <span className="text-red-600 font-bold">{tText('idCancelled')}</span></p>
                </div>
                
                {/* Important Message for Resident */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <p className="text-blue-800 text-sm font-semibold mb-2">
                    📋 Important:
                  </p>
                  <p className="text-blue-700 text-sm">
                    Your ID has been deactivated. Take this slip to the Record Officer to request a new ID.
                  </p>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-xl">
                  <p className="font-semibold mb-2">{tText('nextSteps')}:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Take this slip to the Record Officer</li>
                    <li>Submit new passport-size photographs</li>
                    <li>Record Officer will issue your new ID</li>
                    <li>Your old ID number is permanently invalidated</li>
                  </ol>
                </div>
                
                <div className="text-center text-xs text-gray-400 mt-4 pt-4 border-t">
                  <p>{tText('issuedOn')}: {new Date().toLocaleString()}</p>
                  <p className="mt-1">Processed by: {confirmationSlip.officerName}</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button onClick={handlePrintSlip} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2">
                  <FaPrint /> {tText('printSlip')}
                </button>
                <button onClick={resetForm} className="flex-1 py-2.5 bg-gray-600 text-white rounded-xl hover:bg-gray-700">
                  {tText('processAnother')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
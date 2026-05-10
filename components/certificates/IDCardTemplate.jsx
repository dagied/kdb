'use client';
import { useRef, useEffect, useState } from 'react';
import QRCode from 'qrcode.react';

export default function IDCardTemplate({ data, onLoad, residentData }) {
  const frontRef = useRef();
  const backRef = useRef();
  const [qrValue, setQrValue] = useState('');

  useEffect(() => {
    // Generate QR code data
    const qrData = JSON.stringify({
      id: data.id_number,
      name: data.full_name,
      father: data.father_name,
      birth: data.birth_date_gc,
      issue: data.issue_date_gc,
      expiry: data.expiry_date_gc,
      phone: data.phone,
      address: data.residence
    });
    setQrValue(qrData);
    
    if (onLoad && frontRef.current && backRef.current) {
      onLoad({ front: frontRef.current, back: backRef.current });
    }
  }, [data, onLoad]);

  return (
    <div className="max-w-md mx-auto">
      {/* FRONT OF ID CARD */}
      <div ref={frontRef} className="bg-white rounded-xl overflow-hidden shadow-2xl mb-4 border border-gray-300">
        {/* Header with Ethiopian Flag */}
        <div className="bg-gradient-to-r from-green-600 via-yellow-500 to-red-600 p-2">
          <div className="bg-white rounded-lg p-2">
            <div className="flex items-center justify-between">
              <div className="w-12 h-8">
                <img 
                  src="https://flagcdn.com/et.svg" 
                  alt="Ethiopian Flag" 
                  className="w-full h-full object-cover rounded"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 3 2'%3E%3Crect width='3' height='2' fill='%23078930'/%3E%3Crect y='0.66' width='3' height='0.66' fill='%23fcdd09'/%3E%3Crect y='1.32' width='3' height='0.68' fill='%23da121a'/%3E%3C/svg%3E";
                  }}
                />
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-gray-800">Federal Democratic Republic of Ethiopia</p>
                <p className="text-[10px] text-gray-600">የኢትዮጵያ ፌዴራላዊ ዴሞክራሲያዊ ሪፐብሊክ</p>
              </div>
              <div className="w-12"></div>
            </div>
          </div>
        </div>
        
        {/* ID Card Title */}
        <div className="text-center py-2 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">Resident ID Card</h2>
          <p className="text-xs text-gray-500">Addis Ababa City Administration</p>
        </div>
        
        <div className="p-4">
          {/* Photo and Main Info */}
          <div className="flex gap-4 mb-4">
            {/* Photo Section */}
            <div className="flex-shrink-0">
              <div className="w-28 h-32 bg-gray-100 border-2 border-gray-300 rounded-lg overflow-hidden">
                {data.photo_url ? (
                  <img src={data.photo_url} alt="Photo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                    <span className="text-[10px]">Photo</span>
                  </div>
                )}
              </div>
              <p className="text-center text-[10px] text-gray-500 mt-1">ID: {data.id_number?.slice(-6) || 'XXXXXX'}</p>
            </div>
            
            {/* Personal Information */}
            <div className="flex-1 space-y-2">
              <div>
                <p className="text-[10px] text-gray-500">FULL NAME</p>
                <p className="text-sm font-semibold text-gray-800">{data.full_name || '_________________'}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">FATHER'S NAME</p>
                <p className="text-sm text-gray-700">{data.father_name || '_________________'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-gray-500">DATE OF BIRTH</p>
                  <p className="text-xs font-medium">{data.birth_date_gc || '________'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">SEX</p>
                  <p className="text-xs">{data.sex === 'Male' ? 'MALE' : 'FEMALE'}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Additional Info Grid */}
          <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
            <div>
              <p className="text-[10px] text-gray-500">NATIONALITY</p>
              <p className="text-xs font-medium">ETHIOPIAN</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">CITY OF RESIDENCE</p>
              <p className="text-xs">{data.residence || 'Addis Ababa'}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">HOUSE NUMBER</p>
              <p className="text-xs">{data.house_number || data.residence || '________'}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">PHONE NUMBER</p>
              <p className="text-xs">{data.phone || '________'}</p>
            </div>
          </div>
          
          {/* Validity Info */}
          <div className="bg-blue-50 rounded-lg p-2 mt-2">
            <div className="flex justify-between text-xs">
              <div>
                <p className="text-[9px] text-gray-500">ISSUE DATE</p>
                <p className="font-semibold text-blue-800">{data.issue_date_gc || '________'}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500">EXPIRY DATE</p>
                <p className="font-semibold text-red-600">{data.expiry_date_gc || '________'}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500">NUMBER OF ISSUE</p>
                <p className="font-semibold">{data.issue_number || '1'}</p>
              </div>
            </div>
          </div>
          
          {/* Signature and QR Code */}
          <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-200">
            <div>
              <p className="text-[8px] text-gray-400">ISSUING AUTHORITY</p>
              <p className="text-[10px] font-medium">Bossa Addis Kebele</p>
            </div>
            <div className="text-center">
              {qrValue && (
                <QRCode value={qrValue} size={50} level="H" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BACK OF ID CARD */}
      <div ref={backRef} className="bg-white rounded-xl overflow-hidden shadow-2xl border border-gray-300">
        <div className="p-4">
          <h3 className="font-bold text-gray-800 mb-3 text-center border-b pb-2">EMERGENCY CONTACT INFORMATION</h3>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-gray-500">EMERGENCY CONTACT NAME</p>
                <p className="text-sm font-medium">{data.emergency_contact_name || '_________________'}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">RELATIONSHIP</p>
                <p className="text-sm">{data.emergency_relationship || '_________________'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-gray-500">EMERGENCY PHONE</p>
                <p className="text-sm">{data.emergency_phone || '_________________'}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">ALTERNATE PHONE</p>
                <p className="text-sm">{data.emergency_alt_phone || '_________________'}</p>
              </div>
            </div>
            
            <div>
              <p className="text-[10px] text-gray-500">EMERGENCY ADDRESS</p>
              <p className="text-sm">{data.emergency_address || '_________________'}</p>
            </div>
            
            <div className="bg-red-50 rounded-lg p-2 mt-2">
              <p className="text-[10px] text-red-600 font-semibold">MEDICAL INFORMATION</p>
              <p className="text-xs">{data.medical_notes || 'No known medical conditions'}</p>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-200 text-center">
            <p className="text-[8px] text-gray-400">This card is the property of the Government of Ethiopia</p>
            <p className="text-[8px] text-gray-400">If found, please return to the nearest Kebele office</p>
          </div>
        </div>
      </div>
    </div>
  );
}
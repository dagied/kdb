'use client';
import { useRef } from 'react';

export default function BirthCertificateTemplate({ data, onLoad }) {
  const certificateRef = useRef();

  // Format Ethiopian date for display
  const formatEthiopianDate = (ecDate) => {
    if (!ecDate) return '';
    const [year, month, day] = ecDate.split('-');
    const months = ['መስከረም', 'ጥቅምት', 'ኅዳር', 'ታኅሣሥ', 'ጥር', 'የካቲት', 'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ'];
    return `${months[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
  };

  return (
    <div ref={certificateRef} className="bg-white p-8 max-w-4xl mx-auto border-2 border-gray-300" style={{ fontFamily: "'Times New Roman', serif" }}>
      {/* Ethiopian Flag Header */}
      <div className="flex justify-between items-start mb-6 border-b-2 border-gray-800 pb-4">
        <div className="flex flex-col items-center">
          <div className="w-16 h-12 flex flex-col shadow-md">
            <div className="h-1/3 bg-green-500"></div>
            <div className="h-1/3 bg-yellow-500"></div>
            <div className="h-1/3 bg-red-500"></div>
          </div>
          <p className="text-xs text-gray-600 mt-1">የኢትዮጵያ ሕወሓት</p>
        </div>
        <div className="text-center flex-1 px-4">
          <h1 className="text-xl font-bold text-gray-800">በኢትዮጵያ ፌዴራላዊ ዴሞክራሲያዊ ሪፐብሊክ</h1>
          <h2 className="text-lg font-semibold text-gray-700">Federal Democratic Republic of Ethiopia</h2>
          <h3 className="text-md font-bold text-gray-800 mt-2">የወሳኝ ኩነት ምዝገባ</h3>
          <h4 className="text-md font-semibold text-gray-700">Vital Event Registration</h4>
          <div className="border-t-2 border-gray-800 w-32 mx-auto my-2"></div>
          <h3 className="text-lg font-bold uppercase tracking-wider">የልደት ምስክር ወረቀት</h3>
          <h4 className="text-md font-semibold uppercase tracking-wider">Birth Certificate</h4>
        </div>
        <div className="w-16"></div>
      </div>

      {/* Certificate Number */}
      <div className="text-right mb-4">
        <p className="text-sm font-mono">Registration No: {data.registration_number || '__________'}</p>
      </div>

      {/* Main Content Table */}
      <table className="w-full border-collapse">
        {/* Row 1: Name */}
        <tr className="border border-gray-400">
          <td className="border border-gray-400 p-2 w-1/3 bg-gray-100 font-semibold">ስም</td>
          <td className="border border-gray-400 p-2 w-1/3 bg-gray-100 font-semibold">የአባት ስም</td>
          <td className="border border-gray-400 p-2 w-1/3 bg-gray-100 font-semibold">የአያት ስም</td>
        </tr>
        <tr className="border border-gray-400">
          <td className="border border-gray-400 p-2">{data.child_first_name || '________'}</td>
          <td className="border border-gray-400 p-2">{data.child_father_name || '________'}</td>
          <td className="border border-gray-400 p-2">{data.child_grandfather_name || '________'}</td>
        </tr>
        <tr>
          <td className="border border-gray-400 p-2 text-xs text-gray-500">Name</td>
          <td className="border border-gray-400 p-2 text-xs text-gray-500">Father's Name</td>
          <td className="border border-gray-400 p-2 text-xs text-gray-500">Grand Father's Name</td>
        </tr>

        {/* Row 2: Sex and Date of Birth */}
        <tr className="border border-gray-400">
          <td className="border border-gray-400 p-2 bg-gray-100 font-semibold">ጾታ</td>
          <td colSpan="2" className="border border-gray-400 p-2 bg-gray-100 font-semibold">የትውልድ ቀን</td>
        </tr>
        <tr className="border border-gray-400">
          <td className="border border-gray-400 p-2">{data.sex === 'Male' ? 'ወንድ' : 'ሴት'} ({data.sex})</td>
          <td colSpan="2" className="border border-gray-400 p-2">
            {data.birth_month_name_am} {parseInt(data.birth_date_ec?.split('-')[2]) || '___'}, {data.birth_year_ec || '____'} ዓ.ም / 
            {new Date(data.birth_date_gc).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} GC
          </td>
        </tr>
        <tr>
          <td className="border border-gray-400 p-2 text-xs text-gray-500">Sex</td>
          <td colSpan="2" className="border border-gray-400 p-2 text-xs text-gray-500">Date of Birth</td>
        </tr>

        {/* Row 3: Place of Birth */}
        <tr className="border border-gray-400">
          <td colSpan="3" className="border border-gray-400 p-2 bg-gray-100 font-semibold">የትውልድ ቦታ / ሀገር</td>
        </tr>
        <tr className="border border-gray-400">
          <td colSpan="3" className="border border-gray-400 p-2">
            {data.region || '_____'} ክልል / {data.zone || '_____'} ዞን / {data.woreda || '_____'} ወረዳ / {data.birth_place || '_____'}
            <br />
            <span className="text-xs text-gray-500">Region / Zone / Woreda / City</span>
          </td>
        </tr>
        <tr>
          <td colSpan="3" className="border border-gray-400 p-2 bg-gray-100 font-semibold">ዜግነት / Nationality</td>
        </tr>
        <tr className="border border-gray-400">
          <td colSpan="3" className="border border-gray-400 p-2">{data.nationality || 'ኢትዮጵያዊ / Ethiopian'}</td>
        </tr>

        {/* Row 4: Mother's Information */}
        <tr className="border border-gray-400">
          <td colSpan="2" className="border border-gray-400 p-2 bg-gray-100 font-semibold">የእናት ሙሉ ስም</td>
          <td className="border border-gray-400 p-2 bg-gray-100 font-semibold">የእናት ዜግነት</td>
        </tr>
        <tr className="border border-gray-400">
          <td colSpan="2" className="border border-gray-400 p-2">{data.mother_full_name || '________'}</td>
          <td className="border border-gray-400 p-2">{data.mother_nationality || 'Ethiopian'}</td>
        </tr>
        <tr>
          <td colSpan="2" className="border border-gray-400 p-2 text-xs text-gray-500">Mother's Full Name</td>
          <td className="border border-gray-400 p-2 text-xs text-gray-500">Mother's Nationality</td>
        </tr>

        {/* Row 5: Father's Information */}
        <tr className="border border-gray-400">
          <td colSpan="2" className="border border-gray-400 p-2 bg-gray-100 font-semibold">የአባት ሙሉ ስም</td>
          <td className="border border-gray-400 p-2 bg-gray-100 font-semibold">የአባት ዜግነት</td>
        </tr>
        <tr className="border border-gray-400">
          <td colSpan="2" className="border border-gray-400 p-2">{data.father_full_name || '________'}</td>
          <td className="border border-gray-400 p-2">{data.father_nationality || 'Ethiopian'}</td>
        </tr>
        <tr>
          <td colSpan="2" className="border border-gray-400 p-2 text-xs text-gray-500">Father's Full Name</td>
          <td className="border border-gray-400 p-2 text-xs text-gray-500">Father's Nationality</td>
        </tr>

        {/* Row 6: Registration Date */}
        <tr className="border border-gray-400">
          <td colSpan="3" className="border border-gray-400 p-2 bg-gray-100 font-semibold">ልጁ የተመዘገበበት ቀን / Date of Birth Registration</td>
        </tr>
        <tr className="border border-gray-400">
          <td colSpan="3" className="border border-gray-400 p-2 text-center">
            {data.registration_month_name_am || '________'} {parseInt(data.registration_date_ec?.split('-')[2]) || '____'}, {data.registration_date_ec?.split('-')[0] || '____'} ዓ.ም / 
            {new Date(data.registration_date_gc).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} GC
          </td>
        </tr>

        {/* Row 7: Registrar */}
        <tr className="border border-gray-400">
          <td colSpan="3" className="border border-gray-400 p-2 bg-gray-100 font-semibold">የሚዘግብ ሰው ስም / Name of Civil Registrar</td>
        </tr>
        <tr className="border border-gray-400">
          <td colSpan="3" className="border border-gray-400 p-2 text-center">
            {data.registrar_name || '________'} / {data.registrar_name_am || '________'}
          </td>
        </tr>

        {/* Footer with Signature and Seal */}
        <tr className="border border-gray-400">
          <td className="border border-gray-400 p-4 text-center">
            <div className="h-12 border-b-2 border-gray-800 w-3/4 mx-auto mb-1"></div>
            <p className="text-xs text-gray-600">ፊርማ / Signature</p>
          </td>
          <td colSpan="2" className="border border-gray-400 p-4 text-center">
            <div className="flex justify-center items-center h-12">
              <div className="w-16 h-16 border-2 border-gray-800 rounded-full flex items-center justify-center">
                <span className="text-xs text-gray-500">[ማሕተም]</span>
              </div>
            </div>
            <p className="text-xs text-gray-600">ማሕተም / Seal</p>
          </td>
        </tr>
      </table>

      {/* Footer */}
      <div className="mt-6 text-center text-xs text-gray-500 border-t border-gray-300 pt-4">
        <p>This is a computer generated certificate and does not require a signature</p>
        <p>ይህ በኮምፒውተር የወጣ ሰርትፊኬት ነው እንዲሁም ፊርማ አያስፈልገውም</p>
      </div>
    </div>
  );
}
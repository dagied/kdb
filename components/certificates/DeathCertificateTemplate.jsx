'use client';
import { useRef, useEffect } from 'react';

export default function DeathCertificateTemplate({ data, onLoad }) {
  const componentRef = useRef();

  useEffect(() => {
    if (onLoad && componentRef.current) {
      onLoad(componentRef.current);
    }
  }, [onLoad]);

  return (
    <div ref={componentRef} className="bg-white p-8 max-w-4xl mx-auto border-2 border-gray-300" style={{ fontFamily: "'Times New Roman', serif" }}>
      {/* Header with Flag */}
      <div className="flex justify-between items-start mb-6 border-b-2 border-gray-800 pb-4">
        <div className="flex flex-col items-center">
          <div className="w-16 h-12 flex flex-col shadow-md">
            <div className="h-1/3 bg-green-500"></div>
            <div className="h-1/3 bg-yellow-500"></div>
            <div className="h-1/3 bg-red-500"></div>
          </div>
        </div>
        <div className="text-center flex-1 px-4">
          <h1 className="text-xl font-bold text-gray-800">በኢትዮጵያ ፌዴራላዊ ዴሞክራሲያዊ ሪፐብሊክ</h1>
          <h2 className="text-lg font-semibold text-gray-700">Federal Democratic Republic of Ethiopia</h2>
          <h3 className="text-md font-bold text-gray-800 mt-2">የሞት ምስክር ወረቀት</h3>
          <h4 className="text-md font-semibold uppercase tracking-wider">Death Certificate</h4>
        </div>
        <div className="w-16"></>
      </div>

      <div className="text-right mb-4">
        <p className="text-sm font-mono">Registration No: {data.registration_number || '__________'}</p>
      </div>

      <table className="w-full border-collapse">
        <tbody>
          <tr className="border border-gray-400">
            <td className="border border-gray-400 p-2 bg-gray-100 font-semibold">ስም ሙታን</td>
            <td colSpan="2" className="border border-gray-400 p-2">{data.deceased_name || '________'}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-xs text-gray-500">Deceased Name</td>
            <td colSpan="2" className="border border-gray-400 p-2 text-xs text-gray-500"></td>
          </tr>

          <tr className="border border-gray-400">
            <td className="border border-gray-400 p-2 bg-gray-100 font-semibold">የአባት ስም</td>
            <td colSpan="2" className="border border-gray-400 p-2">{data.deceased_father_name || '________'}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-xs text-gray-500">Father's Name</td>
            <td colSpan="2"></td>
          </tr>

          <tr className="border border-gray-400">
            <td className="border border-gray-400 p-2 bg-gray-100 font-semibold">የሞት ቀን</td>
            <td className="border border-gray-400 p-2">{data.death_date_ec || '________'} ዓ.ም</td>
            <td className="border border-gray-400 p-2">{data.death_date_gc ? new Date(data.death_date_gc).toLocaleDateString() : '________'} GC</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-xs text-gray-500">Date of Death</td>
            <td colSpan="2" className="border border-gray-400 p-2 text-xs text-gray-500">Ethiopian Calendar / Gregorian Calendar</td>
          </tr>

          <tr className="border border-gray-400">
            <td className="border border-gray-400 p-2 bg-gray-100 font-semibold">የሞት ቦታ</td>
            <td colSpan="2" className="border border-gray-400 p-2">{data.place_of_death || '________'}</td>
          </tr>

          <tr className="border border-gray-400">
            <td className="border border-gray-400 p-2 bg-gray-100 font-semibold">የሞት መንስኤ</td>
            <td colSpan="2" className="border border-gray-400 p-2">{data.cause_of_death || '________'}</td>
          </tr>

          <tr className="border border-gray-400">
            <td className="border border-gray-400 p-2 bg-gray-100 font-semibold">አስረጋጋጭ ስም</td>
            <td colSpan="2" className="border border-gray-400 p-2">{data.reporter_name || '________'}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-xs text-gray-500">Reporter Name</td>
            <td colSpan="2"></td>
          </tr>

          <tr className="border border-gray-400">
            <td className="border border-gray-400 p-2 bg-gray-100 font-semibold">ዝምድና</td>
            <td colSpan="2" className="border border-gray-400 p-2">{data.reporter_relation || '________'}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-xs text-gray-500">Relation</td>
            <td colSpan="2"></td>
          </tr>

          <tr className="border border-gray-400">
            <td colSpan="3" className="border border-gray-400 p-2 bg-gray-100 font-semibold text-center">የምዝገባ መረጃ / Registration Information</td>
          </tr>
          <tr className="border border-gray-400">
            <td className="border border-gray-400 p-2 bg-gray-100 font-semibold">የተመዘገበበት ቀን</td>
            <td colSpan="2" className="border border-gray-400 p-2">{data.registration_date_ec || '________'} ዓ.ም / {data.registration_date_gc || '________'} GC</td>
          </tr>
          <tr className="border border-gray-400">
            <td className="border border-gray-400 p-2 bg-gray-100 font-semibold">የሚዘግብ ሰው ስም</td>
            <td colSpan="2" className="border border-gray-400 p-2">{data.registrar_name || '________'}</td>
          </tr>

          <tr className="border border-gray-400">
            <td className="border border-gray-400 p-4 text-center">
              <div className="h-12 border-b-2 border-gray-800 w-3/4 mx-auto mb-1"></div>
              <p className="text-xs text-gray-600">ፊርማ / Signature</p>
            </td>
            <td colSpan="2" className="border border-gray-400 p-4 text-center">
              <div className="w-16 h-16 border-2 border-gray-800 rounded-full mx-auto mb-1 flex items-center justify-center">
                <span className="text-xs text-gray-500">[ማሕተም]</span>
              </div>
              <p className="text-xs text-gray-600">ማሕተም / Seal</p>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="mt-6 text-center text-xs text-gray-500 border-t border-gray-300 pt-4">
        <p>This is a computer generated certificate and does not require a signature</p>
        <p>ይህ በኮምፒውተር የወጣ ሰርትፊኬት ነው እንዲሁም ፊርማ አያስፈልገውም</p>
      </div>
    </div>
  );
}
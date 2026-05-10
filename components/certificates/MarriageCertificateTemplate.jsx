'use client';
import { useRef, useEffect } from 'react';

export default function MarriageCertificateTemplate({ data, onLoad }) {
  const componentRef = useRef();

  useEffect(() => {
    if (onLoad && componentRef.current) {
      onLoad(componentRef.current);
    }
  }, [onLoad]);

  return (
    <div ref={componentRef} className="bg-white p-8 max-w-4xl mx-auto border-2 border-gray-300" style={{ fontFamily: "'Times New Roman', serif" }}>
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
          <h3 className="text-md font-bold text-gray-800 mt-2">የጋብቻ ምስክር ወረቀት</h3>
          <h4 className="text-md font-semibold uppercase tracking-wider">Marriage Certificate</h4>
        </div>
        <div className="w-16"></div>
      </div>

      <div className="text-right mb-4">
        <p className="text-sm font-mono">Registration No: {data.registration_number || '__________'}</p>
      </div>

      <table className="w-full border-collapse">
        <tbody>
          <tr className="border border-gray-400">
            <td className="border border-gray-400 p-2 bg-gray-100 font-semibold w-1/3">የባል ስም</td>
            <td className="border border-gray-400 p-2">{data.husband_name || '________'}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-xs text-gray-500">Husband's Name</td>
            <td></td>
          </tr>

          <tr className="border border-gray-400">
            <td className="border border-gray-400 p-2 bg-gray-100 font-semibold">የሚስት ስም</td>
            <td className="border border-gray-400 p-2">{data.wife_name || '________'}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-xs text-gray-500">Wife's Name</td>
            <td></td>
          </tr>

          <tr className="border border-gray-400">
            <td className="border border-gray-400 p-2 bg-gray-100 font-semibold">የጋብቻ ቀን</td>
            <td className="border border-gray-400 p-2">{data.marriage_date_ec || '________'} ዓ.ም / {data.marriage_date_gc ? new Date(data.marriage_date_gc).toLocaleDateString() : '________'} GC</td>
          </tr>

          <tr className="border border-gray-400">
            <td className="border border-gray-400 p-2 bg-gray-100 font-semibold">የሥርዓተ ጋብቻ ቦታ</td>
            <td className="border border-gray-400 p-2">{data.ceremony_place || '________'}</td>
          </tr>

          <tr className="border border-gray-400">
            <td className="border border-gray-400 p-2 bg-gray-100 font-semibold">የጋብቻ አይነት</td>
            <td className="border border-gray-400 p-2">{data.ceremony_type || '________'}</td>
          </tr>

          <tr className="border border-gray-400">
            <td className="border border-gray-400 p-2 bg-gray-100 font-semibold">ምስክሮች</td>
            <td className="border border-gray-400 p-2">1. {data.witness1_name || '________'}<br />2. {data.witness2_name || '________'}</td>
          </tr>

          <tr className="border border-gray-400">
            <td colSpan="2" className="border border-gray-400 p-2 bg-gray-100 font-semibold text-center">የምዝገባ መረጃ / Registration Information</td>
          </tr>
          <tr className="border border-gray-400">
            <td className="border border-gray-400 p-2 bg-gray-100 font-semibold">የተመዘገበበት ቀን</td>
            <td className="border border-gray-400 p-2">{data.registration_date_ec || '________'} ዓ.ም / {data.registration_date_gc || '________'} GC</td>
          </tr>
          <tr className="border border-gray-400">
            <td className="border border-gray-400 p-2 bg-gray-100 font-semibold">የሚዘግብ ሰው ስም</td>
            <td className="border border-gray-400 p-2">{data.registrar_name || '________'}</td>
          </tr>

          <tr className="border border-gray-400">
            <td className="border border-gray-400 p-4 text-center">
              <div className="h-12 border-b-2 border-gray-800 w-3/4 mx-auto mb-1"></div>
              <p className="text-xs text-gray-600">ፊርማ / Signature</p>
            </td>
            <td className="border border-gray-400 p-4 text-center">
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
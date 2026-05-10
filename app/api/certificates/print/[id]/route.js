// app/api/certificates/print/[id]/route.js
import { NextResponse } from 'next/server';
import { getClient } from '@/_lib/db';
import { getSession } from '@/_lib/auth';
import QRCode from 'qrcode';

export async function GET(request, { params }) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'birth';
  
  console.log(`🔍 Printing: type=${type}, id=${id}`);
  
  const client = await getClient();
  
  try {
    let certificate;
    let htmlTemplate;
    
    if (type === 'birth') {
      const result = await client.query(
        `SELECT * FROM birth_certificate WHERE birth_id = $1`,
        [id]
      );
      certificate = result.rows[0];
      if (certificate) {
        htmlTemplate = generateBirthCertificateHTML(certificate);
      }
    } else if (type === 'death') {
      const result = await client.query(
        `SELECT * FROM death_certificate WHERE death_id = $1`,
        [id]
      );
      certificate = result.rows[0];
      console.log('Death certificate found:', certificate);
      if (certificate) {
        htmlTemplate = generateDeathCertificateHTML(certificate);
      }
    } else if (type === 'marriage') {
      const result = await client.query(
        `SELECT * FROM marriage_certificate WHERE marriage_id = $1`,
        [id]
      );
      certificate = result.rows[0];
      console.log('Marriage certificate found:', certificate);
      if (certificate) {
        htmlTemplate = generateMarriageCertificateHTML(certificate);
      }
    } else if (type === 'id-card') {
      const result = await client.query(
        `SELECT * FROM id_card WHERE id_card_id = $1`,
        [id]
      );
      certificate = result.rows[0];
      console.log('ID Card data:', certificate);
      if (certificate) {
        const qrData = JSON.stringify({
          id: certificate.id_number,
          name: certificate.full_name,
          father: certificate.father_name,
          birth: certificate.birth_date_gc,
          issue: certificate.issue_date_gc,
          expiry: certificate.expiry_date_gc,
          phone: certificate.phone,
          address: certificate.residence
        });
        
        const qrCodeDataURL = await QRCode.toDataURL(qrData, {
          width: 150,
          margin: 1,
          color: { dark: '#000000', light: '#FFFFFF' }
        });
        
        htmlTemplate = generateIDCardHTML(certificate, qrCodeDataURL);
      }
    }
    
    if (!certificate) {
      console.log(`Certificate not found: type=${type}, id=${id}`);
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }
    
    return new NextResponse(htmlTemplate, {
      headers: { 'Content-Type': 'text/html' },
    });
    
  } catch (error) {
    console.error('Error generating certificate:', error);
    return NextResponse.json({ error: 'Failed to generate certificate: ' + error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

// ==================== BIRTH CERTIFICATE ====================
function generateBirthCertificateHTML(data) {
  const birthDateGC = data.birth_date_gc ? new Date(data.birth_date_gc).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  }) : '_________';
  
  const registrationDate = data.created_at ? new Date(data.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  }) : '_________';
  
  const ethiopianBirthDate = data.birth_date_ec || '_________';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Birth Certificate - ${data.child_name || 'Certificate'}</title>
      <style>
        @media print {
          body { background: white; margin: 0; padding: 0; }
          .no-print { display: none; }
          .certificate-container { box-shadow: none; margin: 0; padding: 20px; }
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Times New Roman', 'Georgia', 'Arial', serif;
          background: #e8f0f8;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 30px;
        }
        .certificate-container {
          max-width: 900px;
          width: 100%;
          margin: 0 auto;
          background: white;
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          border-radius: 12px;
          overflow: hidden;
        }
        .header-section {
          background: linear-gradient(135deg, #1a3a5c 0%, #0f2b44 100%);
          padding: 20px 30px;
        }
        .flags-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        .flag { width: 80px; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); border: 2px solid #ffd700; }
        .title-section { text-align: center; color: white; }
        .title-section h1 { font-size: 24px; margin-bottom: 8px; letter-spacing: 1px; }
        .title-section h2 { font-size: 20px; margin-bottom: 5px; }
        .title-section h3 { font-size: 16px; opacity: 0.9; }
        .subtitle { font-size: 11px; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.3); }
        .certificate-body { padding: 40px; background: white; }
        .gold-border { 
          border: 2px solid #c8a24c; 
          padding: 20px; 
          position: relative; 
          margin-bottom: 20px;
          background: #fffef8;
        }
        .gold-border::before { content: "✨"; position: absolute; top: -12px; left: -12px; font-size: 20px; color: #c8a24c; }
        .gold-border::after { content: "✨"; position: absolute; bottom: -12px; right: -12px; font-size: 20px; color: #c8a24c; transform: rotate(180deg); }
        .seal { width: 90px; height: 90px; border: 3px solid #c8a24c; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; background: #fef8e7; }
        .seal span { font-size: 10px; text-align: center; color: #c8a24c; font-weight: bold; }
        .certificate-text { text-align: center; margin: 20px 0; }
        .certificate-title { font-size: 26px; font-weight: bold; color: #1a3a5c; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 2px; }
        .certificate-title-am { font-size: 22px; font-family: 'Noto Sans Ethiopic', 'Nyala', 'Abyssinica SIL', sans-serif; color: #1a3a5c; margin-bottom: 15px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0; }
        .info-card { background: #f8f9fa; padding: 12px; border-radius: 8px; border-left: 4px solid #c8a24c; }
        .full-width { grid-column: span 2; }
        .info-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #6c757d; font-weight: 600; margin-bottom: 4px; }
        .info-label-am { font-family: 'Noto Sans Ethiopic', sans-serif; font-size: 10px; color: #6c757d; margin-bottom: 4px; }
        .info-value { font-size: 14px; font-weight: 600; color: #1a3a5c; margin-top: 4px; }
        .info-value-am { font-family: 'Noto Sans Ethiopic', sans-serif; font-size: 13px; color: #1a3a5c; margin-top: 2px; }
        .signature-section { display: flex; justify-content: space-between; margin-top: 35px; padding-top: 25px; border-top: 1px dashed #dee2e6; }
        .signature-box { text-align: center; width: 200px; }
        .signature-line { width: 100%; height: 1px; background: #1a3a5c; margin: 25px 0 8px; }
        .signature-label { font-size: 10px; color: #6c757d; }
        .footer { background: #f8f9fa; padding: 12px 25px; text-align: center; font-size: 9px; color: #6c757d; border-top: 1px solid #e9ecef; }
        .reg-number { text-align: center; margin: 15px 0; padding: 8px; background: #fef8e7; border-radius: 8px; font-family: monospace; font-size: 13px; border: 1px solid #c8a24c; }
        .print-btn { display: flex; justify-content: center; gap: 15px; margin: 20px auto; }
        .print-btn button { padding: 10px 25px; font-size: 14px; cursor: pointer; background: #1a3a5c; color: white; border: none; border-radius: 8px; transition: all 0.3s; }
        .print-btn button:hover { background: #0f2b44; transform: translateY(-2px); }
        @media (max-width: 768px) { .info-grid { grid-template-columns: 1fr; } .full-width { grid-column: span 1; } .flags-container { flex-direction: column; gap: 10px; } .flag { width: 60px; } }
      </style>
    </head>
    <body>
      <div class="certificate-container">
        <div class="header-section">
          <div class="flags-container">
            <img src="/et.png" alt="Ethiopian Flag" class="flag" />
            <div class="title-section">
              <h1>FEDERAL DEMOCRATIC REPUBLIC OF ETHIOPIA</h1>
              <h2>የኢትዮጵያ ፌዴራላዊ ዴሞክራሲያዊ ሪፐብሊክ</h2>
              <h3>BOSSA ADDIS KEBELE ADMINISTRATION</h3>
              <div class="subtitle">ቦሳ አዲስ ቀበሌ አስተዳደር</div>
            </div>
            <img src="/or.png" alt="Oromia Flag" class="flag" />
          </div>
        </div>
        
        <div class="certificate-body">
          <div class="seal">
            <span>ሕዝብና ህይወት ከማኅተም በላይ<br/>The People and Life Above Seal</span>
          </div>
          
          <div class="certificate-text">
            <div class="certificate-title">BIRTH CERTIFICATE</div>
            <div class="certificate-title-am">የልደት ማስረጃ ወረቀት</div>
          </div>
          
          <div class="reg-number">
            <strong>Registration No / የምዝገባ ቁጥር:</strong> ${data.registration_number || '_________'}
          </div>
          
          <div class="gold-border">
            <div class="info-grid">
              <div class="info-card full-width">
                <div class="info-label">CHILD'S FULL NAME</div>
                <div class="info-label-am">የህጻኑ ሙሉ ስም</div>
                <div class="info-value">${data.child_name || '_________'}</div>
                ${data.child_name_am ? `<div class="info-value-am">${data.child_name_am}</div>` : ''}
              </div>
              
              <div class="info-card">
                <div class="info-label">FATHER'S NAME</div>
                <div class="info-label-am">የአባት ስም</div>
                <div class="info-value">${data.father_name || '_________'}</div>
                ${data.father_name_am ? `<div class="info-value-am">${data.father_name_am}</div>` : ''}
              </div>
              
              <div class="info-card">
                <div class="info-label">MOTHER'S NAME</div>
                <div class="info-label-am">የእናት ስም</div>
                <div class="info-value">${data.mother_name || '_________'}</div>
                ${data.mother_name_am ? `<div class="info-value-am">${data.mother_name_am}</div>` : ''}
              </div>
              
              <div class="info-card">
                <div class="info-label">GENDER / SEX</div>
                <div class="info-label-am">ጾታ</div>
                <div class="info-value">${data.sex === 'Male' ? 'Male / ወንድ' : data.sex === 'Female' ? 'Female / ሴት' : '_________'}</div>
              </div>
              
              <div class="info-card">
                <div class="info-label">DATE OF BIRTH (GC)</div>
                <div class="info-label-am">የልደት ቀን (ግሪጎሪያን)</div>
                <div class="info-value">${birthDateGC}</div>
              </div>
              
              <div class="info-card">
                <div class="info-label">DATE OF BIRTH (EC)</div>
                <div class="info-label-am">የልደት ቀን (ኢትዮጵያ)</div>
                <div class="info-value">${ethiopianBirthDate}</div>
              </div>
              
              <div class="info-card full-width">
                <div class="info-label">PLACE OF BIRTH</div>
                <div class="info-label-am">የትውልድ ቦታ</div>
                <div class="info-value">${data.place_of_birth || '_________'}</div>
                ${data.place_of_birth_am ? `<div class="info-value-am">${data.place_of_birth_am}</div>` : ''}
              </div>
            </div>
          </div>
          
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">REGISTRAR'S SIGNATURE & STAMP</div>
              <div class="signature-label">የመዝጋቢ ፊርማ እና ማህተም</div>
              <div class="info-value" style="margin-top: 8px;">${data.registrar_name || '_________________'}</div>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">KEBELE ADMINISTRATOR'S SIGNATURE</div>
              <div class="signature-label">የቀበሌ አስተዳዳሪ ፊርማ</div>
            </div>
          </div>
          
          <div class="footer">
            <p>This certificate is computer generated and is valid for legal purposes</p>
            <p>ይህ ሰርትፊኬት በኮምፒውተር የወጣ እና ለህጋዊ ጉዳይ የሚሠራ ነው</p>
            <p>Issued on: ${registrationDate}</p>
          </div>
        </div>
      </div>
      <div class="print-btn no-print">
        <button onclick="window.print()">🖨️ PRINT CERTIFICATE</button>
        <button onclick="window.close()">❌ CLOSE</button>
      </div>
    </body>
    </html>
  `;
}

// ==================== DEATH CERTIFICATE ====================
function generateDeathCertificateHTML(data) {
  const deathDateGC = data.death_date_gc ? new Date(data.death_date_gc).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  }) : '_________';
  
  const registrationDate = data.created_at ? new Date(data.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  }) : '_________';
  
  const ethiopianDeathDate = data.death_date_ec || '_________';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Death Certificate</title>
      <style>
        @media print { 
          body { background: white; margin: 0; padding: 0; } 
          .no-print { display: none; } 
          .certificate-container { box-shadow: none; }
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Times New Roman', 'Georgia', serif; 
          background: #1a1a2e; 
          display: flex; 
          justify-content: center; 
          align-items: center; 
          min-height: 100vh; 
          padding: 30px; 
        }
        .certificate-container { 
          max-width: 900px; 
          width: 100%; 
          background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
          box-shadow: 0 20px 40px rgba(0,0,0,0.3); 
          border-radius: 12px; 
          overflow: hidden; 
        }
        .header-section { 
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          padding: 20px 30px; 
        }
        .flags-container { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 15px; 
        }
        .flag { width: 80px; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); border: 2px solid #ffd700; }
        .title-section { text-align: center; color: white; }
        .title-section h1 { font-size: 24px; margin-bottom: 8px; }
        .title-section h2 { font-size: 20px; }
        .title-section h3 { font-size: 16px; opacity: 0.9; }
        .subtitle { font-size: 11px; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.3); }
        .certificate-body { padding: 40px; background: #f8f9fa; }
        .dark-border { 
          border: 2px solid #8B0000; 
          padding: 20px; 
          position: relative; 
          margin-bottom: 20px;
          background: white;
        }
        .dark-border::before { content: "✝"; position: absolute; top: -12px; left: -12px; font-size: 20px; color: #8B0000; }
        .dark-border::after { content: "✝"; position: absolute; bottom: -12px; right: -12px; font-size: 20px; color: #8B0000; transform: rotate(180deg); }
        .seal { width: 90px; height: 90px; border: 3px solid #8B0000; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; background: #fff8e7; }
        .seal span { font-size: 10px; text-align: center; color: #8B0000; font-weight: bold; }
        .certificate-title { font-size: 26px; font-weight: bold; color: #1a1a2e; text-align: center; margin-bottom: 8px; text-transform: uppercase; }
        .certificate-title-am { font-size: 22px; font-family: 'Noto Sans Ethiopic', sans-serif; text-align: center; color: #1a1a2e; margin-bottom: 15px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0; }
        .info-card { background: white; padding: 12px; border-radius: 8px; border-left: 4px solid #8B0000; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .full-width { grid-column: span 2; }
        .info-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #6c757d; font-weight: 600; margin-bottom: 4px; }
        .info-label-am { font-family: 'Noto Sans Ethiopic', sans-serif; font-size: 10px; color: #6c757d; margin-bottom: 4px; }
        .info-value { font-size: 14px; font-weight: 600; color: #1a1a2e; margin-top: 4px; }
        .info-value-am { font-family: 'Noto Sans Ethiopic', sans-serif; font-size: 13px; color: #1a1a2e; margin-top: 2px; }
        .signature-section { display: flex; justify-content: space-between; margin-top: 35px; padding-top: 25px; border-top: 1px dashed #dee2e6; }
        .signature-box { text-align: center; width: 200px; }
        .signature-line { width: 100%; height: 1px; background: #1a1a2e; margin: 25px 0 8px; }
        .footer { background: #e9ecef; padding: 12px 25px; text-align: center; font-size: 9px; color: #6c757d; border-top: 1px solid #dee2e6; }
        .reg-number { text-align: center; margin: 15px 0; padding: 8px; background: #fef8e7; border-radius: 8px; font-family: monospace; font-size: 13px; border: 1px solid #8B0000; }
        .print-btn { display: flex; justify-content: center; gap: 15px; margin: 20px auto; }
        .print-btn button { padding: 10px 25px; font-size: 14px; cursor: pointer; background: #1a1a2e; color: white; border: none; border-radius: 8px; }
        @media (max-width: 768px) { .info-grid { grid-template-columns: 1fr; } .full-width { grid-column: span 1; } .flags-container { flex-direction: column; gap: 10px; } .flag { width: 60px; } }
      </style>
    </head>
    <body>
      <div class="certificate-container">
        <div class="header-section">
          <div class="flags-container">
            <img src="/et.png" alt="Ethiopian Flag" class="flag" />
            <div class="title-section">
              <h1>FEDERAL DEMOCRATIC REPUBLIC OF ETHIOPIA</h1>
              <h2>የኢትዮጵያ ፌዴራላዊ ዴሞክራሲያዊ ሪፐብሊክ</h2>
              <h3>BOSSA ADDIS KEBELE ADMINISTRATION</h3>
              <div class="subtitle">ቦሳ አዲስ ቀበሌ አስተዳደር</div>
            </div>
            <img src="/or.png" alt="Oromia Flag" class="flag" />
          </div>
        </div>
        
        <div class="certificate-body">
          <div class="seal"><span>R.I.P.<br/>ዘላለማዊ<br/>እረፍት</span></div>
          <div class="certificate-title">DEATH CERTIFICATE</div>
          <div class="certificate-title-am">የሞት ማስረጃ ወረቀት</div>
          
          <div class="reg-number"><strong>Registration No / የምዝገባ ቁጥር:</strong> ${data.registration_number || '_________'}</div>
          
          <div class="dark-border">
            <div class="info-grid">
              <div class="info-card full-width">
                <div class="info-label">DECEASED'S FULL NAME</div>
                <div class="info-label-am">የሟች ሙሉ ስም</div>
                <div class="info-value">${data.deceased_name || '_________'}</div>
                ${data.deceased_name_am ? `<div class="info-value-am">${data.deceased_name_am}</div>` : ''}
              </div>
              
              <div class="info-card">
                <div class="info-label">FATHER'S NAME</div>
                <div class="info-label-am">የአባት ስም</div>
                <div class="info-value">${data.deceased_father_name || '_________'}</div>
                ${data.deceased_father_name_am ? `<div class="info-value-am">${data.deceased_father_name_am}</div>` : ''}
              </div>
              
              <div class="info-card">
                <div class="info-label">DATE OF DEATH (GC)</div>
                <div class="info-label-am">የሞት ቀን (ግሪጎሪያን)</div>
                <div class="info-value">${deathDateGC}</div>
              </div>
              
              <div class="info-card">
                <div class="info-label">DATE OF DEATH (EC)</div>
                <div class="info-label-am">የሞት ቀን (ኢትዮጵያ)</div>
                <div class="info-value">${ethiopianDeathDate}</div>
              </div>
              
              <div class="info-card full-width">
                <div class="info-label">PLACE OF DEATH</div>
                <div class="info-label-am">የሞት ቦታ</div>
                <div class="info-value">${data.place_of_death || '_________'}</div>
                ${data.place_of_death_am ? `<div class="info-value-am">${data.place_of_death_am}</div>` : ''}
              </div>
              
              <div class="info-card full-width">
                <div class="info-label">CAUSE OF DEATH</div>
                <div class="info-label-am">የሞት መንስኤ</div>
                <div class="info-value">${data.cause_of_death || '_________'}</div>
                ${data.cause_of_death_am ? `<div class="info-value-am">${data.cause_of_death_am}</div>` : ''}
              </div>
            </div>
          </div>
          
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">REGISTRAR'S SIGNATURE & STAMP</div>
              <div class="signature-label">የመዝጋቢ ፊርማ እና ማህተም</div>
              <div class="info-value" style="margin-top: 8px;">${data.registrar_name || '_________________'}</div>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">KEBELE ADMINISTRATOR'S SIGNATURE</div>
              <div class="signature-label">የቀበሌ አስተዳዳሪ ፊርማ</div>
            </div>
          </div>
          
          <div class="footer">
            <p>This certificate is computer generated and is valid for legal purposes</p>
            <p>ይህ ሰርትፊኬት በኮምፒውተር የወጣ እና ለህጋዊ ጉዳይ የሚሠራ ነው</p>
            <p>Issued on: ${registrationDate} | Certificate ID: ${data.death_id}</p>
          </div>
        </div>
      </div>
      <div class="print-btn no-print"><button onclick="window.print()">🖨️ PRINT CERTIFICATE</button><button onclick="window.close()">❌ CLOSE</button></div>
    </body>
    </html>
  `;
}

// ==================== MARRIAGE CERTIFICATE ====================
function generateMarriageCertificateHTML(data) {
  const marriageDateGC = data.marriage_date_gc ? new Date(data.marriage_date_gc).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  }) : '_________';
  
  const registrationDate = data.created_at ? new Date(data.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  }) : '_________';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Marriage Certificate - ${data.husband_name || 'Certificate'}</title>
      <style>
        @media print { body { background: white; margin: 0; padding: 0; } .no-print { display: none; } }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Times New Roman', 'Georgia', serif; background: #fdf6e3; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 30px; }
        .certificate-container { max-width: 900px; width: 100%; background: white; box-shadow: 0 20px 40px rgba(0,0,0,0.15); border-radius: 12px; overflow: hidden; }
        .header-section { background: linear-gradient(135deg, #8B0000 0%, #c8a24c 100%); padding: 20px 30px; }
        .flags-container { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .flag { width: 80px; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); border: 2px solid #ffd700; }
        .title-section { text-align: center; color: white; }
        .title-section h1 { font-size: 24px; margin-bottom: 8px; }
        .title-section h2 { font-size: 20px; }
        .title-section h3 { font-size: 16px; opacity: 0.9; }
        .subtitle { font-size: 11px; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.3); }
        .certificate-body { padding: 40px; background: white; }
        .heart-border { border: 2px solid #c8a24c; padding: 20px; position: relative; margin-bottom: 20px; background: #fffef8; }
        .heart-border::before { content: "❤"; position: absolute; top: -12px; left: -12px; font-size: 20px; color: #c8a24c; }
        .heart-border::after { content: "❤"; position: absolute; bottom: -12px; right: -12px; font-size: 20px; color: #c8a24c; transform: rotate(180deg); }
        .seal { width: 90px; height: 90px; border: 3px solid #c8a24c; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; background: #fef8e7; }
        .seal span { font-size: 10px; text-align: center; color: #c8a24c; font-weight: bold; }
        .certificate-title { font-size: 26px; font-weight: bold; color: #8B0000; text-align: center; margin-bottom: 8px; text-transform: uppercase; }
        .certificate-title-am { font-size: 22px; font-family: 'Noto Sans Ethiopic', sans-serif; text-align: center; color: #8B0000; margin-bottom: 15px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0; }
        .info-card { background: #fff8f0; padding: 12px; border-radius: 8px; border-left: 4px solid #c8a24c; }
        .full-width { grid-column: span 2; }
        .info-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #6c757d; font-weight: 600; margin-bottom: 4px; }
        .info-label-am { font-family: 'Noto Sans Ethiopic', sans-serif; font-size: 10px; color: #6c757d; margin-bottom: 4px; }
        .info-value { font-size: 14px; font-weight: 600; color: #8B0000; margin-top: 4px; }
        .info-value-am { font-family: 'Noto Sans Ethiopic', sans-serif; font-size: 13px; color: #8B0000; margin-top: 2px; }
        .signature-section { display: flex; justify-content: space-between; margin-top: 35px; padding-top: 25px; border-top: 1px dashed #dee2e6; }
        .signature-box { text-align: center; width: 200px; }
        .signature-line { width: 100%; height: 1px; background: #8B0000; margin: 25px 0 8px; }
        .footer { background: #f8f9fa; padding: 12px 25px; text-align: center; font-size: 9px; color: #6c757d; border-top: 1px solid #e9ecef; }
        .reg-number { text-align: center; margin: 15px 0; padding: 8px; background: #fef8e7; border-radius: 8px; font-family: monospace; font-size: 13px; border: 1px solid #c8a24c; }
        .print-btn { display: flex; justify-content: center; gap: 15px; margin: 20px auto; }
        .print-btn button { padding: 10px 25px; font-size: 14px; cursor: pointer; background: #8B0000; color: white; border: none; border-radius: 8px; }
        @media (max-width: 768px) { .info-grid { grid-template-columns: 1fr; } .full-width { grid-column: span 1; } .flags-container { flex-direction: column; gap: 10px; } .flag { width: 60px; } }
      </style>
    </head>
    <body>
      <div class="certificate-container">
        <div class="header-section">
          <div class="flags-container">
            <img src="/et.png" alt="Ethiopian Flag" class="flag" />
            <div class="title-section">
              <h1>FEDERAL DEMOCRATIC REPUBLIC OF ETHIOPIA</h1>
              <h2>የኢትዮጵያ ፌዴራላዊ ዴሞክራሲያዊ ሪፐብሊክ</h2>
              <h3>BOSSA ADDIS KEBELE ADMINISTRATION</h3>
              <div class="subtitle">ቦሳ አዲስ ቀበሌ አስተዳደር</div>
            </div>
            <img src="/or.png" alt="Oromia Flag" class="flag" />
          </div>
        </div>
        
        <div class="certificate-body">
          <div class="seal"><span>❤️</span></div>
          <div class="certificate-title">MARRIAGE CERTIFICATE</div>
          <div class="certificate-title-am">የጋብቻ ማስረጃ ወረቀት</div>
          
          <div class="reg-number"><strong>Registration No / የምዝገባ ቁጥር:</strong> ${data.registration_number || '_________'}</div>
          
          <div class="heart-border">
            <div class="info-grid">
              <div class="info-card">
                <div class="info-label">HUSBAND'S FULL NAME</div>
                <div class="info-label-am">የባል ሙሉ ስም</div>
                <div class="info-value">${data.husband_name || '_________'}</div>
                ${data.husband_name_am ? `<div class="info-value-am">${data.husband_name_am}</div>` : ''}
              </div>
              
              <div class="info-card">
                <div class="info-label">WIFE'S FULL NAME</div>
                <div class="info-label-am">የሚስት ሙሉ ስም</div>
                <div class="info-value">${data.wife_name || '_________'}</div>
                ${data.wife_name_am ? `<div class="info-value-am">${data.wife_name_am}</div>` : ''}
              </div>
              
              <div class="info-card">
                <div class="info-label">MARRIAGE DATE (GC)</div>
                <div class="info-label-am">የጋብቻ ቀን (ግሪጎሪያን)</div>
                <div class="info-value">${marriageDateGC}</div>
              </div>
              
              <div class="info-card full-width">
                <div class="info-label">MARRIAGE PLACE</div>
                <div class="info-label-am">የጋብቻ ቦታ</div>
                <div class="info-value">${data.marriage_place || '_________'}</div>
                ${data.marriage_place_am ? `<div class="info-value-am">${data.marriage_place_am}</div>` : ''}
              </div>
              
              <div class="info-card">
                <div class="info-label">WITNESS 1</div>
                <div class="info-label-am">ምስክር ፩</div>
                <div class="info-value">${data.witness1_name || '_________'}</div>
              </div>
              
              <div class="info-card">
                <div class="info-label">WITNESS 2</div>
                <div class="info-label-am">ምስክር ፪</div>
                <div class="info-value">${data.witness2_name || '_________'}</div>
              </div>
            </div>
          </div>
          
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">REGISTRAR'S SIGNATURE & STAMP</div>
              <div class="signature-label">የመዝጋቢ ፊርማ እና ማህተም</div>
              <div class="info-value" style="margin-top: 8px;">${data.registrar_name || '_________________'}</div>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">KEBELE ADMINISTRATOR'S SIGNATURE</div>
              <div class="signature-label">የቀበሌ አስተዳዳሪ ፊርማ</div>
            </div>
          </div>
          
          <div class="footer">
            <p>This certificate is computer generated and is valid for legal purposes</p>
            <p>ይህ ሰርትፊኬት በኮምፒውተር የወጣ እና ለህጋዊ ጉዳይ የሚሠራ ነው</p>
            <p>Issued on: ${registrationDate}</p>
          </div>
        </div>
      </div>
      <div class="print-btn no-print"><button onclick="window.print()">🖨️ PRINT CERTIFICATE</button><button onclick="window.close()">❌ CLOSE</button></div>
    </body>
    </html>
  `;
}


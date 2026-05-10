// app/api/id-card/print/[id]/route.js
import { NextResponse } from 'next/server';
import { getClient } from '@/_lib/db';
import { getSession } from '@/_lib/auth';
import QRCode from 'qrcode';

export async function GET(request, { params }) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ✅ FIX: Properly await params in Next.js 16
  const { id } = await params;
  
  console.log(`Printing ID card with ID: ${id}`);
  
  const client = await getClient();
  
  try {
    // Get ID card data with all available columns
    const result = await client.query(
      `SELECT 
        ic.id_card_id,
        ic.id_number,
        ic.full_name,
        ic.full_name_am,
        ic.father_name,
        ic.father_name_am,
        ic.grandfather_name,
        ic.grandfather_name_am,
        ic.sex,
        ic.birth_date_gc,
        ic.birth_date_ec,
        ic.issue_date_gc,
        ic.issue_date_ec,
        ic.expiry_date_gc,
        ic.expiry_date_ec,
        ic.house_number,
        ic.phone_number,
        ic.marital_status,
        ic.place_of_birth,
        ic.residence,
        ic.photo_url,
        ic.status,
        ic.created_at,
        -- Emergency Contact Fields
        ic.emergency_contact_name,
        ic.emergency_relationship,
        ic.emergency_phone,
        ic.emergency_alt_phone,
        ic.emergency_address,
        -- Medical Notes
        ic.medical_notes
      FROM id_card ic
      WHERE ic.id_card_id = $1`,
      [id]
    );
    
    const certificate = result.rows[0];
    console.log('ID Card data:', certificate);
    console.log('Photo URL:', certificate?.photo_url);
    
    if (!certificate) {
      console.log(`ID card not found: id=${id}`);
      return NextResponse.json({ error: 'ID card not found' }, { status: 404 });
    }
    
    // Generate QR code for ID card
    const qrData = JSON.stringify({
      id: certificate.id_number,
      name: certificate.full_name,
      father: certificate.father_name,
      grandfather: certificate.grandfather_name,
      birth: certificate.birth_date_gc,
      issue: certificate.issue_date_gc,
      expiry: certificate.expiry_date_gc,
      phone: certificate.phone_number,
      house: certificate.house_number,
      placeOfBirth: certificate.place_of_birth
    });
    
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 150,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    const htmlTemplate = generateIDCardHTML(certificate, qrCodeDataURL);
    
    return new NextResponse(htmlTemplate, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
    
  } catch (error) {
    console.error('Error generating ID card:', error);
    return NextResponse.json({ error: 'Failed to generate ID card: ' + error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

function generateIDCardHTML(data, qrCodeDataURL) {
  // Get photo URL or use placeholder
  const photoUrl = (data.photo_url && data.photo_url.trim()) ? data.photo_url : null;
  
  // Format dates nicely
  const formatGcDate = (dateStr) => {
    if (!dateStr) return '_________';
    return new Date(dateStr).toLocaleDateString();
  };
  
  // Get Amharic name or fallback to English
  const fullNameAm = data.full_name_am || data.full_name || '_________';
  const fatherNameAm = data.father_name_am || data.father_name || '_________';
  const grandfatherNameAm = data.grandfather_name_am || data.grandfather_name || '_________';
  
  // Emergency contact data (using actual column names)
  const hasEmergency = data.emergency_contact_name && data.emergency_contact_name.trim();
  const hasMedicalNotes = data.medical_notes && data.medical_notes.trim();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Ethiopian ID Card - ${data.full_name || 'ID Card'}</title>
      <style>
        @media print {
          body { margin: 0; padding: 0; background: white; }
          .no-print { display: none; }
          .id-card-front, .id-card-back { 
            page-break-after: avoid; 
            break-inside: avoid;
            box-shadow: none;
          }
          img {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Times New Roman', Arial, sans-serif;
          background: #e0e0e0;
          padding: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
        }
        .id-card-container {
          width: 380px;
          margin: 0 auto;
        }
        /* FRONT OF ID CARD */
        .id-card-front {
          background: linear-gradient(135deg, #1e3a5f 0%, #0f2b44 100%);
          border-radius: 15px;
          padding: 15px;
          color: white;
          margin-bottom: 20px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          position: relative;
        }
        /* BACK OF ID CARD */
        .id-card-back {
          background: #f5f5f5;
          border-radius: 15px;
          padding: 15px;
          color: #333;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        .card-header {
          text-align: center;
          border-bottom: 1px solid rgba(255,255,255,0.3);
          padding-bottom: 8px;
          margin-bottom: 12px;
        }
        .card-header h3 {
          margin: 2px 0;
          font-size: 10px;
        }
        .card-header h2 {
          margin: 2px 0;
          font-size: 14px;
        }
        .card-header h1 {
          margin: 2px 0;
          font-size: 16px;
        }
        .ethiopian-flag {
          font-size: 24px;
          letter-spacing: 4px;
        }
        .photo-section {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }
        .photo {
          width: 95px;
          height: 115px;
          background: white;
          border-radius: 8px;
          display: flex !important;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 2px solid #ffd700;
          visibility: visible !important;
          opacity: 1 !important;
        }
        .photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          visibility: visible !important;
          display: block;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .photo-placeholder {
          text-align: center;
          color: #999;
          font-size: 11px;
          width: 100%;
          visibility: visible !important;
        }
        .photo-placeholder div:first-child {
          font-size: 35px;
        }
        .info {
          flex: 1;
          font-size: 10px;
        }
        .info-row {
          margin-bottom: 6px;
        }
        .label {
          font-weight: bold;
          font-size: 7px;
          opacity: 0.8;
          display: block;
          letter-spacing: 0.5px;
        }
        .value {
          font-size: 9px;
          font-weight: normal;
          word-wrap: break-word;
          line-height: 1.3;
        }
        .value-amharic {
          font-family: 'Noto Sans Ethiopic', 'Nyala', 'Abyssinica SIL', sans-serif;
          font-size: 9px;
        }
        .qr-section {
          text-align: center;
          margin-top: 10px;
          padding-top: 8px;
          border-top: 1px solid rgba(255,255,255,0.3);
          display: block !important;
          visibility: visible !important;
        }
        .qr-code {
          width: 65px;
          height: 65px;
          margin: 0 auto;
          display: block !important;
          background: white;
          padding: 4px;
          border-radius: 8px;
          visibility: visible !important;
          opacity: 1 !important;
        }
        .qr-placeholder {
          width: 60px;
          height: 60px;
          background: white;
          margin: 0 auto;
          display: flex !important;
          align-items: center;
          justify-content: center;
          border-radius: 5px;
          visibility: visible !important;
        }
        .footer {
          text-align: center;
          font-size: 7px;
          margin-top: 8px;
          opacity: 0.7;
        }
        /* BACK CARD STYLES */
        .back-header {
          text-align: center;
          border-bottom: 1px solid #ccc;
          padding-bottom: 8px;
          margin-bottom: 12px;
          font-weight: bold;
          font-size: 12px;
        }
        .back-header h4 {
          margin: 0;
        }
        .address-section {
          margin-bottom: 12px;
        }
        .address-row {
          display: flex;
          margin-bottom: 8px;
          font-size: 10px;
          padding: 3px 0;
          border-bottom: 1px dotted #ddd;
        }
        .address-label {
          width: 100px;
          font-weight: bold;
          font-size: 9px;
        }
        .address-value {
          flex: 1;
          font-size: 9px;
        }
        /* Emergency Contact Section */
        .emergency-section {
          margin-bottom: 12px;
          margin-top: 8px;
          padding: 8px;
          background: #fff8e1;
          border-radius: 8px;
          border-left: 3px solid #ff9800;
        }
        .emergency-header {
          font-weight: bold;
          font-size: 10px;
          display: flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 8px;
          color: #e65100;
        }
        /* Medical Notes Section */
        .medical-section {
          margin-bottom: 12px;
          padding: 8px;
          background: #e8f5e9;
          border-radius: 8px;
          border-left: 3px solid #4caf50;
        }
        .medical-header {
          font-weight: bold;
          font-size: 10px;
          display: flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 8px;
          color: #2e7d32;
        }
        .signature-section {
          display: flex;
          justify-content: space-between;
          margin-top: 15px;
          padding-top: 12px;
          border-top: 1px solid #ccc;
        }
        .signature-box {
          text-align: center;
        }
        .signature-line {
          width: 120px;
          height: 1px;
          border-top: 1px solid #333;
          margin-top: 20px;
        }
        .no-print {
          text-align: center;
          margin-top: 20px;
        }
        button {
          padding: 10px 20px;
          font-size: 14px;
          cursor: pointer;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 8px;
          margin: 0 5px;
        }
        button:hover {
          background: #1d4ed8;
        }
      </style>
    </head>
    <body>
      <div class="id-card-container">
        <!-- ==================== FRONT OF ID CARD ==================== -->
        <div class="id-card-front">
          <div class="card-header">
            <div class="ethiopian-flag">🇪🇹</div>
            <h3>የኢትዮጵያ ፌዴራላዊ ዴሞክራሲያዊ ሪፐብሊክ</h3>
            <h3>Federal Democratic Republic of Ethiopia</h3>
            <h2>የመታወቂያ ካርድ</h2>
            <h2>Identification Card</h2>
          </div>
          
          <div class="photo-section">
            <div class="photo">
              ${photoUrl ? 
                `<img src="${photoUrl}" alt="Resident Photo" onerror="console.error('Image load failed:', this.src); this.style.display='none';" />` : 
                `<div class="photo-placeholder">
                  <div>📷</div>
                  <div>PHOTO</div>
                  <div style="font-size: 8px; margin-top: 4px; color: #666;">No photo uploaded</div>
                </div>`
              }
            </div>
            <div class="info">
              <div class="info-row">
                <span class="label">ስም / Name</span>
                <span class="value">${data.full_name || '_________'}</span>
                <span class="value-amharic" style="font-size: 8px; display: block;">${fullNameAm}</span>
              </div>
              <div class="info-row">
                <span class="label">የአባት ስም / Father</span>
                <span class="value">${data.father_name || '_________'}</span>
                <span class="value-amharic" style="font-size: 8px; display: block;">${fatherNameAm}</span>
              </div>
              <div class="info-row">
                <span class="label">የአያት ስም / G-Father</span>
                <span class="value">${data.grandfather_name || '_________'}</span>
                <span class="value-amharic" style="font-size: 8px; display: block;">${grandfatherNameAm}</span>
              </div>
              <div class="info-row">
                <span class="label">ID ቁጥር / ID No</span>
                <span class="value">${data.id_number || '_________'}</span>
              </div>
            </div>
          </div>
          
          <div class="info" style="margin-top: 5px;">
            <div class="info-row">
              <span class="label">የትውልድ ቀን / DOB</span>
              <span class="value">${data.birth_date_ec || '_________'} EC / ${data.birth_date_gc ? formatGcDate(data.birth_date_gc) : '_________'} GC</span>
            </div>
            <div class="info-row">
              <span class="label">ጾታ / Sex</span>
              <span class="value">${data.sex === 'Male' ? 'ወንድ / Male' : data.sex === 'Female' ? 'ሴት / Female' : data.sex || '_________'}</span>
            </div>
            <div class="info-row">
              <span class="label">የትውልድ ቦታ / Place of Birth</span>
              <span class="value">${data.place_of_birth || '_________'}</span>
            </div>
            <div class="info-row">
              <span class="label">የጋብቻ ሁኔታ / Marital Status</span>
              <span class="value">${data.marital_status || '_________'}</span>
            </div>
          </div>
          
          <div class="qr-section">
            ${qrCodeDataURL ? `
              <img src="${qrCodeDataURL}" alt="QR Code" class="qr-code" style="display: block !important;" />
            ` : `
              <div class="qr-placeholder">
                <div style="font-size: 8px; text-align: center;">QR CODE</div>
              </div>
            `}
            <div style="font-size: 6px; margin-top: 4px;">ማረጋገጫ ኮድ / Verification Code</div>
          </div>
          
          <div class="footer">
            ይህ ካርድ ለ4 ዓመታት የሚቆይ ነው / Valid for 4 years
          </div>
        </div>
        
        <!-- ==================== BACK OF ID CARD ==================== -->
        <div class="id-card-back">
          <div class="back-header">
            <h4>ተጨማሪ መረጃ / Additional Information</h4>
          </div>
          
          <div class="address-section">
            <div class="address-row">
              <div class="address-label">ቤት ቁጥር / House No:</div>
              <div class="address-value">${data.house_number || data.residence || '_________________'}</div>
            </div>
            <div class="address-row">
              <div class="address-label">ቀበሌ / Kebele:</div>
              <div class="address-value">Bossa Addis Kebele / ቦሳ አዲስ ቀበሌ</div>
            </div>
            <div class="address-row">
              <div class="address-label">ስልክ ቁጥር / Phone:</div>
              <div class="address-value">${data.phone_number || data.phone || '_________________'}</div>
            </div>
          </div>

          <!-- ==================== EMERGENCY CONTACT SECTION ==================== -->
          <div class="emergency-section">
            <div class="emergency-header">
              <span>🆘</span>
              <span>የአደጋ ጊዜ መገናኛ / Emergency Contact</span>
            </div>
            <div class="address-row">
              <div class="address-label">ሙሉ ስም / Full Name:</div>
              <div class="address-value">${data.emergency_contact_name || '_________________'}</div>
            </div>
            <div class="address-row">
              <div class="address-label">ዝምድና / Relationship:</div>
              <div class="address-value">${data.emergency_relationship || '_________________'}</div>
            </div>
            <div class="address-row">
              <div class="address-label">ስልክ ቁጥር / Phone:</div>
              <div class="address-value">${data.emergency_phone || '_________________'}</div>
            </div>
            ${data.emergency_alt_phone ? `
            <div class="address-row">
              <div class="address-label">ተለዋጭ ስልክ / Alt Phone:</div>
              <div class="address-value">${data.emergency_alt_phone}</div>
            </div>
            ` : ''}
            ${data.emergency_address ? `
            <div class="address-row">
              <div class="address-label">አድራሻ / Address:</div>
              <div class="address-value">${data.emergency_address}</div>
            </div>
            ` : ''}
          </div>

          <!-- ==================== MEDICAL NOTES SECTION ==================== -->
          ${hasMedicalNotes ? `
          <div class="medical-section">
            <div class="medical-header">
              <span>🏥</span>
              <span>የሕክምና ማስታወሻ / Medical Notes</span>
            </div>
            <div class="address-row">
              <div class="address-value" style="font-style: italic;">${data.medical_notes}</div>
            </div>
          </div>
          ` : ''}
          
          <div class="signature-section">
            <div class="signature-box">
              <div>የተሰጠበት ቀን / Issue Date:</div>
              <div><strong>${data.issue_date_ec || '_________'} EC</strong></div>
              <div><strong>${data.issue_date_gc ? formatGcDate(data.issue_date_gc) : '_________'} GC</strong></div>
            </div>
            <div class="signature-box">
              <div>የሚያበቃበት ቀን / Expiry Date:</div>
              <div><strong>${data.expiry_date_ec || '_________'} EC</strong></div>
              <div><strong>${data.expiry_date_gc ? formatGcDate(data.expiry_date_gc) : '_________'} GC</strong></div>
            </div>
          </div>
          
          <div class="signature-section" style="margin-top: 10px; padding-top: 10px;">
            <div class="signature-box">
              <div>የቀበሌ ማሕተም</div>
              <div class="signature-line"></div>
              <div>Kebele Seal</div>
            </div>
            <div class="signature-box">
              <div>የቀበሌ አስተዳዳሪ ፊርማ</div>
              <div class="signature-line"></div>
              <div>Kebele Administrator Signature</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Print Controls -->
      <div class="no-print" style="text-align: center; margin-top: 20px;">
        <button onclick="window.print()">🖨️ Print ID Card</button>
        <button onclick="window.close()">❌ Close</button>
      </div>

      <script>
        // Debug: Log image sources
        const images = document.querySelectorAll('img');
        console.log('Total images on page:', images.length);
        images.forEach((img, index) => {
          console.log(\`Image \${index}:\`, img.src, 'Loaded:', img.complete);
          img.addEventListener('load', function() {
            console.log(\`Image \${index} loaded successfully\`);
          });
          img.addEventListener('error', function() {
            console.error(\`Image \${index} failed to load:\`, img.src);
          });
        });
      </script>
    </body>
    </html>
  `;
}
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
      if (certificate) {
        htmlTemplate = generateDeathCertificateHTML(certificate);
      }
    } else if (type === 'marriage') {
      const result = await client.query(
        `SELECT * FROM marriage_certificate WHERE marriage_id = $1`,
        [id]
      );
      certificate = result.rows[0];
      if (certificate) {
        htmlTemplate = generateMarriageCertificateHTML(certificate);
      }
    } else if (type === 'id-card') {
      const result = await client.query(
        `SELECT * FROM id_card WHERE id_card_id = $1`,
        [id]
      );
      certificate = result.rows[0];
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
          width: 150, margin: 1,
          color: { dark: '#000000', light: '#FFFFFF' }
        });
        htmlTemplate = generateIDCardHTML(certificate, qrCodeDataURL);
      }
    }// Add to the GET function
      else if (type === 'transfer') {
  const result = await client.query(
    `SELECT * FROM transfer_certificate WHERE certificate_number = $1`,
    [id]
  );
  certificate = result.rows[0];
  if (certificate) {
    // Get transfer data
    const transferResult = await client.query(
      `SELECT t.*, 
              CONCAT(r.fname, ' ', r.lname) as resident_name,
              CONCAT(r.fname_am, ' ', r.lname_am) as resident_name_am,
              r.house_id
       FROM transfer_request t
       LEFT JOIN resident r ON r.resident_id = t.resident_id
       WHERE t.transfer_id = $1`,
      [certificate.transfer_id]
    );
    const transfer = transferResult.rows[0];
    
    // ✅ Fetch family members for this transfer
    const familyResult = await client.query(
      `SELECT tfm.*, 
              CONCAT(r.fname, ' ', r.lname) as member_name,
              CONCAT(r.fname_am, ' ', r.lname_am) as member_name_am
       FROM transfer_family_members tfm
       LEFT JOIN resident r ON r.resident_id = tfm.family_member_id
       WHERE tfm.transfer_id = $1 AND tfm.is_transferring = true`,
      [certificate.transfer_id]
    );
    
    const certificateData = {
      ...certificate,
      ...transfer,
      certificate_number: certificate.certificate_number,
      family_members: familyResult.rows.map(m => ({
        name: m.member_name || m.name,
        name_am: m.member_name_am || m.name_am,
        relationship: m.relationship
      }))
    };
    htmlTemplate = generateTransferCertificateHTML(certificateData);
  }
}
    
    if (!certificate) {
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

// ─────────────────────────────────────────────────────────────────────────────
// SHARED STYLES
// ─────────────────────────────────────────────────────────────────────────────
const sharedCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;600;700&display=swap');

  @media print {
    body { background: white !important; margin: 0; padding: 0; }
    .no-print { display: none !important; }
    .page { box-shadow: none !important; margin: 0 !important; }
    @page { size: A4 landscape; margin: 10mm; }
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Times New Roman', Georgia, serif;
    background: #d0d5dd;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 30px 20px;
    gap: 20px;
  }

  /* ── Page shell ── */
  .page {
    width: 100%;
    max-width: 960px;
    background: #f0ede8;
    background-image:
      repeating-linear-gradient(0deg,   transparent, transparent 24px, rgba(0,0,0,.03) 25px),
      repeating-linear-gradient(90deg,  transparent, transparent 24px, rgba(0,0,0,.03) 25px);
    box-shadow: 0 8px 30px rgba(0,0,0,.25), inset 0 0 0 8px rgba(255,255,255,.6);
    border: 3px solid #555;
    position: relative;
  }

  /* ── Header band ── */
  .cert-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px 10px;
    border-bottom: 2px solid #333;
    background: #fff;
    gap: 12px;
  }
  .cert-header .meta-block {
    flex: 1;
    font-size: 9.5px;
    line-height: 1.9;
  }
  .cert-header .meta-block.right { text-align: right; }
  .cert-header .meta-block .meta-row {
    border-bottom: 1px dotted #999;
    padding-bottom: 1px;
    margin-bottom: 3px;
    white-space: nowrap;
  }
  .cert-header .meta-block .meta-row span {
    font-weight: 700;
    font-size: 10px;
  }
  .cert-header .center-logo {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    min-width: 140px;
  }
  .cert-header .center-logo img { width: 70px; height: auto; }
  .cert-header .center-logo .org-title {
    font-size: 11px;
    font-weight: 700;
    text-align: center;
    line-height: 1.4;
  }

  /* ── Certificate title ── */
  .cert-title-bar {
    text-align: center;
    padding: 10px 20px 6px;
    background: #fff;
    border-bottom: 2px solid #333;
  }
  .cert-title-bar h1 {
    font-size: 20px;
    font-weight: 900;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }
  .cert-title-bar h1.am {
    font-family: 'Noto Sans Ethiopic', sans-serif;
    font-size: 17px;
    letter-spacing: 0;
    font-weight: 700;
  }

  /* ── Body ── */
  .cert-body {
    padding: 14px 20px 18px;
    background: #fafaf7;
  }

  /* ── Field rows ── */
  .field-row {
    display: flex;
    align-items: flex-end;
    gap: 24px;
    margin-bottom: 10px;
    flex-wrap: wrap;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 120px;
  }
  .field.w2  { flex: 2; }
  .field.w3  { flex: 3; }
  .field.w-full { flex: 1 1 100%; }
  .field-label {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .6px;
    color: #333;
    line-height: 1.2;
  }
  .field-label.am {
    font-family: 'Noto Sans Ethiopic', sans-serif;
    text-transform: none;
    letter-spacing: 0;
    font-size: 9px;
    font-weight: 600;
    color: #555;
    margin-top: 1px;
  }
  .field-value {
    border-bottom: 1px solid #333;
    min-height: 22px;
    font-size: 13px;
    font-weight: 600;
    padding: 2px 4px;
    color: #111;
    line-height: 1.3;
  }
  .field-value.am {
    font-family: 'Noto Sans Ethiopic', sans-serif;
    font-size: 12px;
    border-bottom: 1px dotted #aaa;
    margin-top: 2px;
    color: #333;
  }

  /* ── Section divider ── */
  .section-divider {
    border: none;
    border-top: 1.5px solid #aaa;
    margin: 12px 0 10px;
  }

  /* ── Signature row ── */
  .sig-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: 18px;
    padding-top: 10px;
    border-top: 1px dashed #aaa;
    gap: 20px;
  }
  .sig-box {
    flex: 1;
    text-align: center;
  }
  .sig-line {
    border-bottom: 1px solid #333;
    min-height: 32px;
    margin-bottom: 5px;
    position: relative;
  }
  .sig-line .sig-name {
    position: absolute;
    bottom: 3px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
    color: #111;
  }
  .sig-label {
    font-size: 8.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .5px;
    color: #555;
    line-height: 1.4;
  }
  .sig-label.am {
    font-family: 'Noto Sans Ethiopic', sans-serif;
    text-transform: none;
    font-size: 9px;
    font-weight: 600;
  }
  .seal-box {
    width: 80px;
    height: 80px;
    border: 2px solid #999;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 5px;
  }
  .seal-box span { font-size: 8px; text-align: center; color: #999; }

  /* ── Footer ── */
  .cert-footer {
    background: #eee;
    border-top: 1.5px solid #999;
    padding: 6px 20px;
    font-size: 8.5px;
    text-align: center;
    color: #555;
    line-height: 1.6;
  }
  .cert-footer .am {
    font-family: 'Noto Sans Ethiopic', sans-serif;
    font-size: 9px;
  }

  /* ── Print button ── */
  .print-bar {
    display: flex;
    gap: 12px;
    justify-content: center;
  }
  .print-bar button {
    padding: 10px 28px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    border: none;
    border-radius: 6px;
    letter-spacing: .5px;
    transition: opacity .2s;
  }
  .print-bar button:hover { opacity: .85; }
  .btn-print { background: #1a3a5c; color: #fff; }
  .btn-close { background: #555; color: #fff; }

  /* ── Photo placeholders (marriage) ── */
  .photo-box {
    width: 90px;
    height: 100px;
    border: 1.5px solid #666;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;
    font-size: 9px;
    color: #999;
    text-align: center;
    flex-shrink: 0;
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// BIRTH CERTIFICATE
// ─────────────────────────────────────────────────────────────────────────────
function generateBirthCertificateHTML(data) {

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const fmtMonth = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'long' }) : '';
  const fmtDay   = (d) => d ? new Date(d).getDate() : '';
  const fmtYear  = (d) => d ? new Date(d).getFullYear() : '';

  const birthGC  = data.birth_date_gc;
  const regDate  = data.created_at;
  const issueDate = data.issue_date || data.created_at;

  const childName    = [data.child_first_name,    data.child_father_name,    data.child_grandfather_name].filter(Boolean).join(' ') || '';
  const childNameAm  = [data.child_first_name_am, data.child_father_name_am, data.child_grandfather_name_am].filter(Boolean).join(' ') || '';

  const fatherName   = data.father_full_name   || '';
  const fatherNameAm = data.father_full_name_am || '';
  const motherName   = data.mother_full_name   || '';
  const motherNameAm = data.mother_full_name_am || '';

  const registrarName   = data.registrar_name         || '';
  const registrarFather = data.registrar_father_name   || '';
  const registrarGf     = data.registrar_grandfather_name || '';

  const placeEn = [data.birth_place, data.woreda ? `Woreda ${data.woreda}` : '', data.zone ? `Zone ${data.zone}` : '', data.sub_city || '', data.region].filter(Boolean).join(', ');
  const placeAm = [data.birth_place_am, data.woreda ? `ወረዳ ${data.woreda}` : '', data.zone ? `ዞን ${data.zone}` : '', data.sub_city_am || '', data.region_am].filter(Boolean).join(', ');

  const sex = data.sex === 'Male' ? 'Male / ወንድ' : data.sex === 'Female' ? 'Female / ሴት' : data.sex || '';

  const F = (val, label, labelAm, cls = '') => `
    <div class="field ${cls}">
      <div class="field-label">${label}</div>
      ${labelAm ? `<div class="field-label am">${labelAm}</div>` : ''}
      <div class="field-value">${val || ''}</div>
    </div>`;

  const FAm = (val, valAm, label, labelAm, cls = '') => `
    <div class="field ${cls}">
      <div class="field-label">${label}</div>
      ${labelAm ? `<div class="field-label am">${labelAm}</div>` : ''}
      <div class="field-value">${val || ''}</div>
      ${valAm ? `<div class="field-value am">${valAm}</div>` : ''}
    </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Birth Certificate – ${childName}</title>
  <style>
    ${sharedCSS}
    .cert-title-bar h1 { color: #003580; }
    .cert-title-bar h1.am { color: #003580; }
    .field-value { border-bottom-color: #003580; }
    .sig-line { border-bottom-color: #003580; }
  </style>
</head>
<body>

<div class="page">

  <!-- HEADER -->
  <div class="cert-header">
    <!-- Left meta -->
    <div class="meta-block">
      <div class="meta-row">የልደት ብሔር መዝገብ ቅጽ ቁጥር / Birth Register Form Number</div>
      <div class="meta-row"><span>${data.form_number || '...................................'}</span></div>
      <div class="meta-row" style="margin-top:6px;">የልደት ምዝገባ ልዩ መለያ ቁጥር / Birth Registration Unique Identification Number</div>
      <div class="meta-row"><span>${data.registration_number || '...................................'}</span></div>
    </div>

    <!-- Centre logo -->
    <div class="center-logo">
      <img src="/et.png" alt="Ethiopian Flag"/>
      <div class="org-title">Federal Democratic Republic of Ethiopia<br/>Vital Event Registration</div>
    </div>

    <!-- Right meta (empty on birth) -->
    <div class="meta-block right">
      &nbsp;
    </div>
  </div>

  <!-- TITLE -->
  <div class="cert-title-bar">
    <h1>Birth Certificate &nbsp;/&nbsp; <span class="am" style="font-size:18px;font-family:'Noto Sans Ethiopic',sans-serif;">የልደት ምስክር ወረቀት</span></h1>
  </div>

  <!-- BODY -->
  <div class="cert-body">

    <!-- Row 1: Child names -->
    <div class="field-row">
      ${FAm(childName, childNameAm, "Name / ስም", "የህጻኑ/ዋ ስም", "w3")}
      ${FAm(data.child_father_name || '', data.child_father_name_am || '', "Father's Name / የአባት ስም", "የአባት ስም", "w2")}
      ${FAm(data.child_grandfather_name || '', data.child_grandfather_name_am || '', "Grandfather's Name", "የአያት ስም", "w2")}
    </div>

    <!-- Row 2: Sex / DOB -->
    <div class="field-row">
      ${F(sex, "Sex / ጾታ", "ጾታ")}
      ${F(fmtMonth(birthGC), "Date of Birth: Month / የልደት ቀን፡ ወር", "ወር")}
      ${F(fmtDay(birthGC),   "Date / ቀን", "ቀን")}
      ${F(fmtYear(birthGC),  "Year / ዓ.ም", "ዓ.ም")}
      ${F(data.birth_date_ec || '', "Ethiopian Date (EC) / ኢ.ቀ", "ኢ.ቀ")}
      ${F(data.nationality || 'Ethiopian', "Nationality / ዜግነት", "ዜግነት")}
    </div>

    <!-- Row 3: Place of birth -->
    <div class="field-row">
      ${FAm(placeEn, placeAm, "Place/Country of Birth", "የትውልድ ቦታ/ሀገር", "w2")}
      ${FAm(data.region || '', data.region_am || '', "Region / ክልል / City Administration", "ክልል / ከተማ አስተዳደር")}
      ${F(data.zone || '', "Zone / City Administration / ዞን", "ዞን / ከተማ አስተዳደር")}
    </div>

    <!-- Row 4: Woreda / Sub-city / Kebele -->
    <div class="field-row">
      ${F(data.woreda || '',    "Woreda / Special Woreda / ወረዳ", "ወረዳ/ልዩ ወረዳ")}
      ${F(data.sub_city || '',  "Sub-City / ክፍለ ከተማ", "ክፍለ ከተማ")}
      ${F(data.kebele || data.birth_place || '', "Kebele / ቀበሌ", "ቀበሌ")}
      ${F(data.nationality || 'Ethiopian', "Nationality / ዜግነት", "ዜግነት")}
    </div>

    <hr class="section-divider"/>

    <!-- Row 5: Mother -->
    <div class="field-row">
      ${FAm(motherName, motherNameAm, "Mother's Full Name / የእናት ሙሉ ስም", "የእናት ሙሉ ስም", "w3")}
      ${F(data.mother_nationality || 'Ethiopian', "Mother's Nationality / የእናት ዜግነት", "የእናት ዜግነት")}
    </div>

    <!-- Row 6: Father -->
    <div class="field-row">
      ${FAm(fatherName, fatherNameAm, "Father's Full Name / የአባት ሙሉ ስም", "የአባት ሙሉ ስም", "w3")}
      ${F(data.father_nationality || 'Ethiopian', "Father's Nationality / የአባት ዜግነት", "የአባት ዜግነት")}
    </div>

    <hr class="section-divider"/>

    <!-- Row 7: Registration dates -->
    <div class="field-row">
      <div class="field-label" style="align-self:center;white-space:nowrap;font-size:9px;">Date of Birth Registration / <span style="font-family:'Noto Sans Ethiopic',sans-serif;">የልደት ምዝገባ ቀን</span></div>
      ${F(fmtMonth(regDate), "Month / ወር", "ወር")}
      ${F(fmtDay(regDate),   "Date / ቀን",  "ቀን")}
      ${F(fmtYear(regDate),  "Year / ዓ.ም", "ዓ.ም")}
      &nbsp;&nbsp;&nbsp;
      <div class="field-label" style="align-self:center;white-space:nowrap;font-size:9px;">Date of Certificate Issued / <span style="font-family:'Noto Sans Ethiopic',sans-serif;">ምስክር ወረቀት የወጣበት ቀን</span></div>
      ${F(fmtMonth(issueDate), "Month / ወር", "ወር")}
      ${F(fmtDay(issueDate),   "Date / ቀን",  "ቀን")}
      ${F(fmtYear(issueDate),  "Year / ዓ.ም", "ዓ.ም")}
    </div>

    <!-- Row 8: Civil Registrar -->
    <div class="field-row">
      ${F(registrarName,   "Name of Civil Registrar / የብሔር መዝጋቢ ስም",  "የብሔር መዝጋቢ ሙሉ ስም", "w2")}
      ${F(registrarFather, "Father's Name / የአባት ስም", "የአባት ስም")}
      ${F(registrarGf,     "Grand Father's Name / የአያት ስም", "የአያት ስም")}
      ${F(data.registrar_km || '', "What Km / ቀበሌ", "")}
    </div>

    <!-- Signatures -->
    <div class="sig-row">
      <div class="sig-box">
        <div class="seal-box"><span>ማህተም<br/>Seal</span></div>
        <div class="sig-label">ፊርማ / Signature</div>
      </div>
      <div class="sig-box" style="flex:2;">
        <div class="sig-line">
          ${registrarName ? `<div class="sig-name">${registrarName}</div>` : ''}
        </div>
        <div class="sig-label">REGISTRAR'S SIGNATURE &amp; STAMP</div>
        <div class="sig-label am">የመዝጋቢ ፊርማ እና ማህተም</div>
      </div>
      <div class="sig-box" style="flex:2;">
        <div class="sig-line"></div>
        <div class="sig-label">KEBELE ADMINISTRATOR'S SIGNATURE</div>
        <div class="sig-label am">የቀበሌ አስተዳዳሪ ፊርማ</div>
      </div>
    </div>

  </div><!-- /cert-body -->

  <div class="cert-footer">
    <div>This certificate is computer-generated and valid for legal purposes &nbsp;|&nbsp; <span class="am">ይህ ሰርትፊኬት በኮምፒውተር የወጣ እና ለህጋዊ ጉዳይ የሚሠራ ነው</span></div>
    <div>Issued on: ${fmt(issueDate)} &nbsp;|&nbsp; Certificate ID: ${data.birth_id || ''}</div>
  </div>

</div><!-- /page -->

<div class="print-bar no-print">
  <button class="btn-print" onclick="window.print()">🖨️ PRINT CERTIFICATE</button>
  <button class="btn-close" onclick="window.close()">✕ CLOSE</button>
</div>

</body>
</html>`;
}


// ─────────────────────────────────────────────────────────────────────────────
// DEATH CERTIFICATE
// ─────────────────────────────────────────────────────────────────────────────
function generateDeathCertificateHTML(data) {

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const fmtMonth = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'long' }) : '';
  const fmtDay   = (d) => d ? new Date(d).getDate() : '';
  const fmtYear  = (d) => d ? new Date(d).getFullYear() : '';

  const deathGC  = data.death_date_gc;
  const regDate  = data.created_at;
  const issueDate = data.issue_date || data.created_at;

  const registrarName   = data.registrar_name         || '';
  const registrarFather = data.registrar_father_name   || '';
  const registrarGf     = data.registrar_grandfather_name || '';

  const F = (val, label, labelAm, cls = '') => `
    <div class="field ${cls}">
      <div class="field-label">${label}</div>
      ${labelAm ? `<div class="field-label am">${labelAm}</div>` : ''}
      <div class="field-value">${val || ''}</div>
    </div>`;

  const FAm = (val, valAm, label, labelAm, cls = '') => `
    <div class="field ${cls}">
      <div class="field-label">${label}</div>
      ${labelAm ? `<div class="field-label am">${labelAm}</div>` : ''}
      <div class="field-value">${val || ''}</div>
      ${valAm ? `<div class="field-value am">${valAm}</div>` : ''}
    </div>`;

  const sex = data.sex === 'Male' ? 'Male / ወንድ' : data.sex === 'Female' ? 'Female / ሴት' : data.sex || '';

  const birthGC = data.birth_date_gc;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Death Certificate – ${data.deceased_name || ''}</title>
  <style>
    ${sharedCSS}
    .cert-title-bar h1 { color: #3b0000; }
    .field-value { border-bottom-color: #3b0000; }
    .sig-line { border-bottom-color: #3b0000; }
  </style>
</head>
<body>

<div class="page">

  <!-- HEADER -->
  <div class="cert-header">
    <div class="meta-block">
      <div class="meta-row">የሞት ብሔር መዝገብ ቅጽ ቁጥር / Death Register Form Number</div>
      <div class="meta-row"><span>${data.form_number || '...................................'}</span></div>
    </div>

    <div class="center-logo">
      <img src="/et.png" alt="Ethiopian Flag"/>
      <div class="org-title">Federal Democratic Republic of Ethiopia<br/>Vital Event Registration</div>
    </div>

    <div class="meta-block right">
      <div class="meta-row">Death Registration Unique Identification Number / የሞት ምዝገባ ልዩ መለያ ቁጥር</div>
      <div class="meta-row"><span>${data.registration_number || '...................................'}</span></div>
      <div class="meta-row" style="margin-top:6px;">Birth Registration Unique Identification Number / የልደት ምዝገባ ልዩ መለያ ቁጥር</div>
      <div class="meta-row"><span>${data.birth_registration_number || '...................................'}</span></div>
    </div>
  </div>

  <!-- TITLE -->
  <div class="cert-title-bar">
    <h1>Death Certificate &nbsp;/&nbsp; <span class="am" style="font-size:18px;font-family:'Noto Sans Ethiopic',sans-serif;">የሞት ምስክር ወረቀት</span></h1>
  </div>

  <!-- BODY -->
  <div class="cert-body">

    <!-- Row 1: Deceased name -->
    <div class="field-row">
      ${FAm(data.deceased_name || '', data.deceased_name_am || '', "Deceased's Name / የሟች ስም", "የሟች ስም", "w2")}
      ${FAm(data.deceased_father_name || '', data.deceased_father_name_am || '', "Father's Name / የአባት ስም", "የአባት ስም", "w2")}
      ${FAm(data.deceased_grandfather_name || '', data.deceased_grandfather_name_am || '', "Grandfather's Name / የአያት ስም", "የአያት ስም", "w2")}
    </div>

    <!-- Row 2: Title / Sex / DOB -->
    <div class="field-row">
      ${F(data.title || '',          "Title / ማዕረግ", "ማዕረግ")}
      ${F(sex,                       "Sex / ጾታ", "ጾታ")}
      ${F(fmtMonth(birthGC),         "Month of Birth / የልደት ወር", "ወር")}
      ${F(fmtDay(birthGC),           "Date / ቀን", "ቀን")}
      ${F(fmtYear(birthGC),          "Year / ዓ.ም", "ዓ.ም")}
      ${F(data.birth_date_ec || '',  "DOB (EC) / ኢ.ቀ", "ኢ.ቀ")}
    </div>

    <!-- Row 3: Nationality / Place of death -->
    <div class="field-row">
      ${F(data.nationality || 'Ethiopian', "Nationality / ዜግነት", "ዜግነት")}
      ${FAm(data.place_of_death || '', data.place_of_death_am || '', "Place of Death / የሞት ቦታ", "ሞት የተፈጠረበት ቦታ", "w3")}
    </div>

    <!-- Row 4: Cause of death -->
    <div class="field-row">
      ${FAm(data.cause_of_death || '', data.cause_of_death_am || '', "Cause of Death / የሞት መንስኤ", "የሞት መንስኤ", "w-full")}
    </div>

    <!-- Row 5: Date of death -->
    <div class="field-row">
      <div class="field-label" style="align-self:center;white-space:nowrap;font-size:9px;">Date of Death / <span style="font-family:'Noto Sans Ethiopic',sans-serif;">ሞት የተፈጠረበት ቀን</span></div>
      ${F(fmtMonth(deathGC), "Month / ወር", "ወር")}
      ${F(fmtDay(deathGC),   "Date / ቀን",  "ቀን")}
      ${F(fmtYear(deathGC),  "Year / ዓ.ም", "ዓ.ም")}
      ${F(data.death_date_ec || '', "Death Date (EC) / ኢ.ቀ", "ኢ.ቀ")}
      &nbsp;&nbsp;
      <div class="field-label" style="align-self:center;white-space:nowrap;font-size:9px;">Date of Death Registration / <span style="font-family:'Noto Sans Ethiopic',sans-serif;">የሞት ምዝገባ ቀን</span></div>
      ${F(fmtMonth(regDate), "Month / ወር", "ወር")}
      ${F(fmtDay(regDate),   "Date / ቀን",  "ቀን")}
      ${F(fmtYear(regDate),  "Year / ዓ.ም", "ዓ.ም")}
    </div>

    <!-- Row 6: Certificate issue date -->
    <div class="field-row">
      <div class="field-label" style="align-self:center;white-space:nowrap;font-size:9px;">Date of Certificate Issued / <span style="font-family:'Noto Sans Ethiopic',sans-serif;">ምስክር ወረቀት የወጣበት ቀን</span></div>
      ${F(fmtMonth(issueDate), "Month / ወር", "ወር")}
      ${F(fmtDay(issueDate),   "Date / ቀን",  "ቀን")}
      ${F(fmtYear(issueDate),  "Year / ዓ.ም", "ዓ.ም")}
    </div>

    <hr class="section-divider"/>

    <!-- Row 7: Civil Registrar -->
    <div class="field-row">
      ${F(registrarName,   "Name of Civil Registrar / የብሔር መዝጋቢ ስም",  "የብሔር መዝጋቢ ሙሉ ስም", "w2")}
      ${F(registrarFather, "Father's Name / የአባት ስም", "የአባት ስም")}
      ${F(registrarGf,     "Grand Father's Name / የአያት ስም", "የአያት ስም")}
      ${F(data.registrar_km || '', "What Km / ቀበሌ", "")}
    </div>

    <!-- Signatures -->
    <div class="sig-row">
      <div class="sig-box">
        <div class="seal-box"><span>ማህተም<br/>Seal</span></div>
        <div class="sig-label">ፊርማ / Signature</div>
      </div>
      <div class="sig-box" style="flex:2;">
        <div class="sig-line">
          ${registrarName ? `<div class="sig-name">${registrarName}</div>` : ''}
        </div>
        <div class="sig-label">REGISTRAR'S SIGNATURE &amp; STAMP</div>
        <div class="sig-label am">የመዝጋቢ ፊርማ እና ማህተም</div>
      </div>
      <div class="sig-box" style="flex:2;">
        <div class="sig-line"></div>
        <div class="sig-label">KEBELE ADMINISTRATOR'S SIGNATURE</div>
        <div class="sig-label am">የቀበሌ አስተዳዳሪ ፊርማ</div>
      </div>
    </div>

  </div><!-- /cert-body -->

  <div class="cert-footer">
    <div>This certificate is computer-generated and valid for legal purposes &nbsp;|&nbsp; <span class="am">ይህ ሰርትፊኬት በኮምፒውተር የወጣ እና ለህጋዊ ጉዳይ የሚሠራ ነው</span></div>
    <div>Issued on: ${fmt(issueDate)} &nbsp;|&nbsp; Certificate ID: ${data.death_id || ''}</div>
  </div>

</div><!-- /page -->

<div class="print-bar no-print">
  <button class="btn-print" onclick="window.print()">🖨️ PRINT CERTIFICATE</button>
  <button class="btn-close" onclick="window.close()">✕ CLOSE</button>
</div>

</body>
</html>`;
}


// ─────────────────────────────────────────────────────────────────────────────
// MARRIAGE CERTIFICATE
// ─────────────────────────────────────────────────────────────────────────────
function generateMarriageCertificateHTML(data) {

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const fmtMonth = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'long' }) : '';
  const fmtDay   = (d) => d ? new Date(d).getDate() : '';
  const fmtYear  = (d) => d ? new Date(d).getFullYear() : '';

  const marriageDate = data.marriage_date_gc;
  const regDate      = data.created_at;
  const issueDate    = data.issue_date || data.created_at;

  const registrarName   = data.registrar_name            || '';
  const registrarFather = data.registrar_father_name      || '';
  const registrarGf     = data.registrar_grandfather_name || '';

  // Wife name parts
  const wifeName   = data.wife_name   || '';
  const wifeNameAm = data.wife_name_am || '';
  const wifeFather = data.wife_father_name  || (wifeName.split(' ')[1] || '');
  const wifeGf     = data.wife_grandfather_name || (wifeName.split(' ')[2] || '');
  const wifeNationality = data.wife_nationality || 'Ethiopian';
  const wifeBirthRegNumber = data.wife_birth_reg_number || '';
  const wifeBirthDateGc = data.wife_birth_date_gc;
  const wifeBirthDateEc = data.wife_birth_date_ec;

  // Husband name parts
  const husbandName   = data.husband_name   || '';
  const husbandNameAm = data.husband_name_am || '';
  const husbandFather = data.husband_father_name  || (husbandName.split(' ')[1] || '');
  const husbandGf     = data.husband_grandfather_name || (husbandName.split(' ')[2] || '');
  const husbandNationality = data.husband_nationality || 'Ethiopian';
  const husbandBirthRegNumber = data.husband_birth_reg_number || '';
  const husbandBirthDateGc = data.husband_birth_date_gc;
  const husbandBirthDateEc = data.husband_birth_date_ec;

  // Form numbers
  const formNumber = data.form_number || '';
  const registrationNumber = data.registration_number || '';

  // Address fields
  const marriagePlace = data.marriage_place || '';
  const marriagePlaceAm = data.marriage_place_am || '';
  const zone = data.zone || '';
  const woreda = data.woreda || '';
  const subCity = data.sub_city || '';
  const kebele = data.kebele || '';

  // Witnesses
  const witness1Name = data.witness1_name || '';
  const witness1NameAm = data.witness1_name_am || '';
  const witness2Name = data.witness2_name || '';
  const witness2NameAm = data.witness2_name_am || '';

  // Handle photos - support DB bytea buffers, data URLs, or external URLs
  const photoToDataURL = (photo) => {
    if (!photo) return '';
    if (typeof photo === 'string') {
      return photo.startsWith('data:image') ? photo : photo;
    }
    if (Buffer.isBuffer(photo) || photo instanceof Uint8Array || ArrayBuffer.isView(photo)) {
      return `data:image/jpeg;base64,${Buffer.from(photo).toString('base64')}`;
    }
    if (photo && typeof photo === 'object' && Array.isArray(photo.data)) {
      return `data:image/jpeg;base64,${Buffer.from(photo.data).toString('base64')}`;
    }
    return '';
  };

  const wifePhotoSrc = photoToDataURL(data.wife_photo || data.wife_photo_url);
  const husbandPhotoSrc = photoToDataURL(data.husband_photo || data.husband_photo_url);

  const F = (val, label, labelAm, cls = '') => `
    <div class="field ${cls}">
      <div class="field-label">${label}</div>
      ${labelAm ? `<div class="field-label am">${labelAm}</div>` : ''}
      <div class="field-value">${val || ''}</div>
    </div>`;

  const FAm = (val, valAm, label, labelAm, cls = '') => `
    <div class="field ${cls}">
      <div class="field-label">${label}</div>
      ${labelAm ? `<div class="field-label am">${labelAm}</div>` : ''}
      <div class="field-value">${val || ''}</div>
      ${valAm ? `<div class="field-value am">${valAm}</div>` : ''}
    </div>`;

  const photoBox = (src, labelEn, labelAm) => src
    ? `<div class="photo-box photo-box--filled">
         <img src="${src}" alt="${labelEn}" style="width:100%;height:100%;object-fit:cover;display:block;"/>
       </div>`
    : `<div class="photo-box">
         <div class="photo-box__inner">
           <div class="photo-box__icon">👤</div>
           <div class="photo-box__label">${labelEn}</div>
           <div class="photo-box__label am">${labelAm}</div>
         </div>
       </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Marriage Certificate – ${husbandName} &amp; ${wifeName}</title>
  <style>
    ${sharedCSS}
    .cert-title-bar h1 { color: #5a0000; }
    .field-value { border-bottom-color: #5a0000; }
    .sig-line { border-bottom-color: #5a0000; }

    /* ── Two-column layout for spouse blocks ── */
    .spouse-cols {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 28px;
    }
    .spouse-col-header {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #5a0000;
      border-bottom: 1.5px solid #5a0000;
      padding-bottom: 3px;
      margin-bottom: 8px;
    }

    /* ── Photo placeholders ── */
    .photo-box {
      width: 120px;
      height: 140px;
      border: 2px solid #333;
      background: #f5f5f0;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border-radius: 8px;
    }
    .photo-box--filled {
      border-color: #5a0000;
      background: #000;
    }
    .photo-box__inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 8px;
      text-align: center;
    }
    .photo-box__icon {
      font-size: 32px;
      opacity: .35;
    }
    .photo-box__label {
      font-size: 9px;
      font-weight: 700;
      color: #666;
      line-height: 1.3;
      text-transform: uppercase;
      letter-spacing: .4px;
    }
    .photo-box__label.am {
      font-family: 'Noto Sans Ethiopic', sans-serif;
      text-transform: none;
      font-size: 9px;
      font-weight: 600;
      color: #888;
    }

    /* ── Header layout: meta | [photo] logo [photo] | meta ── */
    .marriage-header {
      display: flex;
      align-items: stretch;
      border-bottom: 2px solid #333;
      background: #fff;
    }
    .marriage-header .meta-block {
      flex: 1;
      font-size: 9.5px;
      line-height: 1.9;
      padding: 10px 14px;
    }
    .marriage-header .meta-block.right { text-align: right; }
    .marriage-header .meta-block .meta-row {
      border-bottom: 1px dotted #999;
      padding-bottom: 1px;
      margin-bottom: 3px;
      white-space: nowrap;
    }
    .marriage-header .meta-block .meta-row span {
      font-weight: 700;
      font-size: 10px;
    }

    /* Centre column: photos flanking the logo */
    .marriage-header .center-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .marriage-header .logo-photos {
      display: flex;
      align-items: center;
      gap: 18px;
      padding: 12px 10px 8px;
    }
    .marriage-header .org-title {
      font-size: 11px;
      font-weight: 700;
      text-align: center;
      line-height: 1.4;
      padding-bottom: 8px;
    }
    .marriage-header .center-logo-img {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      min-width: 120px;
    }
    .marriage-header .center-logo-img img { width: 64px; height: auto; }
  </style>
</head>
<body>

<div class="page">

  <!-- HEADER: meta | wife-photo + flag + husband-photo | meta -->
  <div class="marriage-header">

    <!-- Left meta -->
    <div class="meta-block">
      <div class="meta-row">የጋብቻ ብሔር መዝገብ ቅጽ ቁጥር / Marriage Register Form Number</div>
      <div class="meta-row"><span>${formNumber || '...................................'}</span></div>
      <div class="meta-row" style="margin-top:6px;">የጋብቻ ምዝገባ ልዩ መለያ ቁጥር / Marriage Registration Unique Identification Number</div>
      <div class="meta-row"><span>${registrationNumber || '...................................'}</span></div>
    </div>

    <!-- Centre: wife photo | logo | husband photo -->
    <div class="center-col">
      <div class="logo-photos">
        <!-- Wife photo -->
        ${photoBox(wifePhotoSrc, "Wife's Photo", "የሚስት ፎቶ")}

        <!-- Flag + org title -->
        <div class="center-logo-img">
          <img src="/et.png" alt="Ethiopian Flag" onerror="this.style.display='none'"/>
          <div class="org-title">Federal Democratic Republic<br/>of Ethiopia<br/>Vital Event Registration</div>
        </div>

        <!-- Husband photo -->
        ${photoBox(husbandPhotoSrc, "Husband's Photo", "የባል ፎቶ")}
      </div>
    </div>

    <!-- Right meta -->
    <div class="meta-block right">
      <div class="meta-row">Wife's Birth Registration Unique Identification Number / የሚስት ልደት ምዝገባ ልዩ መለያ ቁጥር</div>
      <div class="meta-row"><span>${wifeBirthRegNumber || '...................................'}</span></div>
      <div class="meta-row" style="margin-top:6px;">Husband's Birth Registration Unique Identification Number / የባል ልደት ምዝገባ ልዩ መለያ ቁጥር</div>
      <div class="meta-row"><span>${husbandBirthRegNumber || '...................................'}</span></div>
    </div>

  </div><!-- /marriage-header -->

  <!-- TITLE -->
  <div class="cert-title-bar">
    <h1>Marriage Certificate &nbsp;/&nbsp; <span class="am" style="font-size:18px;font-family:'Noto Sans Ethiopic',sans-serif;">የጋብቻ ምስክር ወረቀት</span></h1>
  </div>

  <!-- BODY -->
  <div class="cert-body">

    <!-- Spouse columns -->
    <div class="spouse-cols">

      <!-- WIFE -->
      <div>
        <div class="spouse-col-header">Wife / ሚስት &nbsp; <span style="font-family:'Noto Sans Ethiopic',sans-serif;">የሚስት</span></div>
        <div class="field-row">
          ${FAm(wifeName, wifeNameAm, "Wife's Name / የሚስት ስም", "ስም")}
          ${F(wifeFather, "Father's Name / የአባት ስም", "የአባት ስም")}
          ${F(wifeGf,     "Grand Father's Name / የአያት ስም", "የአያት ስም")}
        </div>
        <div class="field-row">
          <div class="field">
            <div class="field-label">Date of Birth / የልደት ቀን</div>
            <div class="field-label am">የልደት ቀን</div>
            <div class="field-value">${wifeBirthDateGc ? new Date(wifeBirthDateGc).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</div>
            ${wifeBirthDateEc ? `<div class="field-value am">${wifeBirthDateEc}</div>` : ''}
          </div>
          ${F(wifeNationality, "Nationality / ዜግነት", "ዜግነት")}
        </div>
      </div>

      <!-- HUSBAND -->
      <div>
        <div class="spouse-col-header">Husband / ባል &nbsp; <span style="font-family:'Noto Sans Ethiopic',sans-serif;">የባል</span></div>
        <div class="field-row">
          ${FAm(husbandName, husbandNameAm, "Husband's Name / የባል ስም", "ስም")}
          ${F(husbandFather, "Father's Name / የአባት ስም", "የአባት ስም")}
          ${F(husbandGf,     "Grand Father's Name / የአያት ስም", "የአያት ስም")}
        </div>
        <div class="field-row">
          <div class="field">
            <div class="field-label">Date of Birth / የልደት ቀን</div>
            <div class="field-label am">የልደት ቀን</div>
            <div class="field-value">${husbandBirthDateGc ? new Date(husbandBirthDateGc).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</div>
            ${husbandBirthDateEc ? `<div class="field-value am">${husbandBirthDateEc}</div>` : ''}
          </div>
          ${F(husbandNationality, "Nationality / ዜግነት", "ዜግነት")}
        </div>
      </div>

    </div><!-- /spouse-cols -->

    <hr class="section-divider"/>

    <!-- Marriage date -->
    <div class="field-row">
      <div class="field-label" style="align-self:center;white-space:nowrap;font-size:9px;">Date of Marriage / <span style="font-family:'Noto Sans Ethiopic',sans-serif;">የጋብቻ ቀን</span></div>
      ${F(fmtMonth(marriageDate), "Month / ወር", "ወር")}
      ${F(fmtDay(marriageDate),   "Date / ቀን",  "ቀን")}
      ${F(fmtYear(marriageDate),  "Year / ዓ.ም", "ዓ.ም")}
    </div>

    <!-- Place of marriage registration -->
    <div class="field-row">
      ${FAm(marriagePlace, marriagePlaceAm, "Place of Marriage Registration: Region/City Administration", "የጋብቻ ምዝገባ ቦታ: ክልል/ከተማ አስተዳደር", "w2")}
    </div>

    <!-- Zone / Woreda / Sub-city / Kebele -->
    <div class="field-row">
      ${F(zone, "Zone / ዞን", "ዞን")}
      ${F(woreda, "Woreda / ወረዳ", "ወረዳ")}
    </div>
    <div class="field-row">
      ${F(subCity, "Sub City / ክፍለ ከተማ", "ክፍለ ከተማ")}
      ${F(kebele, "Kebele / ቀበሌ", "ቀበሌ")}
    </div>

    <!-- Witnesses -->
    <div class="field-row">
      ${FAm(witness1Name, witness1NameAm, "Witness 1 / ምስክር ፩", "ምስክር ፩", "w2")}
      ${FAm(witness2Name, witness2NameAm, "Witness 2 / ምስክር ፪", "ምስክር ፪", "w2")}
    </div>

    <!-- Registration / Issue dates -->
    <div class="field-row">
      <div class="field-label" style="align-self:center;white-space:nowrap;font-size:9px;">Date of Marriage Registration / <span style="font-family:'Noto Sans Ethiopic',sans-serif;">የጋብቻ ምዝገባ ቀን</span></div>
      ${F(fmtMonth(regDate), "Month / ወር", "ወር")}
      ${F(fmtDay(regDate),   "Date / ቀን",  "ቀን")}
      ${F(fmtYear(regDate),  "Year / ዓ.ም", "ዓ.ም")}
      &nbsp;&nbsp;
      <div class="field-label" style="align-self:center;white-space:nowrap;font-size:9px;">Date of Certificate Issued / <span style="font-family:'Noto Sans Ethiopic',sans-serif;">ምስክር ወረቀት የወጣበት ቀን</span></div>
      ${F(fmtMonth(issueDate), "Month / ወር", "ወር")}
      ${F(fmtDay(issueDate),   "Date / ቀን",  "ቀን")}
      ${F(fmtYear(issueDate),  "Year / ዓ.ም", "ዓ.ም")}
    </div>

    <!-- Civil Registrar -->
    <div class="field-row">
      ${F(registrarName,   "Name of Civil Registrar / የብሔር መዝጋቢ ስም", "የብሔር መዝጋቢ ሙሉ ስም", "w2")}
      ${F(registrarFather, "Father's Name / የአባት ስም", "የአባት ስም")}
      ${F(registrarGf,     "Grand Father's Name / የአያት ስም", "የአያት ስም")}
    </div>

    <!-- Signatures -->
    <div class="sig-row">
      <div class="sig-box">
        <div class="seal-box"><span>ማህተም<br/>Seal</span></div>
        <div class="sig-label">ፊርማ / Signature</div>
      </div>
      <div class="sig-box" style="flex:2;">
        <div class="sig-line">
          ${registrarName ? `<div class="sig-name">${registrarName}</div>` : ''}
        </div>
        <div class="sig-label">REGISTRAR'S SIGNATURE &amp; STAMP</div>
        <div class="sig-label am">የመዝጋቢ ፊርማ እና ማህተም</div>
      </div>
      <div class="sig-box" style="flex:2;">
        <div class="sig-line"></div>
        <div class="sig-label">KEBELE ADMINISTRATOR'S SIGNATURE</div>
        <div class="sig-label am">የቀበሌ አስተዳዳሪ ፊርማ</div>
      </div>
    </div>

  </div><!-- /cert-body -->

  <div class="cert-footer">
    <div>This certificate is computer-generated and valid for legal purposes &nbsp;|&nbsp; <span class="am">ይህ ሰርትፊኬት በኮምፒውተር የወጣ እና ለህጋዊ ጉዳይ የሚሠራ ነው</span></div>
    <div>Issued on: ${fmt(issueDate)} &nbsp;|&nbsp; Certificate ID: ${data.marriage_id || ''}</div>
  </div>

</div><!-- /page -->

<div class="print-bar no-print">
  <button class="btn-print" onclick="window.print()">🖨️ PRINT CERTIFICATE</button>
  <button class="btn-close" onclick="window.close()">✕ CLOSE</button>
</div>

</body>
</html>`;
}

function generateTransferCertificateHTML(data) {
  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const issueDate = data.issue_date || new Date();
  
  // Get both English and Amharic names
  const residentNameEn = data.resident_name || data.residentName || '_________';
  const residentNameAm = data.resident_name_am || data.residentNameAm || '';
  const houseId = data.house_id || '_________';
  const destinationKebele = data.destination_kebele || '_________';
  const transferNumber = data.transfer_number || '_________';
  const transferReason = data.reason || '';
  const transferType = data.transfer_type || 'FULL';
  
  const familyMembers = data.family_members || [];
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Transfer Certificate - ${residentNameEn}</title>
  <style>
    @media print {
      body { background: white; margin: 0; padding: 0; }
      .no-print { display: none; }
      .certificate-container { box-shadow: none; margin: 0; padding: 20px; }
      @page { size: A4; margin: 15mm; }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Times New Roman', 'Georgia', serif;
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
      gap: 20px;
    }
    .flag { 
      width: 80px; 
      height: auto; 
      border-radius: 8px; 
      box-shadow: 0 4px 12px rgba(0,0,0,0.2); 
      border: 2px solid #ffd700;
      object-fit: cover;
    }
    .title-section { text-align: center; color: white; flex: 1; }
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
      border-radius: 8px;
    }
    .seal { width: 90px; height: 90px; border: 3px solid #c8a24c; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; background: #fef8e7; }
    .seal span { font-size: 10px; text-align: center; color: #c8a24c; font-weight: bold; }
    .certificate-title { font-size: 26px; font-weight: bold; color: #1a3a5c; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 2px; text-align: center; }
    .certificate-title-am { font-size: 22px; font-family: 'Noto Sans Ethiopic', sans-serif; color: #1a3a5c; margin-bottom: 15px; text-align: center; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0; }
    .info-card { background: #f8f9fa; padding: 12px; border-radius: 8px; border-left: 4px solid #c8a24c; }
    .full-width { grid-column: span 2; }
    .info-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #6c757d; font-weight: 600; margin-bottom: 4px; }
    .info-label-am { font-family: 'Noto Sans Ethiopic', sans-serif; font-size: 10px; color: #6c757d; margin-bottom: 4px; }
    .info-value { font-size: 14px; font-weight: 600; color: #1a3a5c; margin-top: 4px; line-height: 1.4; }
    .info-value-am { font-family: 'Noto Sans Ethiopic', sans-serif; font-size: 13px; color: #1a3a5c; margin-top: 2px; }
    .family-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .family-table th, .family-table td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
    .family-table th { background: #f0f0f0; font-weight: bold; }
    .signature-section { display: flex; justify-content: space-between; margin-top: 35px; padding-top: 25px; border-top: 1px dashed #dee2e6; }
    .signature-box { text-align: center; width: 200px; }
    .signature-line { width: 100%; height: 1px; background: #1a3a5c; margin: 25px 0 8px; }
    .footer { background: #f8f9fa; padding: 12px 25px; text-align: center; font-size: 9px; color: #6c757d; border-top: 1px solid #e9ecef; }
    .reg-number { text-align: center; margin: 15px 0; padding: 8px; background: #fef8e7; border-radius: 8px; font-family: monospace; font-size: 13px; border: 1px solid #c8a24c; }
    .print-btn { display: flex; justify-content: center; gap: 15px; margin: 20px auto; }
    .print-btn button { padding: 10px 25px; font-size: 14px; cursor: pointer; background: #1a3a5c; color: white; border: none; border-radius: 8px; }
  </style>
</head>
<body>
<div class="certificate-container">
  <div class="header-section">
    <div class="flags-container">
      <img src="/et.png" alt="Ethiopian Flag" class="flag" onerror="this.style.display='none'" />
      <div class="title-section">
        <h1>FEDERAL DEMOCRATIC REPUBLIC OF ETHIOPIA</h1>
        <h2>የኢትዮጵያ ፌዴራላዊ ዴሞክራሲያዊ ሪፐብሊክ</h2>
        <h3>BOSSA ADDIS KEBELE ADMINISTRATION</h3>
        <div class="subtitle">ቦሳ አዲስ ቀበሌ አስተዳደር</div>
      </div>
      <img src="/or.png" alt="Oromia Flag" class="flag" onerror="this.style.display='none'" />
    </div>
  </div>
  
  <div class="certificate-body">
    <div class="seal"><span>ሕዝብና ህይወት ከማኅተም በላይ<br/>The People and Life Above Seal</span></div>
    
    <div class="certificate-title">RESIDENT TRANSFER CERTIFICATE</div>
    <div class="certificate-title-am">የነዋሪ ማስተላለፊያ ሰርትፊኬት</div>
    
    <div class="reg-number">
      <strong>Transfer No / የማስተላለፊያ ቁጥር:</strong> ${transferNumber}
    </div>
    
    <div class="gold-border">
      <div class="info-grid">
        <!-- RESIDENT NAME - Bilingual Display -->
        <div class="info-card full-width">
          <div class="info-label">RESIDENT NAME / የነዋሪ ስም</div>
          <div class="info-label-am">የነዋሪ ስም</div>
          <div class="info-value">${residentNameEn}</div>
          ${residentNameAm ? `<div class="info-value-am">${residentNameAm}</div>` : ''}
        </div>
        
        <div class="info-card">
          <div class="info-label">HOUSE NUMBER / ቤት ቁጥር</div>
          <div class="info-value">${houseId}</div>
        </div>
        
        <div class="info-card">
          <div class="info-label">TRANSFER DATE / የማስተላለፊያ ቀን</div>
          <div class="info-value">${fmt(issueDate)}</div>
        </div>
        
        <div class="info-card">
          <div class="info-label">TRANSFER TYPE / የማስተላለፊያ አይነት</div>
          <div class="info-value">${transferType === 'FULL' ? 'Full Transfer / ሙሉ ማስተላለፊያ' : 'Partial Transfer / ከፊል ማስተላለፊያ'}</div>
        </div>
        
        <div class="info-card full-width">
          <div class="info-label">DESTINATION KEBELE / መድረሻ ቀበሌ</div>
          <div class="info-value">${destinationKebele}</div>
        </div>
        
        <!-- TRANSFER REASON SECTION -->
        ${transferReason ? `
        <div class="info-card full-width">
          <div class="info-label">REASON FOR TRANSFER / የማስተላለፊያ ምክንያት</div>
          <div class="info-label-am">የማስተላለፊያ ምክንያት</div>
          <div class="info-value" style="border-bottom: none; white-space: pre-wrap;">${transferReason}</div>
        </div>
        ` : ''}
      </div>
    </div>
    
    ${familyMembers.length > 0 ? `
    <div class="info-card full-width" style="margin-top: 15px;">
      <div class="info-label">FAMILY MEMBERS TRANSFERRING / የሚተላለፉ የቤተሰብ አባላት</div>
      <div class="info-label-am">የሚተላለፉ የቤተሰብ አባላት</div>
      <table class="family-table">
        <thead>
          <tr><th>Name / ስም</th><th>Relationship / ዝምድና</th></tr>
        </thead>
        <tbody>
          ${familyMembers.map(member => `
            <tr>
              <td>
                ${member.name || ''}
                ${member.name_am ? `<br/><small class="font-ethiopic">${member.name_am}</small>` : ''}
              </td>
              <td>${member.relationship || 'Family Member'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}
    
    <div class="signature-section">
      <div class="signature-box">
        <div class="signature-line"></div>
        <div class="signature-label">KEBELE ADMINISTRATOR'S SIGNATURE</div>
        <div class="signature-label am">የቀበሌ አስተዳዳሪ ፊርማ</div>
      </div>
      <div class="signature-box">
        <div class="signature-line"></div>
        <div class="signature-label">RESIDENT'S SIGNATURE</div>
        <div class="signature-label am">የነዋሪ ፊርማ</div>
      </div>
    </div>
    
    <div class="footer">
      <p>This certificate confirms the resident has been cleared for transfer to the specified kebele.</p>
      <p>ይህ ሰርትፊኬት ነዋሪው ወደተገለጸው ቀበሌ ለመዘዋወር መፈቀዱን ያረጋግጣል።</p>
      <p>Issued on: ${fmt(issueDate)}</p>
    </div>
  </div>
</div>
<div class="print-bar no-print">
  <button onclick="window.print()">🖨️ PRINT CERTIFICATE</button>
  <button onclick="window.close()">✕ CLOSE</button>
</div>
</body>
</html>`;
}
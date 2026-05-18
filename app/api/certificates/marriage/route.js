import { NextResponse } from 'next/server';
import { getClient } from '@/_lib/db';
import { getSession } from '@/_lib/auth';
import { gregorianToEthiopian, getCurrentEthiopianDate, ethiopianToGregorian } from '@/utils/calendar';

export async function POST(request) {
  const client = await getClient();
  
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Received marriage certificate data:', JSON.stringify(body, null, 2));
    
    // ── Validate required fields ──────────────────────────────────────────────
    if (!body.husband_name || !body.wife_name || !body.marriage_date_gc) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: husband_name, wife_name, and marriage_date_gc are required'
      }, { status: 400 });
    }
    
    // ── Calendar conversion for marriage date ─────────────────────────────────
    let marriageDateGc = body.marriage_date_gc;
    let marriageDateEc = body.marriage_date_ec;
    if (marriageDateGc && !marriageDateEc) {
      const ec = gregorianToEthiopian(marriageDateGc);
      if (ec) marriageDateEc = ec.formattedEc;
    }
    
    // ── Birth date conversion for wife ────────────────────────────────────────
    let wifeBirthGc = body.wife_birth_date_gc || null;
    let wifeBirthEc = body.wife_birth_date_ec || null;
    if (wifeBirthGc && !wifeBirthEc) {
      const ec = gregorianToEthiopian(wifeBirthGc);
      if (ec) wifeBirthEc = ec.formattedEc;
    }
    if (!wifeBirthGc && wifeBirthEc) {
      const gc = ethiopianToGregorian(wifeBirthEc);
      if (gc) wifeBirthGc = gc.formatted;
    }
    
    // ── Birth date conversion for husband ──────────────────────────────────────
    let husbandBirthGc = body.husband_birth_date_gc || null;
    let husbandBirthEc = body.husband_birth_date_ec || null;
    if (husbandBirthGc && !husbandBirthEc) {
      const ec = gregorianToEthiopian(husbandBirthGc);
      if (ec) husbandBirthEc = ec.formattedEc;
    }
    if (!husbandBirthGc && husbandBirthEc) {
      const gc = ethiopianToGregorian(husbandBirthEc);
      if (gc) husbandBirthGc = gc.formatted;
    }
    
    // ── Handle photo Base64 to BYTEA conversion ────────────────────────────────
    let husbandPhotoBuffer = null;
    let wifePhotoBuffer = null;
    
    if (body.husband_photo && body.husband_photo.startsWith('data:image')) {
      const base64Data = body.husband_photo.split(',')[1];
      husbandPhotoBuffer = Buffer.from(base64Data, 'base64');
    }
    if (body.wife_photo && body.wife_photo.startsWith('data:image')) {
      const base64Data = body.wife_photo.split(',')[1];
      wifePhotoBuffer = Buffer.from(base64Data, 'base64');
    }
    
    // ── Registration meta ─────────────────────────────────────────────────────
    const registrationNumber = body.registration_number?.trim()
      || `MRG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const registrationEc = getCurrentEthiopianDate();
    
    await client.query('BEGIN');
    
    // ✅ CORRECTED INSERT STATEMENT - 50 columns matching your database
    const result = await client.query(
      `INSERT INTO marriage_certificate (
        registration_number,
        husband_name,
        husband_name_am,
        husband_id_number,
        wife_name,
        wife_name_am,
        wife_id_number,
        marriage_date_gc,
        marriage_date_ec,
        ceremony_place,
        ceremony_type,
        witness1_name,
        witness2_name,
        registration_date_gc,
        registration_date_ec,
        registrar_name,
        issued_by,
        form_number,
        wife_birth_reg_number,
        husband_birth_reg_number,
        wife_father_name,
        wife_grandfather_name,
        wife_birth_date_gc,
        wife_birth_date_ec,
        wife_nationality,
        husband_father_name,
        husband_grandfather_name,
        husband_birth_date_gc,
        husband_birth_date_ec,
        husband_nationality,
        marriage_place,
        marriage_place_am,
        zone,
        woreda,
        sub_city,
        kebele,
        issue_date,
        registrar_father_name,
        registrar_grandfather_name,
        registrar_km,
        husband_resident_id,
        wife_resident_id,
        status,
        husband_photo,
        wife_photo,
        witness1_name_am,
        witness2_name_am,
        registrar_name_am,
        created_at,
        updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
        $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,
        $31,$32,$33,$34,$35,$36,$37,$38,$39,$40,
        $41,$42,$43,$44,$45,$46,$47,$48,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING marriage_id, registration_number`,
      [
        registrationNumber,                                    // $1
        body.husband_name,                                     // $2
        body.husband_name_am                        || null,   // $3
        null,                                                  // $4 - husband_id_number (not used)
        body.wife_name,                                        // $5
        body.wife_name_am                           || null,   // $6
        null,                                                  // $7 - wife_id_number (not used)
        marriageDateGc,                                        // $8
        marriageDateEc,                                        // $9
        body.marriage_place                         || null,   // $10 - ceremony_place
        null,                                                  // $11 - ceremony_type
        body.witness1_name                          || null,   // $12
        body.witness2_name                          || null,   // $13
        new Date().toISOString().split('T')[0],                // $14
        registrationEc.formattedEc,                            // $15
        body.registrar_name                         || session.user?.full_name || 'System', // $16
        session.staff_id,                                      // $17
        body.form_number?.trim()                    || null,   // $18
        body.wife_birth_reg_number?.trim()          || null,   // $19
        body.husband_birth_reg_number?.trim()       || null,   // $20
        body.wife_father_name                       || null,   // $21
        body.wife_grandfather_name                  || null,   // $22
        wifeBirthGc,                                           // $23
        wifeBirthEc,                                           // $24
        body.wife_nationality                       || 'Ethiopian', // $25
        body.husband_father_name                    || null,   // $26
        body.husband_grandfather_name               || null,   // $27
        husbandBirthGc,                                        // $28
        husbandBirthEc,                                        // $29
        body.husband_nationality                    || 'Ethiopian', // $30
        body.marriage_place                         || null,   // $31
        body.marriage_place_am                      || null,   // $32
        body.zone                                   || null,   // $33
        body.woreda                                 || null,   // $34
        body.sub_city                               || null,   // $35
        body.kebele                                 || null,   // $36
        body.issue_date || new Date().toISOString().split('T')[0], // $37
        body.registrar_father_name?.trim()          || null,   // $38
        body.registrar_grandfather_name?.trim()     || null,   // $39
        body.registrar_km?.trim()                   || null,   // $40
        body.husband_resident_id                    || null,   // $41
        body.wife_resident_id                       || null,   // $42
        'issued',                                              // $43
        husbandPhotoBuffer,                                    // $44
        wifePhotoBuffer,                                       // $45
        body.witness1_name_am                       || null,   // $46
        body.witness2_name_am                       || null,   // $47
        body.registrar_name_am                      || null    // $48
      ]
    );
    
    const certificateId = result.rows[0].marriage_id;
    console.log('✅ Marriage certificate created with ID:', certificateId);
    
    // ── Service request for husband ───────────────────────────────────────────
    if (body.husband_resident_id) {
      try {
        const svcRes = await client.query(
          `SELECT service_id FROM service WHERE service_name = 'Marriage Certificate Issuance'`
        );
        if (svcRes.rows.length > 0) {
          await client.query(
            `INSERT INTO service_request (resident_id, service_id, status, request_date, notes)
             VALUES ($1, $2, 'completed', CURRENT_TIMESTAMP, $3)`,
            [body.husband_resident_id, svcRes.rows[0].service_id, 
             `Marriage certificate issued for ${body.husband_name} & ${body.wife_name}, Registration: ${registrationNumber}`]
          );
        }
      } catch (svcErr) {
        console.warn('⚠️ Service request for husband failed:', svcErr.message);
      }
    }
    
    // ── Service request for wife ──────────────────────────────────────────────
    if (body.wife_resident_id) {
      try {
        const svcRes = await client.query(
          `SELECT service_id FROM service WHERE service_name = 'Marriage Certificate Issuance'`
        );
        if (svcRes.rows.length > 0) {
          await client.query(
            `INSERT INTO service_request (resident_id, service_id, status, request_date, notes)
             VALUES ($1, $2, 'completed', CURRENT_TIMESTAMP, $3)`,
            [body.wife_resident_id, svcRes.rows[0].service_id,
             `Marriage certificate issued for ${body.husband_name} & ${body.wife_name}, Registration: ${registrationNumber}`]
          );
        }
      } catch (svcErr) {
        console.warn('⚠️ Service request for wife failed:', svcErr.message);
      }
    }
    
    // ── Update marital status for both parties ────────────────────────────────
    if (body.husband_resident_id) {
      await client.query(
        `UPDATE resident SET marital_status = 'Married', updated_at = NOW() WHERE resident_id = $1`,
        [body.husband_resident_id]
      );
    }
    if (body.wife_resident_id) {
      await client.query(
        `UPDATE resident SET marital_status = 'Married', updated_at = NOW() WHERE resident_id = $1`,
        [body.wife_resident_id]
      );
    }
    
    await client.query('COMMIT');
    console.log('✅ Transaction committed. Certificate ID:', certificateId);
    
    return NextResponse.json({
      success: true,
      certificate_id: certificateId,
      marriage_id: certificateId,
      registration_number: result.rows[0].registration_number,
      message: 'Marriage certificate issued successfully'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating marriage certificate:', error.message);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create certificate: ' + error.message 
    }, { status: 500 });
  } finally {
    client.release();
  }
}

// ── GET endpoint for fetching certificates (with photo Base64 conversion) ─────
export async function GET(request) {
  const client = await getClient();
  
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const registrationNumber = searchParams.get('registrationNumber');
    
    let query = '';
    let params = [];
    
    if (id) {
      query = `SELECT * FROM marriage_certificate WHERE marriage_id = $1`;
      params = [id];
    } else if (registrationNumber) {
      query = `SELECT * FROM marriage_certificate WHERE registration_number = $1`;
      params = [registrationNumber];
    } else {
      return NextResponse.json(
        { error: 'Either id or registrationNumber is required' },
        { status: 400 }
      );
    }
    
    const result = await client.query(query, params);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Marriage certificate not found' }, { status: 404 });
    }
    
    const certificate = result.rows[0];
    
    // ✅ Convert BYTEA photos to Base64 for display in certificate print
    if (certificate.husband_photo) {
      certificate.husband_photo = `data:image/jpeg;base64,${Buffer.from(certificate.husband_photo).toString('base64')}`;
    }
    if (certificate.wife_photo) {
      certificate.wife_photo = `data:image/jpeg;base64,${Buffer.from(certificate.wife_photo).toString('base64')}`;
    }
    
    return NextResponse.json({
      success: true,
      certificate: certificate
    });
    
  } catch (error) {
    console.error('Error fetching marriage certificate:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch certificate: ' + error.message 
    }, { status: 500 });
  } finally {
    client.release();
  }
}
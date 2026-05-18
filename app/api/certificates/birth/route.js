// app/api/certificates/birth/route.js
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
    console.log('Received birth certificate data:', body);
    
    // ── Validate required fields ──────────────────────────────────────────────
    const requiredFields = ['child_first_name', 'child_father_name', 'child_grandfather_name'];
    const missingFields = requiredFields.filter(f => !body[f]?.trim());
    if (missingFields.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }
    
    if (!body.sex) {
      return NextResponse.json({ success: false, error: 'Sex is required' }, { status: 400 });
    }
    
    // ── Calendar conversion ───────────────────────────────────────────────────
    let birthDateGc = body.birth_date_gc;
    let birthDateEc = body.birth_date_ec;
    
    if (!birthDateGc && !birthDateEc) {
      return NextResponse.json({ 
        success: false, 
        error: 'Birth date is required (either Gregorian or Ethiopian calendar)' 
      }, { status: 400 });
    }
    
    if (birthDateGc && !birthDateEc) {
      const ecDate = gregorianToEthiopian(birthDateGc);
      if (ecDate) birthDateEc = ecDate.formattedEc;
    }
    if (!birthDateGc && birthDateEc) {
      const gcDate = ethiopianToGregorian(birthDateEc);
      if (gcDate) birthDateGc = gcDate.formatted;
    }
    
    // ── Parent resolution (DB record vs manual entry) ─────────────────────────
    let motherFullName   = null, motherFullNameAm = null, motherId = null;
    let fatherFullName   = null, fatherFullNameAm = null, fatherId = null;
    
    if (body.mother_not_found) {
      motherFullName   = body.mother_manual_name?.trim()    || null;
      motherFullNameAm = body.mother_manual_name_am?.trim() || null;
      motherId         = body.mother_manual_id?.trim()      || null;
    } else {
      motherFullName   = body.mother_full_name?.trim()    || null;
      motherFullNameAm = body.mother_full_name_am?.trim() || null;
      motherId         = body.mother_id                   || null;
    }
    
    if (body.father_not_found) {
      fatherFullName   = body.father_manual_name?.trim()    || null;
      fatherFullNameAm = body.father_manual_name_am?.trim() || null;
      fatherId         = body.father_manual_id?.trim()      || null;
    } else {
      fatherFullName   = body.father_full_name?.trim()    || null;
      fatherFullNameAm = body.father_full_name_am?.trim() || null;
      fatherId         = body.father_id                   || null;
    }
    
    // ── Registration meta ─────────────────────────────────────────────────────
    const registrationNumber = body.registration_number?.trim()
      || `BTH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const registrationEc = getCurrentEthiopianDate();
    
    await client.query('BEGIN');
    
    const result = await client.query(
      `INSERT INTO birth_certificate (
        registration_number,
        form_number,
        child_first_name,
        child_first_name_am,
        child_father_name,
        child_father_name_am,
        child_grandfather_name,
        child_grandfather_name_am,
        sex,
        birth_date_gc,
        birth_date_ec,
        birth_place,
        birth_place_am,
        region,
        region_am,
        zone,
        sub_city,
        sub_city_am,
        woreda,
        kebele,
        nationality,
        mother_full_name,
        mother_full_name_am,
        mother_nationality,
        mother_id,
        father_full_name,
        father_full_name_am,
        father_nationality,
        father_id,
        registration_date_gc,
        registration_date_ec,
        issue_date,
        registrar_name,
        registrar_father_name,
        registrar_grandfather_name,
        registrar_km,
        issued_by,
        mother_not_found,
        father_not_found,
        created_at,
        updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
        $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,
        $31,$32,$33,$34,$35,$36,$37,$38,$39,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING birth_id, registration_number`,
      [
        registrationNumber,                              // $1
        body.form_number?.trim()              || null,  // $2
        body.child_first_name?.trim(),                  // $3
        body.child_first_name_am?.trim()      || null,  // $4
        body.child_father_name?.trim(),                 // $5
        body.child_father_name_am?.trim()     || null,  // $6
        body.child_grandfather_name?.trim()   || null,  // $7
        body.child_grandfather_name_am?.trim()|| null,  // $8
        body.sex,                                       // $9
        birthDateGc,                                    // $10
        birthDateEc,                                    // $11
        body.birth_place?.trim()              || null,  // $12
        body.birth_place_am?.trim()           || null,  // $13
        body.region?.trim()                   || null,  // $14
        body.region_am?.trim()                || null,  // $15
        body.zone?.trim()                     || null,  // $16
        body.sub_city?.trim()                 || null,  // $17
        body.sub_city_am?.trim()              || null,  // $18
        body.woreda?.trim()                   || null,  // $19
        body.kebele?.trim()                   || null,  // $20
        body.nationality                      || 'Ethiopian', // $21
        motherFullName,                                 // $22
        motherFullNameAm,                               // $23
        body.mother_nationality               || 'Ethiopian', // $24
        motherId,                                       // $25
        fatherFullName,                                 // $26
        fatherFullNameAm,                               // $27
        body.father_nationality               || 'Ethiopian', // $28
        fatherId,                                       // $29
        new Date().toISOString().split('T')[0],         // $30
        registrationEc.formattedEc,                     // $31
        body.issue_date                       || new Date().toISOString().split('T')[0], // $32
        body.registrar_name?.trim()           || session.user?.full_name || 'System', // $33
        body.registrar_father_name?.trim()    || null,  // $34
        body.registrar_grandfather_name?.trim()|| null, // $35
        body.registrar_km?.trim()             || null,  // $36
        session.staff_id,                               // $37
        body.mother_not_found                 || false, // $38
        body.father_not_found                 || false, // $39
      ]
    );
    
    // ── Optional service request ──────────────────────────────────────────────
    try {
      const svcRes = await client.query(
        `SELECT service_id FROM service WHERE service_name = 'Birth Certificate Issuance'`
      );
      if (svcRes.rows.length > 0) {
        const residentId = body.verified_resident_id || motherId || fatherId || null;
        await client.query(
          `INSERT INTO service_request (resident_id, service_id, status, request_date, notes)
           VALUES ($1, $2, 'completed', CURRENT_TIMESTAMP, $3)`,
          [
            residentId,
            svcRes.rows[0].service_id,
            `Birth certificate issued for ${body.child_first_name} ${body.child_father_name}`
          ]
        );
      }
    } catch (svcErr) {
      console.warn('Service request insertion failed:', svcErr.message);
    }
    
    await client.query('COMMIT');
    
    return NextResponse.json({
      success: true,
      certificate_id: result.rows[0].birth_id,
      registration_number: result.rows[0].registration_number,
      message: 'Birth certificate issued successfully'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating birth certificate:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create certificate: ' + error.message 
    }, { status: 500 });
  } finally {
    client.release();
  }
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(request) {
  const client = await getClient();
  
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id                 = searchParams.get('id');
    const registrationNumber = searchParams.get('registrationNumber');
    
    let query = '', params = [];
    if (id) {
      query  = `SELECT * FROM birth_certificate WHERE birth_id = $1`;
      params = [id];
    } else if (registrationNumber) {
      query  = `SELECT * FROM birth_certificate WHERE registration_number = $1`;
      params = [registrationNumber];
    } else {
      return NextResponse.json(
        { error: 'Either id or registrationNumber is required' },
        { status: 400 }
      );
    }
    
    const result = await client.query(query, params);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Birth certificate not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, certificate: result.rows[0] });
    
  } catch (error) {
    console.error('Error fetching birth certificate:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch certificate: ' + error.message 
    }, { status: 500 });
  } finally {
    client.release();
  }
}
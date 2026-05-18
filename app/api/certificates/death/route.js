// app/api/certificates/death/route.js
import { NextResponse } from 'next/server';
import { getClient } from '@/_lib/db';
import { getSession } from '@/_lib/auth';
import { gregorianToEthiopian, getCurrentEthiopianDate, ethiopianToGregorian } from '@/utils/calendar';

export async function POST(request) {
  const client = await getClient();
  
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Received death certificate data:', JSON.stringify(body, null, 2));
    
    // ── Validate required fields ──────────────────────────────────────────────
    if (!body.deceased_name || !body.death_date_gc) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: deceased_name and death_date_gc are required'
      }, { status: 400 });
    }
    
    // ── Calendar conversion ───────────────────────────────────────────────────
    let deathDateGc = body.death_date_gc;
    let deathDateEc = body.death_date_ec;
    if (deathDateGc && !deathDateEc) {
      const ec = gregorianToEthiopian(deathDateGc);
      if (ec) deathDateEc = ec.formattedEc;
    }

    // Birth date conversion for the deceased
    let birthDateGc = body.birth_date_gc || null;
    let birthDateEc = body.birth_date_ec || null;
    if (birthDateGc && !birthDateEc) {
      const ec = gregorianToEthiopian(birthDateGc);
      if (ec) birthDateEc = ec.formattedEc;
    }

    // Burial date conversion
    let burialDateGc = body.burial_date_gc || null;
    let burialDateEc = body.burial_date_ec || null;
    if (burialDateGc && !burialDateEc) {
      const ec = gregorianToEthiopian(burialDateGc);
      if (ec) burialDateEc = ec.formattedEc;
    }
    
    // ── Registration meta ─────────────────────────────────────────────────────
    const registrationNumber = body.registration_number?.trim()
      || `DTH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const registrationEc = getCurrentEthiopianDate();
    
    await client.query('BEGIN');
    
    // ── 1. INSERT DEATH CERTIFICATE ───────────────────────────────────────────
    const result = await client.query(
      `INSERT INTO death_certificate (
        registration_number,
        form_number,
        birth_registration_number,
        deceased_name,
        deceased_name_am,
        deceased_father_name,
        deceased_father_name_am,
        deceased_grandfather_name,
        deceased_grandfather_name_am,
        title,
        sex,
        nationality,
        birth_date_gc,
        birth_date_ec,
        death_date_gc,
        death_date_ec,
        place_of_death,
        place_of_death_am,
        cause_of_death,
        cause_of_death_am,
        reporter_name,
        reporter_name_am,
        reporter_relation,
        reporter_relation_am,
        reporter_phone,
        reporter_address,
        reporter_address_am,
        burial_place,
        burial_place_am,
        burial_date_gc,
        burial_date_ec,
        registration_date_gc,
        registration_date_ec,
        issue_date,
        registrar_name,
        registrar_name_am,
        registrar_father_name,
        registrar_grandfather_name,
        registrar_km,
        resident_id,
        issued_by,
        status,
        created_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
        $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,
        $31,$32,$33,$34,$35,$36,$37,$38,$39,$40,
        $41,'issued', NOW()
      )
      RETURNING death_id`,
      [
        registrationNumber,                                    // $1
        body.form_number?.trim()               || null,       // $2
        body.birth_registration_number?.trim() || null,       // $3
        body.deceased_name,                                    // $4
        body.deceased_name_am                  || null,       // $5
        body.deceased_father_name              || null,       // $6
        body.deceased_father_name_am           || null,       // $7
        body.deceased_grandfather_name         || null,       // $8
        body.deceased_grandfather_name_am      || null,       // $9
        body.title                             || null,       // $10
        body.sex                               || null,       // $11
        body.nationality                       || 'Ethiopian',// $12
        birthDateGc,                                          // $13
        birthDateEc,                                          // $14
        deathDateGc,                                          // $15
        deathDateEc,                                          // $16
        body.place_of_death                    || null,       // $17
        body.place_of_death_am                 || null,       // $18
        body.cause_of_death                    || null,       // $19
        body.cause_of_death_am                 || null,       // $20
        body.reporter_name                     || null,       // $21
        body.reporter_name_am                  || null,       // $22
        body.reporter_relation                 || null,       // $23
        body.reporter_relation_am              || null,       // $24
        body.reporter_phone                    || null,       // $25
        body.reporter_address                  || null,       // $26
        body.reporter_address_am               || null,       // $27
        body.burial_place                      || null,       // $28
        body.burial_place_am                   || null,       // $29
        burialDateGc,                                         // $30
        burialDateEc,                                         // $31
        new Date().toISOString().split('T')[0],               // $32
        registrationEc.formattedEc,                           // $33
        body.issue_date || new Date().toISOString().split('T')[0], // $34
        body.registrar_name                    || session.user?.full_name || 'System', // $35
        body.registrar_name_am                 || null,       // $36
        body.registrar_father_name?.trim()     || null,       // $37
        body.registrar_grandfather_name?.trim()|| null,       // $38
        body.registrar_km?.trim()              || null,       // $39
        body.resident_id                       || null,       // $40
        session.staff_id,                                     // $41
      ]
    );
    
    const certificateId = result.rows[0].death_id;
    console.log('✅ Death certificate created with ID:', certificateId);
    
    // ── 2. DEACTIVATE RESIDENT ────────────────────────────────────────────────
    if (body.resident_id) {
      await client.query(
        `UPDATE resident 
         SET is_active = false, status = 'deceased', updated_at = NOW()
         WHERE resident_id = $1`,
        [body.resident_id]
      );
      await client.query(
        `UPDATE id_card 
         SET status = 'expired', updated_at = NOW()
         WHERE resident_id = $1 AND status = 'active'`,
        [body.resident_id]
      );
      console.log('✅ Resident and ID cards deactivated:', body.resident_id);
    }
    
    // ── 3. SERVICE REQUEST ────────────────────────────────────────────────────
    try {
      const svcRes = await client.query(
        `SELECT service_id FROM service WHERE service_name = $1`,
        ['Death Certificate Registration']
      );
      let serviceId = svcRes.rows[0]?.service_id || null;
      if (!serviceId) {
        const fb = await client.query(`SELECT service_id FROM service WHERE service_id = 3`);
        serviceId = fb.rows[0]?.service_id || null;
      }
      
      if (serviceId) {
        const requestNumber = `SR-${Date.now()}-${body.resident_id || certificateId}`;
        const existing = await client.query(
          `SELECT request_id FROM service_request 
           WHERE resident_id = $1 AND service_id = $2 AND status = 'pending'`,
          [body.resident_id, serviceId]
        );
        
        if (existing.rows.length > 0) {
          await client.query(
            `UPDATE service_request 
             SET status = 'completed', completed_date = NOW(), notes = $2
             WHERE request_id = $1`,
            [existing.rows[0].request_id, `Death certificate issued for ${body.deceased_name}`]
          );
        } else {
          await client.query(
            `INSERT INTO service_request (request_number, service_id, resident_id, status, request_date, notes)
             VALUES ($1, $2, $3, 'completed', NOW(), $4)`,
            [requestNumber, serviceId, body.resident_id || null, `Death certificate issued for ${body.deceased_name}`]
          );
        }
      }
    } catch (svcErr) {
      console.warn('⚠️ Could not create service request:', svcErr.message);
    }
    
    await client.query('COMMIT');
    console.log('✅ Transaction committed. Certificate ID:', certificateId);
    
    return NextResponse.json({
      success: true,
      certificate_id: certificateId,
      death_id: certificateId,
      message: 'Death certificate created successfully. Resident has been deactivated.'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating death certificate:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create death certificate'
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
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    let queryText = `
      SELECT
        death_id, registration_number, form_number, birth_registration_number,
        deceased_name, deceased_name_am,
        deceased_father_name, deceased_father_name_am,
        deceased_grandfather_name, deceased_grandfather_name_am,
        title, sex, nationality,
        birth_date_gc, birth_date_ec,
        death_date_gc, death_date_ec,
        place_of_death, place_of_death_am,
        cause_of_death, cause_of_death_am,
        reporter_name, reporter_name_am,
        reporter_relation, reporter_relation_am,
        reporter_phone, reporter_address, reporter_address_am,
        burial_place, burial_place_am,
        burial_date_gc, burial_date_ec,
        registration_date_gc, registration_date_ec,
        issue_date,
        registrar_name, registrar_name_am,
        registrar_father_name, registrar_grandfather_name, registrar_km,
        resident_id, status, created_at
      FROM death_certificate
    `;
    const params = [];
    if (id) {
      queryText += ` WHERE death_id = $1`;
      params.push(parseInt(id));
    }
    queryText += ` ORDER BY death_id DESC`;
    
    const result = await client.query(queryText, params);
    return NextResponse.json({ success: true, certificates: result.rows });
    
  } catch (error) {
    console.error('Error fetching death certificates:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
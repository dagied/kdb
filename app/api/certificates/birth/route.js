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
    
    // Validate ONLY required fields (parent names are NOT required)
    const requiredFields = [
      'child_first_name', 
      'child_father_name'  // Child's father name is required for the child's identification
    ];
    
    const missingFields = requiredFields.filter(field => !body[field]?.trim());
    
    if (missingFields.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }
    
    // Validate birth date
    let birthDateGc = body.birth_date_gc;
    let birthDateEc = body.birth_date_ec;
    
    if (!birthDateGc && !birthDateEc) {
      return NextResponse.json({ 
        success: false, 
        error: 'Birth date is required (either Gregorian or Ethiopian calendar)' 
      }, { status: 400 });
    }
    
    // Convert between calendars if needed
    if (birthDateGc && !birthDateEc) {
      const ecDate = gregorianToEthiopian(birthDateGc);
      if (ecDate) {
        birthDateEc = ecDate.formattedEc;
      }
    }
    
    if (!birthDateGc && birthDateEc) {
      const gcDate = ethiopianToGregorian(birthDateEc);
      if (gcDate) {
        birthDateGc = gcDate.formatted;
      }
    }
    
    // Generate unique registration number
    const registrationNumber = `BTH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const registrationEc = getCurrentEthiopianDate();
    
    await client.query('BEGIN');
    
    const result = await client.query(
      `INSERT INTO birth_certificate (
        registration_number, 
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
        region, 
        zone, 
        woreda, 
        nationality,
        mother_full_name, 
        mother_full_name_am, 
        mother_nationality,
        father_full_name, 
        father_full_name_am, 
        father_nationality,
        registration_date_gc, 
        registration_date_ec, 
        registrar_name, 
        issued_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
      RETURNING birth_id, registration_number`,
      [
        registrationNumber,
        body.child_first_name?.trim(), 
        body.child_first_name_am?.trim() || null,
        body.child_father_name?.trim(), 
        body.child_father_name_am?.trim() || null,
        body.child_grandfather_name?.trim() || null, 
        body.child_grandfather_name_am?.trim() || null,
        body.sex || null,
        birthDateGc, 
        birthDateEc,
        body.birth_place?.trim() || null, 
        body.region?.trim() || null, 
        body.zone?.trim() || null, 
        body.woreda?.trim() || null,
        body.nationality || 'Ethiopian',
        body.mother_full_name?.trim() || null,  // ✅ Now optional - allows NULL
        body.mother_full_name_am?.trim() || null, 
        body.mother_nationality || 'Ethiopian',
        body.father_full_name?.trim() || null,  // ✅ Now optional - allows NULL
        body.father_full_name_am?.trim() || null, 
        body.father_nationality || 'Ethiopian',
        new Date().toISOString().split('T')[0], 
        registrationEc.formattedEc,
        body.registrar_name?.trim() || session.user?.full_name || 'System', 
        session.staff_id
      ]
    );
    
    // Add service request for AI prediction (optional)
    try {
      const serviceResult = await client.query(
        `SELECT service_id FROM service WHERE service_name = 'Birth Certificate Issuance'`
      );
      if (serviceResult.rows.length > 0) {
        await client.query(
          `INSERT INTO service_request (resident_id, service_id, status, request_date, notes)
           VALUES ($1, $2, 'completed', CURRENT_TIMESTAMP, $3)`,
          [body.mother_id || null, serviceResult.rows[0].service_id, `Birth certificate issued for ${body.child_first_name} ${body.child_father_name}`]
        );
      }
    } catch (serviceError) {
      console.warn('Service request insertion failed:', serviceError.message);
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
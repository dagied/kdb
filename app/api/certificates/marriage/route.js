import { NextResponse } from 'next/server';
import { getClient } from '@/_lib/db';
import { getSession } from '@/_lib/auth';
import { gregorianToEthiopian, getCurrentEthiopianDate } from '@/utils/calendar';

export async function POST(request) {
  const client = await getClient();
  
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Generate unique registration number
    const registrationNumber = `MRG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Get Ethiopian dates
    const marriageEc = gregorianToEthiopian(body.marriage_date_gc);
    const registrationEc = getCurrentEthiopianDate();
    
    await client.query('BEGIN');
    
    const result = await client.query(
      `INSERT INTO marriage_certificate (
        registration_number, husband_name, husband_name_am, husband_id_number,
        wife_name, wife_name_am, wife_id_number, marriage_date_gc, marriage_date_ec,
        ceremony_place, ceremony_type, witness1_name, witness2_name,
        registration_date_gc, registration_date_ec, registrar_name, issued_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING marriage_id, registration_number`,
      [
        registrationNumber,
        body.husband_name, body.husband_name_am, body.husband_id_number,
        body.wife_name, body.wife_name_am, body.wife_id_number,
        body.marriage_date_gc, marriageEc.formattedEc,
        body.ceremony_place, body.ceremony_type,
        body.witness1_name, body.witness2_name,
        new Date().toISOString().split('T')[0], registrationEc.formattedEc,
        body.registrar_name, session.staff_id
      ]
    );
    
    // ✅ ADD SERVICE REQUEST - Marriage Certificate for Husband
    if (body.husband_resident_id) {
      await client.query(
        `INSERT INTO service_request (resident_id, service_id, status, request_date, notes)
         VALUES ($1, (SELECT service_id FROM service WHERE service_name = 'Marriage Certificate Issuance'), 'completed', CURRENT_TIMESTAMP, $2)`,
        [body.husband_resident_id, `Marriage certificate issued for ${body.husband_name} & ${body.wife_name}, Registration: ${registrationNumber}`]
      );
    }
    
    // ✅ ADD SERVICE REQUEST - Marriage Certificate for Wife
    if (body.wife_resident_id) {
      await client.query(
        `INSERT INTO service_request (resident_id, service_id, status, request_date, notes)
         VALUES ($1, (SELECT service_id FROM service WHERE service_name = 'Marriage Certificate Issuance'), 'completed', CURRENT_TIMESTAMP, $2)`,
        [body.wife_resident_id, `Marriage certificate issued for ${body.husband_name} & ${body.wife_name}, Registration: ${registrationNumber}`]
      );
    }
    
    // Update marital status for both parties if resident IDs are provided
    if (body.husband_resident_id) {
      await client.query(
        `UPDATE resident SET marital_status = 'Married' WHERE resident_id = $1`,
        [body.husband_resident_id]
      );
    }
    if (body.wife_resident_id) {
      await client.query(
        `UPDATE resident SET marital_status = 'Married' WHERE resident_id = $1`,
        [body.wife_resident_id]
      );
    }
    
    await client.query('COMMIT');
    
    return NextResponse.json({
      success: true,
      certificate_id: result.rows[0].marriage_id,
      registration_number: result.rows[0].registration_number,
      message: 'Marriage certificate issued successfully'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating marriage certificate:', error);
    return NextResponse.json({ error: 'Failed to create certificate' }, { status: 500 });
  } finally {
    client.release();
  }
}
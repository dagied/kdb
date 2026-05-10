// app/api/certificates/death/route.js
import { NextResponse } from 'next/server';
import { getClient } from '@/_lib/db';
import { getSession } from '@/_lib/auth';

export async function POST(request) {
  const client = await getClient();
  
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    console.log('Received death certificate data:', JSON.stringify(body, null, 2));
    
    const {
      resident_id,
      registration_number,
      deceased_name,
      deceased_name_am,
      deceased_father_name,
      deceased_father_name_am,
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
      registrar_name,
      registrar_name_am,
      burial_place,
      burial_place_am,
      burial_date_gc,
      burial_date_ec
    } = body;
    
    // Validate required fields
    if (!deceased_name || !death_date_gc) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: deceased_name and death_date_gc are required'
      }, { status: 400 });
    }
    
    await client.query('BEGIN');
    
    // ✅ 1. INSERT DEATH CERTIFICATE
    const result = await client.query(
      `INSERT INTO death_certificate (
        registration_number,
        deceased_name,
        deceased_name_am,
        deceased_father_name,
        deceased_father_name_am,
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
        registrar_name,
        registrar_name_am,
        burial_place,
        burial_place_am,
        burial_date_gc,
        burial_date_ec,
        resident_id,
        status,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, 'issued', NOW())
      RETURNING death_id`,
      [
        registration_number,
        deceased_name,
        deceased_name_am || null,
        deceased_father_name || null,
        deceased_father_name_am || null,
        death_date_gc,
        death_date_ec || null,
        place_of_death || null,
        place_of_death_am || null,
        cause_of_death || null,
        cause_of_death_am || null,
        reporter_name || null,
        reporter_name_am || null,
        reporter_relation || null,
        reporter_relation_am || null,
        reporter_phone || null,
        reporter_address || null,
        reporter_address_am || null,
        registrar_name || null,
        registrar_name_am || null,
        burial_place || null,
        burial_place_am || null,
        burial_date_gc || null,
        burial_date_ec || null,
        resident_id || null
      ]
    );
    
    const certificateId = result.rows[0].death_id;
    console.log('✅ Death certificate created with ID:', certificateId);
    
    // ✅ 2. DEACTIVATE THE RESIDENT IF resident_id IS PROVIDED
    if (resident_id) {
      await client.query(
        `UPDATE resident 
         SET is_active = false, 
             status = 'deceased',
             updated_at = NOW()
         WHERE resident_id = $1`,
        [resident_id]
      );
      console.log('✅ Resident deactivated:', resident_id);
      
      // Also deactivate any active ID cards for this resident
      await client.query(
        `UPDATE id_card 
         SET status = 'expired', 
             updated_at = NOW()
         WHERE resident_id = $1 AND status = 'active'`,
        [resident_id]
      );
      console.log('✅ ID cards deactivated for resident:', resident_id);
    }
    
    // ✅ 3. CREATE SERVICE REQUEST FOR DEATH CERTIFICATE
    try {
      // Get the service ID for Death Certificate Registration
      const serviceResult = await client.query(
        `SELECT service_id FROM service WHERE service_name = $1`,
        ['Death Certificate Registration']
      );
      
      let serviceId = null;
      if (serviceResult.rows.length > 0) {
        serviceId = serviceResult.rows[0].service_id;
      } else {
        // Fallback: try to get by service_id = 3
        const fallbackResult = await client.query(
          `SELECT service_id FROM service WHERE service_id = $1`,
          [3]
        );
        if (fallbackResult.rows.length > 0) {
          serviceId = fallbackResult.rows[0].service_id;
        }
      }
      
      if (serviceId) {
        const requestNumber = `SR-${Date.now()}-${resident_id || certificateId}`;
        
        // Check if there's already a pending request
        const existingRequest = await client.query(
          `SELECT request_id FROM service_request 
           WHERE resident_id = $1 AND service_id = $2 AND status = 'pending'`,
          [resident_id, serviceId]
        );
        
        if (existingRequest.rows.length > 0) {
          // Update existing request to completed
          await client.query(
            `UPDATE service_request 
             SET status = 'completed', 
                 completed_date = NOW(),
                 notes = $3
             WHERE request_id = $1`,
            [existingRequest.rows[0].request_id, `Death certificate issued for ${deceased_name}`]
          );
          console.log('✅ Updated existing service request to completed');
        } else {
          // Create new service request
          await client.query(
            `INSERT INTO service_request (
              request_number, service_id, resident_id, status, request_date, notes
            ) VALUES ($1, $2, $3, 'completed', NOW(), $4)`,
            [
              requestNumber,
              serviceId,
              resident_id || null,
              `Death certificate issued for ${deceased_name}`
            ]
          );
          console.log('✅ Service request created for death certificate:', requestNumber);
        }
      } else {
        console.warn('⚠️ Service "Death Certificate Registration" not found');
      }
    } catch (serviceError) {
      console.warn('⚠️ Could not create service request:', serviceError.message);
    }
    
    await client.query('COMMIT');
    
    console.log('✅ Transaction committed successfully. Certificate ID:', certificateId);
    
    return NextResponse.json({
      success: true,
      certificate_id: certificateId,
      death_id: certificateId,
      message: 'Death certificate created successfully. Resident has been deactivated.'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating death certificate:', error);
    console.error('❌ Error message:', error.message);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create death certificate'
    }, { status: 500 });
  } finally {
    client.release();
  }
}

// GET endpoint to fetch death certificates
export async function GET(request) {
  const client = await getClient();
  
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    let queryText = `
      SELECT 
        death_id,
        registration_number,
        deceased_name,
        deceased_name_am,
        deceased_father_name,
        deceased_father_name_am,
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
        registrar_name,
        registrar_name_am,
        burial_place,
        burial_place_am,
        burial_date_gc,
        burial_date_ec,
        resident_id,
        status,
        created_at
      FROM death_certificate
    `;
    
    const params = [];
    
    if (id) {
      queryText += ` WHERE death_id = $1`;
      params.push(parseInt(id));
    }
    
    queryText += ` ORDER BY death_id DESC`;
    
    const result = await client.query(queryText, params);
    
    return NextResponse.json({
      success: true,
      certificates: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching death certificates:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  } finally {
    client.release();
  }
}
// app/api/id-card/issue/route.js
import { NextResponse } from 'next/server';
import { getClient } from '@/_lib/db';
import { getSession } from '@/_lib/auth';
import { gregorianToEthiopian } from '@/utils/calendar';

export async function POST(request) {
  const client = await getClient();
  
  try {
    console.log('🚀 Starting ID card issuance process...');
    
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const allowedRoles = ['Record Officer', 'Kebele Manager', 'System Administrator'];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { resident_id, id_number, issue_date } = body;

    console.log('📝 Request body:', { resident_id, id_number, issue_date });

    if (!resident_id) {
      return NextResponse.json(
        { success: false, message: 'Resident ID is required' },
        { status: 400 }
      );
    }

    // Get resident info with all required fields for the ID card
    const residentInfo = await client.query(
      `SELECT 
        r.resident_id, 
        r.fname, 
        r.lname,
        r.grandfather_name,
        r.sex,
        r.birthdate,
        r.marital_status,
        r.place_of_birth,
        r.house_id,
        r.national_id,
        r.household_role,
        r.is_head,
        h.house_no
      FROM resident r
      LEFT JOIN house h ON h.house_id = r.house_id
      WHERE r.resident_id = $1`,
      [resident_id]
    );
    
    if (residentInfo.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: `Resident with ID ${resident_id} not found` },
        { status: 404 }
      );
    }

    // Get phone numbers from resident_contact table
    const phoneResult = await client.query(
      `SELECT phone FROM resident_contact WHERE resident_id = $1 ORDER BY is_primary DESC, created_at ASC`,
      [resident_id]
    );
    
    const phoneNumbers = phoneResult.rows.map(row => row.phone);
    const primaryPhone = phoneNumbers.length > 0 ? phoneNumbers[0] : 'N/A';

    const resident = residentInfo.rows[0];
    
    // Build full name
    const fullName = `${resident.fname} ${resident.lname || ''} ${resident.grandfather_name || ''}`.trim();
    
    // Get house number
    const houseNumber = resident.house_no || resident.house_id || 'N/A';
    
    // Marital status
    const maritalStatus = resident.marital_status || 'N/A';
    
    // Grandfather name
    const grandfatherName = resident.grandfather_name || 'N/A';
    
    // Place of birth
    const placeOfBirth = resident.place_of_birth || 'N/A';
    
    // Use lname as father's name
    const fatherName = resident.lname || 'Unknown';
    const gender = resident.sex === 'M' ? 'Male' : 'Female';
    const birthDateGC = resident.birthdate;

    console.log('✅ Resident found:', fullName);
    console.log('✅ Father name:', fatherName);
    console.log('✅ Grandfather name:', grandfatherName);
    console.log('✅ House number:', houseNumber);
    console.log('✅ Phone:', primaryPhone);
    console.log('✅ Marital status:', maritalStatus);
    console.log('✅ Place of birth:', placeOfBirth);

    await client.query('BEGIN');
    console.log('✅ Transaction started');

    // Generate ID number if not provided
    let finalIdNumber = id_number;
    if (!finalIdNumber) {
      const year = new Date().getFullYear().toString().slice(-2);
      const countResult = await client.query(
        `SELECT COUNT(*) as count FROM id_card WHERE id_number LIKE $1`,
        [`KMS-${year}-%`]
      );
      const count = parseInt(countResult.rows[0].count) + 1;
      finalIdNumber = `KMS-${year}-${String(count).padStart(5, '0')}`;
      console.log('📝 Generated new ID number:', finalIdNumber);
    }

    // Convert birth date to Ethiopian calendar
    const birthDateEC = gregorianToEthiopian(birthDateGC);

    // Calculate issue and expiry dates
    const issueDateGC = issue_date || new Date().toISOString().split('T')[0];
    const issueDateObj = new Date(issueDateGC);
    const expiryDateObj = new Date(issueDateObj);
    expiryDateObj.setFullYear(expiryDateObj.getFullYear() + 4);
    const expiryDateGC = expiryDateObj.toISOString().split('T')[0];

    // Convert to Ethiopian calendar
    const issueDateEC = gregorianToEthiopian(issueDateGC);
    const expiryDateEC = gregorianToEthiopian(expiryDateGC);

    // Insert ID card
    const result = await client.query(
      `INSERT INTO id_card (
        id_number, 
        resident_id, 
        full_name,
        father_name,
        grandfather_name,
        sex,
        birth_date_gc,
        birth_date_ec,
        issue_date_gc, 
        issue_date_ec, 
        expiry_date_gc, 
        expiry_date_ec,
        house_number,
        phone_number,
        marital_status,
        place_of_birth,
        status, 
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'active', NOW())
      RETURNING id_card_id, id_number`,
      [
        finalIdNumber, 
        resident_id,
        fullName,
        fatherName,
        grandfatherName,
        gender,
        birthDateGC,
        birthDateEC.formattedDisplay.en,
        issueDateGC, 
        issueDateEC.formattedDisplay.en,
        expiryDateGC, 
        expiryDateEC.formattedDisplay.en,
        houseNumber,
        primaryPhone,
        maritalStatus,
        placeOfBirth
      ]
    );

    const idCardId = result.rows[0].id_card_id;
    console.log('✅ ID card created with ID:', idCardId);

    // ============================================================
    // ✅ CREATE SERVICE REQUEST FOR ID CARD ISSUANCE
    // ============================================================
    let serviceRequestId = null;
    
    // Get the service ID for "New ID Registration"
    const serviceResult = await client.query(
      `SELECT service_id FROM service WHERE service_name = $1`,
      ['New ID Registration']
    );
    
    let serviceId = null;
    if (serviceResult.rows.length > 0) {
      serviceId = serviceResult.rows[0].service_id;
      console.log('✅ Found service: New ID Registration with ID:', serviceId);
    } else {
      // Fallback: try to get by service_id = 4
      const fallbackResult = await client.query(
        `SELECT service_id FROM service WHERE service_id = $1`,
        [4]
      );
      if (fallbackResult.rows.length > 0) {
        serviceId = fallbackResult.rows[0].service_id;
        console.log('✅ Using fallback service ID:', serviceId);
      } else {
        console.warn('⚠️ Service "New ID Registration" not found. Service request not created.');
      }
    }
    
    if (serviceId) {
      // Check if there's an existing pending request for this resident
      const existingRequest = await client.query(
        `SELECT request_id FROM service_request 
         WHERE resident_id = $1 AND service_id = $2 AND status = 'pending'`,
        [resident_id, serviceId]
      );

      if (existingRequest.rows.length > 0) {
        // Update existing request to completed
        await client.query(
          `UPDATE service_request 
           SET status = 'completed', completed_date = NOW()
           WHERE request_id = $1`,
          [existingRequest.rows[0].request_id]
        );
        serviceRequestId = existingRequest.rows[0].request_id;
        console.log('✅ Updated existing service request to completed:', serviceRequestId);
      } else {
        // Create new service request
        const requestNumber = `SR-${Date.now()}-${resident_id}`;
        const newRequestResult = await client.query(
          `INSERT INTO service_request (
            request_number, service_id, resident_id, status, 
            request_date, completed_date, notes
          ) VALUES ($1, $2, $3, 'completed', NOW(), NOW(), $4)
          RETURNING request_id`,
          [
            requestNumber,
            serviceId,
            resident_id,
            `ID card issued: ${finalIdNumber} for resident: ${fullName}`
          ]
        );
        serviceRequestId = newRequestResult.rows[0].request_id;
        console.log('✅ Created new service request for ID card issuance:', requestNumber);
      }
    }

    await client.query('COMMIT');
    console.log('✅ Transaction committed successfully');

    return NextResponse.json({
      success: true,
      id_card_id: idCardId,
      id_number: finalIdNumber,
      full_name: fullName,
      father_name: fatherName,
      grandfather_name: grandfatherName,
      house_number: houseNumber,
      phone_number: primaryPhone,
      marital_status: maritalStatus,
      place_of_birth: placeOfBirth,
      gender: gender,
      birth_date_gc: birthDateGC,
      birth_date_ec: birthDateEC.formattedDisplay.en,
      issue_date_gc: issueDateGC,
      issue_date_ec: issueDateEC.formattedDisplay.en,
      expiry_date_gc: expiryDateGC,
      expiry_date_ec: expiryDateEC.formattedDisplay.en,
      service_request_id: serviceRequestId,
      message: 'ID card issued successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error issuing ID card:', error);
    console.error('❌ Error message:', error.message);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to issue ID card: ' + error.message 
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
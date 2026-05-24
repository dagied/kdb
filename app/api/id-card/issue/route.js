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
    const { 
      resident_id, 
      full_name_am, 
      father_name_am,
      grandfather_name_am,
      emergency_contact_name,
      emergency_relationship,
      emergency_phone,
      emergency_alt_phone,
      emergency_address,
      medical_notes,
      photo_url,
      phone
    } = body;

    console.log('📝 Request body:', { resident_id, full_name_am, father_name_am, emergency_contact_name });

    if (!resident_id) {
      return NextResponse.json(
        { success: false, message: 'Resident ID is required' },
        { status: 400 }
      );
    }

    // ============================================================
    // ✅ CHECK FOR EXISTING ACTIVE ID CARD
    // ============================================================
    const existingIdCard = await client.query(
      `SELECT id_card_id, id_number, issue_date_gc, expiry_date_gc, status 
       FROM id_card 
       WHERE resident_id = $1 AND status = 'active'`,
      [resident_id]
    );

    if (existingIdCard.rows.length > 0) {
      const existing = existingIdCard.rows[0];
      
      // Check if the card is still valid (not expired)
      const today = new Date().toISOString().split('T')[0];
      const isExpired = existing.expiry_date_gc < today;
      
      if (!isExpired) {
        console.log('❌ Resident already has an active ID card:', existing.id_number);
        return NextResponse.json(
          { 
            success: false, 
            message: 'Resident already has an active ID card',
            existing_id: existing.id_card_id,
            existing_id_number: existing.id_number,
            issue_date: existing.issue_date_gc,
            expiry_date: existing.expiry_date_gc
          },
          { status: 409 }
        );
      } else {
        // Card is expired, mark it as expired and proceed with new issuance
        console.log('⚠️ Existing ID card is expired, issuing new one and marking old as expired');
        await client.query(
          `UPDATE id_card 
           SET status = 'expired', updated_at = NOW() 
           WHERE id_card_id = $1`,
          [existing.id_card_id]
        );
      }
    }

    // Get resident info with all required fields for the ID card
    const residentInfo = await client.query(
      `SELECT 
        r.resident_id, 
        r.fname, 
        r.lname,
        r.fname_am,
        r.lname_am,
        r.grandfather_name,
        r.grandfather_name_am,
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
    const primaryPhone = body.phone || (phoneNumbers.length > 0 ? phoneNumbers[0] : null);

    const resident = residentInfo.rows[0];
    
    // Build full name with Amharic support
    const fullNameEn = `${resident.fname} ${resident.lname || ''} ${resident.grandfather_name || ''}`.trim();
    const fullNameAm = body.full_name_am || `${resident.fname_am || ''} ${resident.lname_am || ''} ${resident.grandfather_name_am || ''}`.trim();
    
    // Father name with Amharic support
    const fatherNameEn = resident.lname || '';
    const fatherNameAm = body.father_name_am || resident.lname_am || '';
    
    // Grandfather name with Amharic support
    const grandfatherNameEn = resident.grandfather_name || '';
    const grandfatherNameAm = body.grandfather_name_am || resident.grandfather_name_am || '';
    
    // Get house number
    const houseNumber = resident.house_no || resident.house_id || '';
    
    // Marital status
    const maritalStatus = resident.marital_status || '';
    
    // Place of birth
    const placeOfBirth = resident.place_of_birth || '';
    
    const gender = resident.sex === 'M' ? 'Male' : 'Female';
    const birthDateGC = resident.birthdate;

    console.log('✅ Resident found:', fullNameEn);
    console.log('✅ Amharic name:', fullNameAm);
    console.log('✅ Father name:', fatherNameEn);
    console.log('✅ Emergency contact:', emergency_contact_name);

    await client.query('BEGIN');
    console.log('✅ Transaction started');

    // Generate ID number if not provided
    let finalIdNumber = body.id_number;
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
    const issueDateGC = body.issue_date || new Date().toISOString().split('T')[0];
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
        full_name_am,
        father_name,
        father_name_am,
        grandfather_name,
        grandfather_name_am,
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
        emergency_contact_name,
        emergency_relationship,
        emergency_phone,
        emergency_alt_phone,
        emergency_address,
        medical_notes,
        photo_url,
        status, 
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, 'active', NOW())
      RETURNING id_card_id, id_number`,
      [
        finalIdNumber, 
        resident_id,
        fullNameEn,
        fullNameAm || null,
        fatherNameEn,
        fatherNameAm || null,
        grandfatherNameEn,
        grandfatherNameAm || null,
        gender,
        birthDateGC,
        birthDateEC?.formattedDisplay?.en || null,
        issueDateGC, 
        issueDateEC?.formattedDisplay?.en || null,
        expiryDateGC, 
        expiryDateEC?.formattedDisplay?.en || null,
        houseNumber,
        primaryPhone,
        maritalStatus,
        placeOfBirth,
        emergency_contact_name || null,
        emergency_relationship || null,
        emergency_phone || null,
        emergency_alt_phone || null,
        emergency_address || null,
        medical_notes || null,
        photo_url || null
      ]
    );

    const idCardId = result.rows[0].id_card_id;
    console.log('✅ ID card created with ID:', idCardId);

    // ============================================================
    // CREATE SERVICE REQUEST - ALWAYS CREATE NEW FOR EACH ID CARD
    // ============================================================
    let serviceRequestId = null;
    
    const serviceResult = await client.query(
      `SELECT service_id FROM service WHERE service_name = $1 OR service_id = $2`,
      ['New ID Registration', 4]
    );
    
    let serviceId = null;
    if (serviceResult.rows.length > 0) {
      serviceId = serviceResult.rows[0].service_id;
      console.log('✅ Found service for ID card issuance with ID:', serviceId);
    }
    
    if (serviceId) {
      // ALWAYS create a NEW service request for each ID issuance
      const requestNumber = `SR-${Date.now()}-${resident_id}-${Math.floor(Math.random() * 1000)}`;
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
          `ID card issued: ${finalIdNumber} for resident: ${fullNameEn}`
        ]
      );
      serviceRequestId = newRequestResult.rows[0].request_id;
      console.log('✅ Created new service request for ID card issuance:', requestNumber);
    } else {
      console.warn('⚠️ No service found for ID card issuance, service request not created');
    }

    await client.query('COMMIT');
    console.log('✅ Transaction committed successfully');

    return NextResponse.json({
      success: true,
      id_card_id: idCardId,
      id_number: finalIdNumber,
      full_name: fullNameEn,
      full_name_am: fullNameAm,
      father_name: fatherNameEn,
      father_name_am: fatherNameAm,
      grandfather_name: grandfatherNameEn,
      grandfather_name_am: grandfatherNameAm,
      house_number: houseNumber,
      phone_number: primaryPhone,
      marital_status: maritalStatus,
      place_of_birth: placeOfBirth,
      gender: gender,
      birth_date_gc: birthDateGC,
      birth_date_ec: birthDateEC?.formattedDisplay?.en,
      issue_date_gc: issueDateGC,
      issue_date_ec: issueDateEC?.formattedDisplay?.en,
      expiry_date_gc: expiryDateGC,
      expiry_date_ec: expiryDateEC?.formattedDisplay?.en,
      emergency_contact_name: emergency_contact_name,
      emergency_relationship: emergency_relationship,
      emergency_phone: emergency_phone,
      emergency_alt_phone: emergency_alt_phone,
      emergency_address: emergency_address,
      medical_notes: medical_notes,
      photo_url: photo_url,
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
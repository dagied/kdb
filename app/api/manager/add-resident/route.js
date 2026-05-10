// app/api/manager/add-resident/route.js
import { NextResponse } from "next/server";
import { getClient } from "@/_lib/db";
import { getSession } from "@/_lib/auth";
import { validateResidentPayload } from "@/_lib/validators";

// GET method for testing the API
export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: "Add Resident API is working. Use POST to add a resident." 
  });
}

// POST method for adding residents
export async function POST(req) {
  const client = await getClient();

  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const body = await req.json();
    console.log("Received payload:", JSON.stringify(body, null, 2));

    const validation = validateResidentPayload(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, errors: validation.errors },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    const houseCheck = await client.query(
      `SELECT house_id, kebele_id FROM house WHERE house_id = $1`,
      [body.house_id]
    );
    
    if (houseCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, message: `House with ID "${body.house_id}" does not exist.` },
        { status: 404 }
      );
    }
    
    const kebeleId = houseCheck.rows[0].kebele_id;

    let finalHouseholdId;
    let finalHouseholdCode;
    
    const shouldCreateNewHousehold = 
      body.create_new_household === true || 
      body.create_new_household === 'true' ||
      body.create_new_household === 1 ||
      body.create_new_household === '1';
    
    console.log('Should create new household?', shouldCreateNewHousehold);
    console.log('create_new_household raw value:', body.create_new_household);
    
    if (shouldCreateNewHousehold) {
      console.log('Creating new household for house:', body.house_id);
      
      const householdResult = await client.query(
        `INSERT INTO household (house_id, kebele_id)
         VALUES ($1, $2)
         RETURNING household_id, household_code`,
        [body.house_id, kebeleId]
      );
      finalHouseholdId = householdResult.rows[0].household_id;
      finalHouseholdCode = householdResult.rows[0].household_code;
      
      console.log('✅ New household created:', { finalHouseholdId, finalHouseholdCode });
    } else {
      console.log('Using existing household ID:', body.household_id);
      
      const existingHouseholdId = Number(body.household_id);
      
      if (isNaN(existingHouseholdId)) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { success: false, message: "Household ID must be a number." },
          { status: 400 }
        );
      }
      
      const householdCheck = await client.query(
        `SELECT household_id, household_code FROM household
         WHERE household_id = $1 AND house_id = $2`,
        [existingHouseholdId, body.house_id]
      );
      
      if (householdCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { success: false, message: `Household ID "${existingHouseholdId}" does not exist or is not linked to house "${body.house_id}".` },
          { status: 404 }
        );
      }
      finalHouseholdId = existingHouseholdId;
      finalHouseholdCode = householdCheck.rows[0].household_code;
      console.log('✅ Using existing household:', { finalHouseholdId, finalHouseholdCode });
    }

    if (body.household_role === 'Head') {
      const headCheck = await client.query(
        `SELECT resident_id FROM resident
         WHERE household_id = $1 AND is_head = true
         LIMIT 1`,
        [finalHouseholdId]
      );
      
      if (headCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { success: false, message: `Household already has a registered Head. Please choose a different role.` },
          { status: 409 }
        );
      }
    }

    let jobId = null;
    if (body.job_title) {
      const jobCheck = await client.query(
        `SELECT job_id FROM job WHERE LOWER(job_title) = LOWER($1) LIMIT 1`,
        [body.job_title]
      );
      
      if (jobCheck.rows.length > 0) {
        jobId = jobCheck.rows[0].job_id;
      } else {
        const jobResult = await client.query(
          `INSERT INTO job (job_title) VALUES ($1) RETURNING job_id`,
          [body.job_title]
        );
        jobId = jobResult.rows[0].job_id;
      }
    }

    let roleId = null;
    if (body.household_role) {
      const roleCheck = await client.query(
        `SELECT role_id FROM household_role WHERE role_name = $1 LIMIT 1`,
        [body.household_role]
      );
      
      if (roleCheck.rows.length > 0) {
        roleId = roleCheck.rows[0].role_id;
      }
    }

    const genderCode = body.gender === 'Male' ? 'M' : (body.gender === 'Female' ? 'F' : null);

    const fullName = [body.first_name, body.father_name, body.grandfather_name].filter(Boolean).join(' ');

    const residentResult = await client.query(
      `INSERT INTO resident (
        fname, lname, grandfather_name, sex, birthdate,
        marital_status, place_of_birth, nationality, national_id,
        previous_kebele, proof_of_residence, education_level, religion,
        notes, verified_by, verification_date, verification_note,
        house_id, household_id, job_id, role_id, household_role,
        is_head, is_active, status
       ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25
       )
       RETURNING resident_id`,
      [
        body.first_name || null,
        body.father_name || null,
        body.grandfather_name || null,
        genderCode,
        body.date_of_birth,
        body.marital_status || null,
        body.place_of_birth || null,
        body.nationality || 'Ethiopian',
        body.national_id || null,
        body.previous_kebele || null,
        body.proof_of_residence || null,
        body.education_level || null,
        body.religion || null,
        body.notes || null,
        body.verified_by || null,
        body.verification_date || null,
        body.verification_note || null,
        body.house_id,
        finalHouseholdId,
        jobId,
        roleId,
        body.household_role,
        body.household_role === 'Head',
        true,
        'active'
      ]
    );

    const residentId = residentResult.rows[0].resident_id;

    // Insert phone contacts
    if (body.phones && Array.isArray(body.phones) && body.phones.length > 0) {
      const validPhones = body.phones.filter(p => p && p.trim());
      for (let i = 0; i < validPhones.length; i++) {
        await client.query(
          `INSERT INTO resident_contact (resident_id, phone, contact_type, is_primary, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [residentId, validPhones[i].trim(), 'phone', i === 0]
        );
      }
    }

    // ============================================================
    // CREATE SERVICE REQUEST FOR ID REGISTRATION - FIXED
    // Using correct table name 'service_request' (singular)
    // Using only columns that exist in your table
    // ============================================================
    let serviceRequestId = null;
    let serviceId = null;
    
    // Try to get the service ID for "New ID Registration"
    const serviceResult = await client.query(
      `SELECT service_id FROM service WHERE service_name = $1`,
      ['New ID Registration']
    );
    
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
      // ✅ FIXED: Using correct table name 'service_request' (singular)
      // ✅ FIXED: Removed 'request_number', 'created_by', 'priority' columns
      const serviceRequestResult = await client.query(
        `INSERT INTO service_request (
          service_id, resident_id, status, request_date, notes
        ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4)
        RETURNING request_id`,
        [
          serviceId,
          residentId,
          'pending',
          `New resident registration: ${fullName}`
        ]
      );
      serviceRequestId = serviceRequestResult.rows[0].request_id;
      console.log('✅ Service request created for ID registration, ID:', serviceRequestId);
    }

    const staffId = session.user?.staff_id || session.user?.id;
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    
    await client.query(
      `INSERT INTO audit_log (staff_id, action, table_name, record_id, new_value, ip_address, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        staffId,
        'INSERT',
        'resident',
        residentId,
        JSON.stringify({
          action: 'Registered new resident',
          name: fullName,
          household_id: finalHouseholdId,
          household_code: finalHouseholdCode,
          role: body.household_role,
          house_id: body.house_id,
          service_request_id: serviceRequestId
        }),
        ipAddress,
      ]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: "Resident added successfully",
      resident_id: residentId,
      household_id: finalHouseholdId,
      household_code: finalHouseholdCode,
      service_request_id: serviceRequestId
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error adding resident:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || "Failed to add resident",
        error: error.toString()
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
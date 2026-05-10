// _lib/residentService.js
import { getClient } from './db.js';
import { clean } from './validators.js';

/**
 * Register a new resident.
 */
export async function registerResident(payload, staffId) {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // ── 1. Verify house exists ───────────────────────────────────────────────
    const houseRows = await client.query(
      `SELECT house_id, kebele_id FROM house WHERE house_id = $1`,
      [payload.house_id]
    );
    if (houseRows.rows.length === 0) {
      throw new Error(`House with ID "${payload.house_id}" does not exist.`);
    }
    const kebeleId = houseRows.rows[0].kebele_id;

    // ── 2. Resolve household_id ──────────────────────────────────────────────
    let householdId;

    if (payload.create_new_household) {
      const hhInsert = await client.query(
        `INSERT INTO household (house_id, kebele_id)
         VALUES ($1, $2)
         RETURNING household_id`,
        [payload.house_id, kebeleId]
      );
      householdId = hhInsert.rows[0].household_id;
    } else {
      const hhRows = await client.query(
        `SELECT household_id FROM household
         WHERE household_id = $1 AND house_id = $2`,
        [payload.household_id, payload.house_id]
      );
      if (hhRows.rows.length === 0) {
        throw new Error(
          `Household "${payload.household_id}" does not exist or is not linked to house "${payload.house_id}".`
        );
      }
      householdId = payload.household_id;
    }

    // ── 3. Enforce single Head per household ─────────────────────────────────
    if (payload.household_role === 'Head') {
      const existingHead = await client.query(
        `SELECT resident_id FROM resident
         WHERE household_id = $1 AND is_head = true
         LIMIT 1`,
        [householdId]
      );
      if (existingHead.rows.length > 0) {
        throw new Error(
          `Household "${householdId}" already has a registered Head. ` +
          `Please choose a different household role.`
        );
      }
    }

    // ── 4. Resolve job_id ────────────────────────────────────────────────────
    let jobId = null;
    if (payload.job_title) {
      const jobRows = await client.query(
        `SELECT job_id FROM job WHERE LOWER(job_title) = LOWER($1) LIMIT 1`,
        [payload.job_title]
      );
      if (jobRows.rows.length > 0) {
        jobId = jobRows.rows[0].job_id;
      } else {
        const newJob = await client.query(
          `INSERT INTO job (job_title) VALUES ($1) RETURNING job_id`,
          [clean(payload.job_title)]
        );
        jobId = newJob.rows[0].job_id;
      }
    }

    // ── 5. Resolve role_id from household_role table ─────────────────────────
    let roleId = null;
    if (payload.household_role) {
      const roleRows = await client.query(
        `SELECT role_id FROM household_role WHERE role_name = $1 LIMIT 1`,
        [payload.household_role]
      );
      if (roleRows.rows.length > 0) {
        roleId = roleRows.rows[0].role_id;
      } else {
        const newRole = await client.query(
          `INSERT INTO household_role (role_name) VALUES ($1) RETURNING role_id`,
          [payload.household_role]
        );
        roleId = newRole.rows[0].role_id;
      }
    }

    // ── 6. Generate full_name from components ───────────────────────────────
    const fullName = [
      clean(payload.first_name),
      clean(payload.father_name),
      clean(payload.grandfather_name)
    ].filter(Boolean).join(' ');

    // ── 7. INSERT resident ───────────────────────────────────────────────────
    const residentInsert = await client.query(
      `INSERT INTO resident (
         fname,
         lname,
         grandfather_name,
         full_name,
         sex,
         birthdate,
         marital_status,
         place_of_birth,
         nationality,
         national_id,
         previous_kebele,
         proof_of_residence,
         education_level,
         religion,
         notes,
         verified_by,
         verification_date,
         verification_note,
         house_id,
         household_id,
         job_id,
         role_id,
         household_role,
         is_head,
         is_active,
         status,
         registration_date,
         created_at,
         updated_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
         $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
         $21, $22, $23, $24, $25, $26, NOW(), NOW(), NOW()
       )
       RETURNING resident_id`,
      [
        clean(payload.first_name),                    // $1  fname
        clean(payload.father_name),                   // $2  lname
        clean(payload.grandfather_name),              // $3  grandfather_name
        fullName,                                     // $4  full_name
        payload.gender,                               // $5  sex
        payload.date_of_birth,                        // $6  birthdate
        clean(payload.marital_status),                // $7  marital_status
        clean(payload.place_of_birth),                // $8  place_of_birth
        clean(payload.nationality) || 'Ethiopian',    // $9  nationality
        clean(payload.national_id),                   // $10 national_id
        clean(payload.previous_kebele),               // $11 previous_kebele
        clean(payload.proof_of_residence),            // $12 proof_of_residence
        clean(payload.education_level),               // $13 education_level
        clean(payload.religion),                      // $14 religion
        clean(payload.notes),                         // $15 notes
        clean(payload.verified_by),                   // $16 verified_by
        payload.verification_date || null,            // $17 verification_date
        clean(payload.verification_note),             // $18 verification_note
        payload.house_id,                             // $19 house_id
        householdId,                                  // $20 household_id
        jobId,                                        // $21 job_id
        roleId,                                       // $22 role_id
        payload.household_role,                       // $23 household_role
        payload.household_role === 'Head',            // $24 is_head
        true,                                         // $25 is_active
        'active'                                      // $26 status
      ]
    );

    const residentId = residentInsert.rows[0].resident_id;

    // ── 8. Insert phone contacts ─────────────────────────────────────────────
    if (Array.isArray(payload.phones) && payload.phones.length > 0) {
      const validPhones = payload.phones.map(p => clean(p)).filter(Boolean);
      for (let i = 0; i < validPhones.length; i++) {
        await client.query(
          `INSERT INTO resident_contact (resident_id, phone, contact_type, is_primary, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [residentId, validPhones[i], 'phone', i === 0]
        );
      }
    }

    // ── 9. CREATE SERVICE REQUEST FOR NEW ID REGISTRATION ────────────────────
    // ✅ FIXED: Changed from 'New National ID Registration' to 'New ID Registration'
    let serviceRequestId = null;
    let serviceId = null;
    
    // Try to get the service ID for "New ID Registration"
    const serviceResult = await client.query(
      `SELECT service_id FROM service WHERE service_name = $1`,
      ['New ID Registration']
    );
    
    if (serviceResult.rows.length > 0) {
      serviceId = serviceResult.rows[0].service_id;
    } else {
      // Fallback: try to get by service_id = 4
      const fallbackResult = await client.query(
        `SELECT service_id FROM service WHERE service_id = $1`,
        [4]
      );
      if (fallbackResult.rows.length > 0) {
        serviceId = fallbackResult.rows[0].service_id;
      } else {
        console.warn('⚠️ Service "New ID Registration" not found. Service request not created.');
      }
    }
    
    if (serviceId) {
      const requestNumber = `SR-${Date.now()}-${residentId}`;
      const serviceRequestResult = await client.query(
        `INSERT INTO service_requests (
          request_number, 
          service_id, 
          resident_id, 
          status, 
          request_date, 
          created_by,
          priority,
          notes
        ) VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7)
        RETURNING request_id`,
        [
          requestNumber,
          serviceId,
          residentId,
          'pending',
          staffId,
          'normal',
          `Automatically created for new resident registration: ${fullName}`
        ]
      );
      serviceRequestId = serviceRequestResult.rows[0].request_id;
      console.log(`✅ Service request created for ID registration: ${requestNumber}`);
    }

    // ── 10. Audit log ────────────────────────────────────────────────────────
    const auditDescription = `Registered new resident: ${fullName} (Household: ${householdId})`;
    if (serviceRequestId) {
      auditDescription + ` Service Request ID: ${serviceRequestId}`;
    }
    
    await client.query(
      `INSERT INTO audit_log (staff_id, action, table_name, record_id, description, created_at)
       VALUES ($1, 'INSERT', 'resident', $2, $3, NOW())`,
      [
        staffId,
        residentId,
        `Registered new resident: ${fullName} (Household: ${householdId})${serviceRequestId ? `, Service Request: ${serviceRequestId}` : ''}`,
      ]
    );

    await client.query('COMMIT');
    
    return { 
      resident_id: residentId, 
      household_id: householdId,
      service_request_id: serviceRequestId
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Fetch a house by house_id.
 */
export async function getHouseById(houseId) {
  const client = await getClient();
  try {
    const result = await client.query(
      `SELECT h.house_id, h.kebele_id, k.kebele_name
       FROM house h
       JOIN kebele k ON k.kebele_id = h.kebele_id
       WHERE h.house_id = $1`,
      [houseId]
    );
    return result.rows[0] ?? null;
  } finally {
    client.release();
  }
}

/**
 * Fetch a household with its head's name.
 */
export async function getHouseholdById(householdId) {
  const client = await getClient();
  try {
    const result = await client.query(
      `SELECT
         hh.household_id,
         hh.house_id,
         hh.kebele_id,
         CONCAT(r.fname, ' ', r.lname) AS head_name
       FROM household hh
       LEFT JOIN resident r
         ON r.household_id = hh.household_id
         AND r.is_head = true
         AND r.is_active = true
       WHERE hh.household_id = $1`,
      [householdId]
    );
    return result.rows[0] ?? null;
  } finally {
    client.release();
  }
}

/**
 * List all active residents in a household.
 */
export async function getResidentsByHousehold(householdId) {
  const client = await getClient();
  try {
    const result = await client.query(
      `SELECT
         r.resident_id,
         CONCAT(r.fname, ' ', r.lname, ' ', r.grandfather_name) AS full_name,
         r.sex AS gender,
         r.birthdate AS date_of_birth,
         r.household_role,
         r.is_head
       FROM resident r
       WHERE r.household_id = $1
         AND r.is_active = true
       ORDER BY r.is_head DESC, r.fname`,
      [householdId]
    );
    return result.rows;
  } finally {
    client.release();
  }
}
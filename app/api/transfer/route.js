import { NextResponse } from 'next/server';
import { getClient } from '@/_lib/db';
import { getSession } from '@/_lib/auth';

export async function POST(request) {
  const client = await getClient();
  
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Transfer request data:', JSON.stringify(body, null, 2));
    
    // Validate required fields
    if (!body.resident_id || !body.destination_kebele) {
      return NextResponse.json({
        success: false,
        error: 'Resident ID and destination kebele are required'
      }, { status: 400 });
    }
    
    await client.query('BEGIN');
    
    // Get the transfer service ID
    const transferService = await client.query(
      `SELECT service_id FROM service WHERE service_name = 'Resident Transfer Service'`
    );
    
    let transferServiceId = null;
    if (transferService.rows.length > 0) {
      transferServiceId = transferService.rows[0].service_id;
    } else {
      const fallbackService = await client.query(
        `SELECT service_id FROM service WHERE category = 'Administrative Services' LIMIT 1`
      );
      if (fallbackService.rows.length > 0) {
        transferServiceId = fallbackService.rows[0].service_id;
      }
    }
    
    // Get the main resident's information - FIXED: removed mname references
    const mainResident = await client.query(
      `SELECT resident_id, house_id, fname, lname, grandfather_name,
              fname_am, lname_am, grandfather_name_am,
              COALESCE(fname, '') || ' ' || COALESCE(lname, '') || ' ' || COALESCE(grandfather_name, '') as full_name,
              COALESCE(fname_am, '') || ' ' || COALESCE(lname_am, '') || ' ' || COALESCE(grandfather_name_am, '') as full_name_am
       FROM resident r
       WHERE resident_id = $1`,
      [body.resident_id]
    );
    
    if (mainResident.rows.length === 0) {
      return NextResponse.json({ error: 'Resident not found' }, { status: 404 });
    }
    
    const houseId = mainResident.rows[0].house_id;
    
    // Get the name values (use the form data which includes user input for opposite language)
    const residentNameEn = body.resident_name || mainResident.rows[0].full_name;
    const residentNameAm = body.resident_name_am || mainResident.rows[0].full_name_am;
    
    // Get the actual head of household
    const headOfHousehold = await client.query(
      `SELECT resident_id, fname, lname, fname_am, lname_am
       FROM resident 
       WHERE house_id = $1 AND relationship_to_head = 'Head'
       LIMIT 1`,
      [houseId]
    );
    
    const actualHeadId = headOfHousehold.rows.length > 0 ? headOfHousehold.rows[0].resident_id : null;
    const isSelectedResidentHead = (actualHeadId === parseInt(body.resident_id));
    
    // Get all family members in the same house
    const familyResult = await client.query(
      `SELECT resident_id, fname, lname, fname_am, lname_am, house_id,
              CASE 
                WHEN relationship_to_head = 'Head' THEN 'Head of Household'
                WHEN relationship_to_head = 'Spouse' THEN 'Spouse'
                WHEN relationship_to_head = 'Child' THEN 'Child'
                ELSE 'Family Member'
              END as relationship_display
       FROM resident 
       WHERE house_id = $1 
       AND status != 'transferred'
       AND resident_id != $2`,
      [houseId, body.resident_id]
    );
    
    const allFamilyMembers = familyResult.rows;
    
    // Determine who is transferring
    let transferringResidentIds = [parseInt(body.resident_id)]; // Main resident always transfers
    
    if (body.transfer_type === 'FULL') {
      // FULL TRANSFER: All family members transfer
      for (const member of allFamilyMembers) {
        transferringResidentIds.push(member.resident_id);
      }
    } else if (body.transfer_type === 'PARTIAL' && body.family_members) {
      // PARTIAL TRANSFER: Only selected members transfer
      for (const member of body.family_members) {
        transferringResidentIds.push(parseInt(member.resident_id));
      }
    }
    
    // Remove duplicates
    transferringResidentIds = [...new Set(transferringResidentIds)];
    
    // Generate transfer number
    const transferNumber = `TRF-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    // Insert transfer request with resident names
    const result = await client.query(
      `INSERT INTO transfer_request (
        transfer_number, resident_id, resident_name, resident_name_am, transfer_date, transfer_type,
        destination_kebele, destination_zone, destination_woreda,
        destination_sub_city, destination_kebele_name, destination_region,
        reason, transfer_initiative, status, tax_cleared, utility_bills_cleared,
        obligations_cleared, has_departure_letter, departure_letter_number,
        requested_by, clearance_date
      ) VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'COMPLETED', $14, $15, $16, $17, $18, $19, CURRENT_DATE)
      RETURNING *`,
      [
        transferNumber,
        body.resident_id,
        residentNameEn,
        residentNameAm,
        body.transfer_type || 'FULL',
        body.destination_kebele,
        body.destination_zone || null,
        body.destination_woreda || null,
        body.destination_sub_city || null,
        body.destination_kebele_name || null,
        body.destination_region || null,
        body.reason || null,
        body.transfer_initiative || 'RESIDENT',
        body.tax_cleared || false,
        body.utility_bills_cleared || false,
        body.obligations_cleared || false,
        body.has_departure_letter || false,
        body.departure_letter_number || null,
        session.staff_id
      ]
    );
    
    const transfer = result.rows[0];
    
    // Store family members for certificate
    const transferringFamily = [];
    
    // Process each transferring resident
    for (const residentId of transferringResidentIds) {
      const resident = await client.query(
        `SELECT fname, lname, fname_am, lname_am,
                CASE 
                  WHEN relationship_to_head = 'Head' THEN 'Head of Household'
                  WHEN relationship_to_head = 'Spouse' THEN 'Spouse'
                  WHEN relationship_to_head = 'Child' THEN 'Child'
                  ELSE 'Family Member'
                END as relationship_display
         FROM resident WHERE resident_id = $1`,
        [residentId]
      );
      
      if (resident.rows.length > 0) {
        const r = resident.rows[0];
        const isMain = (residentId === parseInt(body.resident_id));
        
        let relationship = r.relationship_display || 'Family Member';
        
        if (isMain && !isSelectedResidentHead) {
          relationship = 'Resident (Family Member)';
        }
        
        if (residentId === actualHeadId) {
          relationship = 'Head of Household';
        }
        
        transferringFamily.push({
          resident_id: residentId,
          name: `${r.fname} ${r.lname}`,
          name_am: r.fname_am && r.lname_am ? `${r.fname_am} ${r.lname_am}` : '',
          relationship: relationship
        });
        
        // Store in transfer_family_members table
        await client.query(
          `INSERT INTO transfer_family_members (
            transfer_id, family_member_id, relationship, name, name_am, is_transferring
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [transfer.transfer_id, residentId, relationship, 
           `${r.fname} ${r.lname}`, r.fname_am && r.lname_am ? `${r.fname_am} ${r.lname_am}` : '', true]
        );
        
        // UPDATE RESIDENT STATUS: Mark as transferred and inactive
        await client.query(
          `UPDATE resident 
           SET is_transferred = true, 
               transferred_to_kebele = $1,
               transfer_date = CURRENT_DATE,
               status = 'transferred',
               is_active = false,
               updated_at = NOW()
           WHERE resident_id = $2`,
          [body.destination_kebele, residentId]
        );
        
        // CREATE SERVICE REQUEST for each transferred resident
        if (transferServiceId) {
          const requestNumber = `SR-${Date.now()}-${residentId}-${Math.floor(Math.random() * 1000)}`;
          await client.query(
            `INSERT INTO service_request (
              request_number, resident_id, service_id, request_date, status, 
              completed_date, notes, processed_by
            ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 'completed', CURRENT_TIMESTAMP, $4, $5)`,
            [
              requestNumber,
              residentId,
              transferServiceId,
              `Resident transfer to ${body.destination_kebele}. Transfer Type: ${body.transfer_type}. Transfer Number: ${transferNumber}. Relationship: ${relationship}`,
              session.staff_id
            ]
          );
          console.log(`✅ Service request created for resident ID: ${residentId}`);
        }
      }
    }
    
    // Update house occupancy
    const remainingResidents = await client.query(
      `SELECT COUNT(*) as count 
       FROM resident 
       WHERE house_id = $1 
       AND status != 'transferred' 
       AND is_active = true`,
      [houseId]
    );
    
    if (parseInt(remainingResidents.rows[0].count) === 0) {
      // No residents left - mark house as empty
      await client.query(
        `UPDATE house 
         SET is_occupied = false, 
             current_resident_id = NULL,
             updated_at = NOW()
         WHERE house_id = $1`,
        [houseId]
      );
    } else {
      // If the head of household transferred, assign a new head
      if (actualHeadId && transferringResidentIds.includes(actualHeadId)) {
        const newHead = await client.query(
          `SELECT resident_id, fname, lname
           FROM resident 
           WHERE house_id = $1 
           AND status != 'transferred' 
           AND is_active = true
           ORDER BY 
             CASE 
               WHEN relationship_to_head = 'Spouse' THEN 1
               WHEN age IS NOT NULL THEN age
               ELSE 999
             END
           LIMIT 1`,
          [houseId]
        );
        
        if (newHead.rows.length > 0) {
          await client.query(
            `UPDATE resident 
             SET relationship_to_head = 'Head'
             WHERE resident_id = $1`,
            [newHead.rows[0].resident_id]
          );
          
          await client.query(
            `UPDATE house 
             SET current_resident_id = $1,
                 head_of_household = $2,
                 updated_at = NOW()
             WHERE house_id = $3`,
            [newHead.rows[0].resident_id, newHead.rows[0].resident_id, houseId]
          );
        }
      }
    }
    
    // Create transfer certificate
    const certificateNumber = `TRC-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    // In the transfer API, when creating certificateData
    const certificateData = {
      transfer_number: transferNumber,
      transfer_type: body.transfer_type,
      destination_kebele: body.destination_kebele,
      transfer_date: transfer.transfer_date,
      reason: body.reason,
      resident_name: residentNameEn,
      resident_name_am: residentNameAm,  // ✅ Must be here
      house_id: houseId,
      family_members: transferringFamily
    };
    
    await client.query(
      `INSERT INTO transfer_certificate (
        transfer_id, certificate_number, certificate_type, issue_date, issued_by, certificate_data
      ) VALUES ($1, $2, 'TRANSFER', CURRENT_DATE, $3, $4)`,
      [transfer.transfer_id, certificateNumber, session.staff_id, JSON.stringify(certificateData)]
    );
    
    await client.query('COMMIT');
    
    return NextResponse.json({
      success: true,
      transfer: transfer,
      certificate_number: certificateNumber,
      transferred_members: transferringFamily.length,
      message: body.transfer_type === 'FULL' 
        ? `Full family transfer completed successfully. ${transferringFamily.length} resident(s) transferred.`
        : `${transferringFamily.length} resident(s) transferred successfully.`
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing transfer:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process transfer: ' + error.message 
    }, { status: 500 });
  } finally {
    client.release();
  }
}

// GET - Fetch transfers
export async function GET(request) {
  const client = await getClient();
  
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const transferId = searchParams.get('id');
    const residentId = searchParams.get('resident_id');
    const status = searchParams.get('status');
    
    let query = `
      SELECT t.*, 
             req.full_name as requested_by_name,
             ver.full_name as verified_by_name
      FROM transfer_request t
      LEFT JOIN staff req ON req.staff_id = t.requested_by
      LEFT JOIN staff ver ON ver.staff_id = t.verified_by
      WHERE 1=1
    `;
    const params = [];
    
    if (transferId) {
      query += ` AND t.transfer_id = $${params.length + 1}`;
      params.push(transferId);
    }
    
    if (residentId) {
      query += ` AND t.resident_id = $${params.length + 1}`;
      params.push(residentId);
    }
    
    if (status) {
      query += ` AND t.status = $${params.length + 1}`;
      params.push(status);
    }
    
    query += ` ORDER BY t.transfer_id DESC`;
    
    const result = await client.query(query, params);
    
    // Get family members for each transfer
    for (const transfer of result.rows) {
      const familyResult = await client.query(
        `SELECT * FROM transfer_family_members WHERE transfer_id = $1 AND is_transferring = true`,
        [transfer.transfer_id]
      );
      transfer.family_members = familyResult.rows;
    }
    
    return NextResponse.json({
      success: true,
      transfers: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching transfers:', error);
    return NextResponse.json({ error: 'Failed to fetch transfers' }, { status: 500 });
  } finally {
    client.release();
  }
}
// app/api/service-requests/route.js
import { NextResponse } from 'next/server';
import { getClient } from '@/_lib/db';
import { getSession } from '@/_lib/auth';

// ============================================================
// BACKEND LOGIC - Service Request Management
// ============================================================

/**
 * Service Request Status Flow:
 * 
 * pending -> processing -> completed
 *    |           |            |
 *    v           v            v
 * rejected    rejected    (terminal)
 * 
 * Status Definitions:
 * - pending:   Initial state when request is created
 * - processing: Staff has started working on the request
 * - completed:  Service has been successfully delivered
 * - rejected:   Request was denied (with reason in notes)
 */

/**
 * Service Categories and Who Can Create:
 * 
 * ID Services (Record Officer, Kebele Manager):
 * - New ID Registration
 * - ID Renewal
 * - Lost ID Replacement
 * 
 * Civil Registration (Record Officer):
 * - Birth Certificate Issuance
 * - Death Certificate Registration
 * - Marriage Certificate Issuance
 * 
 * Social Services (Kebele Manager):
 * - Family Status Certificate
 * - Poverty Support Verification
 * - Disability Support Verification
 * 
 * Court Services (Kebele Manager):
 * - Social Court Case Registration
 * - Mediation Request
 * - Case Follow-up Service
 * 
 * Administrative Services (Both):
 * - Complaint Registration
 * - Announcement Request
 * - Letter of Recommendation
 */

// Helper function to check if user can create a service request
async function canCreateService(client, staffId, serviceName) {
  // Get user role
  const userResult = await client.query(
    `SELECT role FROM staff WHERE staff_id = $1`,
    [staffId]
  );
  
  if (userResult.rows.length === 0) {
    return { allowed: false, reason: 'User not found' };
  }
  
  const userRole = userResult.rows[0].role;
  
  // Define allowed services per role
  const recordOfficerServices = [
    'New ID Registration',
    'ID Renewal',
    'Lost ID Replacement',
    'Birth Certificate Issuance',
    'Death Certificate Registration',
    'Marriage Certificate Issuance'
  ];
  
  const kebeleManagerServices = [
    'New ID Registration',
    'ID Renewal',
    'Lost ID Replacement',
    'Family Status Certificate',
    'Poverty Support Verification',
    'Disability Support Verification',
    'Social Court Case Registration',
    'Mediation Request',
    'Case Follow-up Service',
    'Complaint Registration',
    'Announcement Request',
    'Letter of Recommendation'
  ];
  
  if (userRole === 'Record Officer' && recordOfficerServices.includes(serviceName)) {
    return { allowed: true, reason: '' };
  }
  
  if (userRole === 'Kebele Manager' && kebeleManagerServices.includes(serviceName)) {
    return { allowed: true, reason: '' };
  }
  
  if (userRole === 'System Administrator') {
    return { allowed: true, reason: '' };
  }
  
  return { 
    allowed: false, 
    reason: `Your role (${userRole}) cannot create ${serviceName} requests` 
  };
}

// Helper function to validate service request eligibility
async function validateServiceEligibility(client, resident_id, service_name) {
  // Check if resident exists and is active
  const residentCheck = await client.query(
    `SELECT is_active, status FROM resident WHERE resident_id = $1`,
    [resident_id]
  );
  
  if (residentCheck.rows.length === 0) {
    return { valid: false, message: 'Resident not found' };
  }
  
  const resident = residentCheck.rows[0];
  
  if (!resident.is_active) {
    return { valid: false, message: 'Resident is not active' };
  }
  
  if (resident.status === 'deceased') {
    return { valid: false, message: 'Cannot create requests for deceased residents' };
  }
  
  // For ID services, check if resident already has an active ID
  if (service_name === 'New ID Registration') {
    const existingID = await client.query(
      `SELECT id_card_id FROM id_card WHERE resident_id = $1 AND status = 'active'`,
      [resident_id]
    );
    
    if (existingID.rows.length > 0) {
      return { valid: false, message: 'Resident already has an active ID card' };
    }
  }
  
  // Check for duplicate pending request
  const duplicateCheck = await client.query(
    `SELECT sr.request_id, s.service_name
     FROM service_request sr
     JOIN service s ON s.service_id = sr.service_id
     WHERE sr.resident_id = $1 
       AND s.service_name = $2 
       AND sr.status = 'pending'`,
    [resident_id, service_name]
  );
  
  if (duplicateCheck.rows.length > 0) {
    return { 
      valid: false, 
      message: `Resident already has a pending request for ${service_name}` 
    };
  }
  
  return { valid: true, message: 'Eligible' };
}

// Helper function to create audit log entry
async function createAuditLog(client, staff_id, action, table_name, record_id, details) {
  await client.query(
    `INSERT INTO audit_log (
      staff_id, action, table_name, record_id, new_value, created_at
    ) VALUES ($1, $2, $3, $4, $5, NOW())`,
    [staff_id, action, table_name, record_id, JSON.stringify(details)]
  );
}

// Helper function to send notification (placeholder for future implementation)
async function sendNotification(resident_id, message) {
  console.log(`📧 Notification for resident ${resident_id}: ${message}`);
  return true;
}

// ============================================================
// MAIN API ENDPOINTS
// ============================================================

// GET - Fetch service requests with filters
export async function GET(request) {
  const client = await getClient();
  
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const residentId = searchParams.get('resident_id');
    const limit = parseInt(searchParams.get('limit')) || 100;

    let query = `
      SELECT 
        sr.request_id,
        sr.request_date,
        sr.completed_date,
        sr.status,
        sr.notes,
        CONCAT(r.fname, ' ', r.lname, ' ', COALESCE(r.grandfather_name, '')) as resident_name,
        r.resident_id,
        s.service_name,
        s.category,
        s.description as service_description
      FROM service_request sr
      JOIN resident r ON r.resident_id = sr.resident_id
      JOIN service s ON s.service_id = sr.service_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (category) {
      query += ` AND s.category = $${params.length + 1}`;
      params.push(category);
    }
    
    if (status) {
      query += ` AND sr.status = $${params.length + 1}`;
      params.push(status);
    }
    
    if (residentId) {
      query += ` AND r.resident_id = $${params.length + 1}`;
      params.push(residentId);
    }
    
    query += ` ORDER BY sr.request_date DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    
    const result = await client.query(query, params);
    
    return NextResponse.json({
      success: true,
      requests: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('Error fetching service requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service requests' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// POST - Create a service request (Both Record Officer and Kebele Manager can use this)
export async function POST(request) {
  const client = await getClient();
  
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { resident_id, service_name, notes } = await request.json();
    
    // Check if user can create this service
    const permission = await canCreateService(client, session.staff_id, service_name);
    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.reason },
        { status: 403 }
      );
    }
    
    // Validate eligibility
    const eligibility = await validateServiceEligibility(client, resident_id, service_name);
    if (!eligibility.valid) {
      return NextResponse.json(
        { error: eligibility.message },
        { status: 400 }
      );
    }
    
    // Get service_id
    const serviceResult = await client.query(
      `SELECT service_id FROM service WHERE service_name = $1`,
        [service_name]
    );
    
    if (serviceResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }
    
    // Generate request number
    const requestNumber = `SR-${Date.now()}-${resident_id}`;
    
    const result = await client.query(
      `INSERT INTO service_request (
        request_number, resident_id, service_id, status, request_date, notes, created_by
      ) VALUES ($1, $2, $3, 'pending', CURRENT_TIMESTAMP, $4, $5)
      RETURNING *`,
      [requestNumber, resident_id, serviceResult.rows[0].service_id, notes, session.staff_id]
    );
    
    // Create audit log entry
    await createAuditLog(
      client, 
      session.staff_id, 
      'INSERT', 
      'service_request', 
      result.rows[0].request_id,
      { action: 'Service request created', service_name, resident_id }
    );
    
    // Send notification (placeholder)
    await sendNotification(resident_id, `Your request for ${service_name} has been submitted successfully.`);
    
    return NextResponse.json({
      success: true,
      request: result.rows[0],
      message: 'Service request logged successfully'
    });
    
  } catch (error) {
    console.error('Error logging service request:', error);
    return NextResponse.json(
      { error: 'Failed to log service request' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// PUT - Update service request status
export async function PUT(request) {
  const client = await getClient();
  
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { request_id, status, notes } = await request.json();
    
    // Get current status and service info
    const currentRequest = await client.query(
      `SELECT sr.status, sr.resident_id, s.service_name 
       FROM service_request sr
       JOIN service s ON s.service_id = sr.service_id
       WHERE sr.request_id = $1`,
      [request_id]
    );
    
    if (currentRequest.rows.length === 0) {
      return NextResponse.json(
        { error: 'Service request not found' },
        { status: 404 }
      );
    }
    
    const currentStatus = currentRequest.rows[0].status;
    const resident_id = currentRequest.rows[0].resident_id;
    const service_name = currentRequest.rows[0].service_name;
    
    // Prevent modifications to completed requests
    if (currentStatus === 'completed' && status !== 'completed') {
      return NextResponse.json(
        { error: 'Completed requests cannot be modified' },
        { status: 400 }
      );
    }
    
    // Build update query
    let updateQuery = `UPDATE service_request SET status = $1`;
    const params = [status];
    
    if (status === 'completed') {
      updateQuery += `, completed_date = CURRENT_TIMESTAMP`;
    }
    
    if (notes) {
      updateQuery += `, notes = $${params.length + 1}`;
      params.push(notes);
    }
    
    updateQuery += `, updated_at = CURRENT_TIMESTAMP`;
    updateQuery += ` WHERE request_id = $${params.length + 1} RETURNING *`;
    params.push(request_id);
    
    const result = await client.query(updateQuery, params);
    
    // Send notification based on status change
    let notificationMessage = '';
    if (status === 'processing') {
      notificationMessage = `Your request for ${service_name} is now being processed.`;
    } else if (status === 'completed') {
      notificationMessage = `Your request for ${service_name} has been completed.`;
    } else if (status === 'rejected') {
      notificationMessage = `Your request for ${service_name} has been rejected. Please contact kebele office for more information.`;
    }
    
    if (notificationMessage) {
      await sendNotification(resident_id, notificationMessage);
    }
    
    // Create audit log entry
    await createAuditLog(
      client,
      session.staff_id,
      'UPDATE',
      'service_request',
      request_id,
      { old_status: currentStatus, new_status: status, action: 'Status updated' }
    );
    
    return NextResponse.json({
      success: true,
      request: result.rows[0],
      message: 'Service request updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating service request:', error);
    return NextResponse.json(
      { error: 'Failed to update service request' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// DELETE - Cancel a service request (only pending requests can be cancelled)
export async function DELETE(request) {
  const client = await getClient();
  
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const request_id = searchParams.get('request_id');
    
    if (!request_id) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }
    
    // Check if request exists and is pending
    const currentRequest = await client.query(
      `SELECT status FROM service_request WHERE request_id = $1`,
      [request_id]
    );
    
    if (currentRequest.rows.length === 0) {
      return NextResponse.json(
        { error: 'Service request not found' },
        { status: 404 }
      );
    }
    
    if (currentRequest.rows[0].status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending requests can be cancelled' },
        { status: 400 }
      );
    }
    
    // Cancel the request (update status to cancelled)
    const result = await client.query(
      `UPDATE service_request 
       SET status = 'cancelled', 
           notes = CONCAT(COALESCE(notes, ''), ' - Cancelled by staff'),
           updated_at = CURRENT_TIMESTAMP
       WHERE request_id = $1 
       RETURNING *`,
      [request_id]
    );
    
    // Create audit log entry
    await createAuditLog(
      client,
      session.staff_id,
      'DELETE',
      'service_request',
      request_id,
      { action: 'Service request cancelled' }
    );
    
    return NextResponse.json({
      success: true,
      request: result.rows[0],
      message: 'Service request cancelled successfully'
    });
    
  } catch (error) {
    console.error('Error cancelling service request:', error);
    return NextResponse.json(
      { error: 'Failed to cancel service request' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
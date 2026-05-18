import { NextResponse } from 'next/server';
import { getClient } from '@/_lib/db';
import { getSession } from '@/_lib/auth';

// GET - Fetch hearings for a case
export async function GET(request) {
  const client = await getClient();
  
  try {
    const session = await getSession(request); // ✅ Add 'request' parameter
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('case_id');
    
    if (!caseId) {
      return NextResponse.json({ error: 'Case ID is required' }, { status: 400 });
    }
    
    const result = await client.query(`
      SELECT * FROM hearing 
      WHERE case_id = $1 
      ORDER BY hearing_date DESC
    `, [caseId]);
    
    return NextResponse.json({
      success: true,
      hearings: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching hearings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hearings' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// POST - Schedule a hearing
export async function POST(request) {
  const client = await getClient();
  
  try {
    const session = await getSession(request); // ✅ Add 'request' parameter
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { case_id, hearing_date, location, hearing_type, notes } = await request.json();
    
    await client.query('BEGIN');
    
    const result = await client.query(`
      INSERT INTO hearing (case_id, hearing_date, location, hearing_type, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [case_id, hearing_date, location || 'Kebele Social Court', hearing_type || 'REGULAR', notes]);
    
    // Update case status to IN_PROGRESS if it was PENDING
    await client.query(`
      UPDATE social_court_case 
      SET status = 'IN_PROGRESS', updated_at = NOW()
      WHERE case_id = $1 AND status = 'PENDING'
    `, [case_id]);
    
    // Log service request for hearing
    const caseResult = await client.query(
      `SELECT plaintiff_id, defendant_id, case_number FROM social_court_case WHERE case_id = $1`,
      [case_id]
    );
    
    if (caseResult.rows.length > 0) {
      const caseData = caseResult.rows[0];
      if (caseData.plaintiff_id) {
        await client.query(
          `INSERT INTO service_request (resident_id, service_id, status, request_date, notes)
           VALUES ($1, (SELECT service_id FROM service WHERE service_name = 'Case Follow-up Service'), 'pending', CURRENT_TIMESTAMP, $2)`,
          [caseData.plaintiff_id, `Hearing scheduled for case ${caseData.case_number} on ${new Date(hearing_date).toLocaleDateString()}`]
        );
      }
    }
    
    await client.query('COMMIT');
    
    return NextResponse.json({
      success: true,
      hearing: result.rows[0],
      message: 'Hearing scheduled successfully'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error scheduling hearing:', error);
    return NextResponse.json(
      { error: 'Failed to schedule hearing' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// PUT - Update hearing outcome
export async function PUT(request) {
  const client = await getClient();
  
  try {
    const session = await getSession(request); // ✅ Add 'request' parameter
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { hearing_id, outcome, notes } = await request.json();
    
    const result = await client.query(`
      UPDATE hearing 
      SET outcome = COALESCE($1, outcome),
          notes = COALESCE($2, notes)
      WHERE hearing_id = $3
      RETURNING *
    `, [outcome, notes, hearing_id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Hearing not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      hearing: result.rows[0],
      message: 'Hearing updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating hearing:', error);
    return NextResponse.json(
      { error: 'Failed to update hearing' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
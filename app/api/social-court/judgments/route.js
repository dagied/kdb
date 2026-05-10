import { NextResponse } from 'next/server';
import { getClient } from '@/_lib/db';
import { getSession } from '@/_lib/auth';

// GET - Fetch judgment for a case
export async function GET(request) {
  const client = await getClient();
  
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('case_id');
    
    if (!caseId) {
      return NextResponse.json({ error: 'Case ID is required' }, { status: 400 });
    }
    
    const result = await client.query(`
      SELECT j.*, s.full_name as issued_by_name
      FROM judgment j
      LEFT JOIN staff s ON s.staff_id = j.issued_by
      WHERE j.case_id = $1
      ORDER BY j.judgment_date DESC
      LIMIT 1
    `, [caseId]);
    
    return NextResponse.json({
      success: true,
      judgment: result.rows[0] || null
    });
    
  } catch (error) {
    console.error('Error fetching judgment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch judgment' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// POST - Issue judgment
export async function POST(request) {
  const client = await getClient();
  
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { case_id, judgment_text, judgment_amount, appealed, appeal_deadline } = await request.json();
    
    if (!judgment_text) {
      return NextResponse.json(
        { error: 'Judgment text is required' },
        { status: 400 }
      );
    }
    
    await client.query('BEGIN');
    
    // Insert judgment
    const result = await client.query(`
      INSERT INTO judgment (case_id, judgment_text, judgment_amount, issued_by, appealed, appeal_deadline)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [case_id, judgment_text, judgment_amount, session.staff_id, appealed || false, appeal_deadline]);
    
    // Update case status to RESOLVED
    await client.query(`
      UPDATE social_court_case 
      SET status = 'RESOLVED', updated_at = NOW()
      WHERE case_id = $1
    `, [case_id]);
    
    // Get case details for service request
    const caseResult = await client.query(
      `SELECT plaintiff_id, defendant_id, case_number FROM social_court_case WHERE case_id = $1`,
      [case_id]
    );
    
    if (caseResult.rows.length > 0) {
      const caseData = caseResult.rows[0];
      
      // Log service request completion for plaintiff
      if (caseData.plaintiff_id) {
        await client.query(
          `INSERT INTO service_request (resident_id, service_id, status, request_date, notes)
           VALUES ($1, (SELECT service_id FROM service WHERE service_name = 'Case Follow-up Service'), 'completed', CURRENT_TIMESTAMP, $2)`,
          [caseData.plaintiff_id, `Judgment issued for case ${caseData.case_number}`]
        );
      }
      
      // Log service request completion for defendant
      if (caseData.defendant_id) {
        await client.query(
          `INSERT INTO service_request (resident_id, service_id, status, request_date, notes)
           VALUES ($1, (SELECT service_id FROM service WHERE service_name = 'Case Follow-up Service'), 'completed', CURRENT_TIMESTAMP, $2)`,
          [caseData.defendant_id, `Judgment issued for case ${caseData.case_number}`]
        );
      }
    }
    
    // Log to audit
    await client.query(
      `INSERT INTO audit_log (staff_id, action, table_name, record_id, new_value)
       VALUES ($1, 'INSERT', 'judgment', $2, $3)`,
      [session.staff_id, result.rows[0].judgment_id, JSON.stringify(result.rows[0])]
    );
    
    await client.query('COMMIT');
    
    return NextResponse.json({
      success: true,
      judgment: result.rows[0],
      message: 'Judgment issued successfully'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error issuing judgment:', error);
    return NextResponse.json(
      { error: 'Failed to issue judgment' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// PUT - Update appeal status
export async function PUT(request) {
  const client = await getClient();
  
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { judgment_id, appealed, appeal_deadline } = await request.json();
    
    const result = await client.query(`
      UPDATE judgment 
      SET appealed = $1,
          appeal_deadline = $2
      WHERE judgment_id = $3
      RETURNING *
    `, [appealed, appeal_deadline, judgment_id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Judgment not found' }, { status: 404 });
    }
    
    // Update case status if appealed
    if (appealed) {
      const judgmentResult = await client.query(
        `SELECT case_id FROM judgment WHERE judgment_id = $1`,
        [judgment_id]
      );
      
      if (judgmentResult.rows.length > 0) {
        await client.query(`
          UPDATE social_court_case 
          SET status = 'APPEALED', updated_at = NOW()
          WHERE case_id = $1
        `, [judgmentResult.rows[0].case_id]);
      }
    }
    
    return NextResponse.json({
      success: true,
      judgment: result.rows[0],
      message: 'Appeal status updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating appeal:', error);
    return NextResponse.json(
      { error: 'Failed to update appeal status' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
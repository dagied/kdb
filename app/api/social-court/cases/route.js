import { NextResponse } from 'next/server';
import { getClient } from '@/_lib/db';
import { getSession } from '@/_lib/auth';

// GET - Fetch all cases with filters
export async function GET(request) {
  const client = await getClient();
  
  try {
    const session = await getSession(request); // ✅ Add 'request' parameter
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const caseId = searchParams.get('case_id');
    
    let query = `
      SELECT 
        c.*,
        CONCAT(p.fname, ' ', p.lname) as plaintiff_full_name,
        CONCAT(d.fname, ' ', d.lname) as defendant_full_name,
        cr.full_name as created_by_name,
        COUNT(h.hearing_id) as hearing_count,
        (SELECT judgment_text FROM judgment j WHERE j.case_id = c.case_id ORDER BY j.judgment_date DESC LIMIT 1) as latest_judgment,
        (SELECT json_agg(json_build_object('judge_id', j.judge_id, 'name', j.full_name, 'experience_years', j.experience_years))
         FROM judges j 
         WHERE j.judge_id = ANY(c.assigned_judge_ids)) as assigned_judges
      FROM social_court_case c
      LEFT JOIN resident p ON p.resident_id = c.plaintiff_id
      LEFT JOIN resident d ON d.resident_id = c.defendant_id
      LEFT JOIN staff cr ON cr.staff_id = c.created_by
      LEFT JOIN hearing h ON h.case_id = c.case_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (caseId) {
      query += ` AND c.case_id = $${params.length + 1}`;
      params.push(caseId);
    }
    
    if (status && status !== 'all') {
      query += ` AND c.status = $${params.length + 1}`;
      params.push(status);
    }
    
    if (search) {
      query += ` AND (c.case_number ILIKE $${params.length + 1} 
                OR p.fname ILIKE $${params.length + 1} 
                OR p.lname ILIKE $${params.length + 1}
                OR d.fname ILIKE $${params.length + 1}
                OR d.lname ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }
    
    query += ` GROUP BY c.case_id, p.fname, p.lname, d.fname, d.lname, cr.full_name ORDER BY c.case_id DESC`;
    
    const result = await client.query(query, params);
    
    return NextResponse.json({
      success: true,
      cases: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching cases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cases' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// POST - Create new case
export async function POST(request) {
  const client = await getClient();
  
  try {
    const session = await getSession(request); // ✅ Add 'request' parameter
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { 
      plaintiff_id, plaintiff_name, defendant_id, defendant_name,
      case_type, claim_amount, description, assigned_judge_ids
    } = body;
    
    // Validate required fields
    if (!plaintiff_name || !defendant_name || !case_type || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: plaintiff, defendant, case type, and description are required' },
        { status: 400 }
      );
    }
    
    // Validate judges selection
    if (!assigned_judge_ids || assigned_judge_ids.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one judge for this case' },
        { status: 400 }
      );
    }
    
    if (assigned_judge_ids.length > 3) {
      return NextResponse.json(
        { error: 'You can select up to 3 judges only' },
        { status: 400 }
      );
    }
    
    // Clean claim amount - convert empty string to null
    const cleanClaimAmount = (claim_amount === '' || claim_amount === null || isNaN(claim_amount)) 
      ? null 
      : parseFloat(claim_amount);
    
    await client.query('BEGIN');
    
    // Insert case with array of judge IDs
    const result = await client.query(
      `INSERT INTO social_court_case (
        plaintiff_id, plaintiff_name, defendant_id, defendant_name,
        case_type, claim_amount, description, assigned_judge_ids, created_by, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING')
      RETURNING *`,
      [
        plaintiff_id || null, 
        plaintiff_name, 
        defendant_id || null, 
        defendant_name,
        case_type, 
        cleanClaimAmount, 
        description, 
        assigned_judge_ids, // This is an array of integers
        session.staff_id
      ]
    );
    
    const newCase = result.rows[0];
    
    // Log service request for AI prediction for plaintiff
    if (plaintiff_id) {
      await client.query(
        `INSERT INTO service_request (resident_id, service_id, status, request_date, notes)
         VALUES ($1, (SELECT service_id FROM service WHERE service_name = 'Social Court Case Registration'), 'pending', CURRENT_TIMESTAMP, $2)`,
        [plaintiff_id, `Case filed: ${newCase.case_number}`]
      );
    }
    
    // Log service request for AI prediction for defendant
    if (defendant_id) {
      await client.query(
        `INSERT INTO service_request (resident_id, service_id, status, request_date, notes)
         VALUES ($1, (SELECT service_id FROM service WHERE service_name = 'Social Court Case Registration'), 'pending', CURRENT_TIMESTAMP, $2)`,
        [defendant_id, `Case filed against you: ${newCase.case_number}`]
      );
    }
    
    // Log to audit
    await client.query(
      `INSERT INTO audit_log (staff_id, action, table_name, record_id, new_value)
       VALUES ($1, 'INSERT', 'social_court_case', $2, $3)`,
      [session.staff_id, newCase.case_id, JSON.stringify(newCase)]
    );
    
    await client.query('COMMIT');
    
    return NextResponse.json({
      success: true,
      case: newCase,
      message: 'Case filed successfully'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating case:', error);
    return NextResponse.json(
      { error: 'Failed to create case: ' + error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// PUT - Update case
export async function PUT(request) {
  const client = await getClient();
  
  try {
    const session = await getSession(request); // ✅ Add 'request' parameter
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { case_id, status, description } = body;
    
    await client.query('BEGIN');
    
    const result = await client.query(`
      UPDATE social_court_case 
      SET status = COALESCE($1, status),
          description = COALESCE($2, description),
          updated_at = NOW()
      WHERE case_id = $3
      RETURNING *
    `, [status, description, case_id]);
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    
    await client.query('COMMIT');
    
    return NextResponse.json({
      success: true,
      case: result.rows[0],
      message: 'Case updated successfully'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating case:', error);
    return NextResponse.json(
      { error: 'Failed to update case' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
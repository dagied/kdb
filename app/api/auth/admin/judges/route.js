import { NextResponse } from 'next/server';
import { getClient } from '@/_lib/db';
import { getSession } from '@/_lib/auth';

// GET - Fetch all judges
export async function GET(request) {
  const client = await getClient();
  
  try {
    const session = await getSession();
    
    // Allow System Administrator AND Kebele Manager to view judges
    if (!session || (session.role !== 'System Administrator' && session.role !== 'Kebele Manager')) {
      console.log('Unauthorized access attempt. Role:', session?.role);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';
    
    let query = `
      SELECT 
        judge_id,
        full_name,
        phone,
        email,
        address,
        date_of_birth,
        gender,
        education_level,
        experience_years,
        community_approved,
        is_active,
        created_at
      FROM judges
      WHERE 1=1
    `;
    
    if (activeOnly) {
      query += ` AND is_active = true`;
    }
    
    query += ` ORDER BY full_name ASC`;
    
    const result = await client.query(query);
    
    console.log('Judges found:', result.rows.length);
    
    return NextResponse.json({
      success: true,
      judges: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching judges:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch judges: ' + error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// POST - Create a new judge (Admin only)
export async function POST(request) {
  const client = await getClient();
  
  try {
    const session = await getSession();
    
    // Only System Administrator can create judges
    if (!session || session.role !== 'System Administrator') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { 
      full_name, phone, email, address, date_of_birth, gender,
      education_level, experience_years, community_approved,
      approval_notes
    } = body;
    
    if (!full_name) {
      return NextResponse.json(
        { error: 'Full name is required' },
        { status: 400 }
      );
    }
    
    await client.query('BEGIN');
    
    const result = await client.query(`
      INSERT INTO judges (
        full_name, phone, email, address, date_of_birth, gender,
        education_level, experience_years, community_approved,
        approval_notes, created_by, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
      RETURNING *
    `, [
      full_name, phone, email, address, date_of_birth, gender,
      education_level, experience_years, community_approved || false,
      approval_notes, session.staff_id
    ]);
    
    await client.query('COMMIT');
    
    return NextResponse.json({
      success: true,
      judge: result.rows[0],
      message: 'Judge added successfully'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating judge:', error);
    return NextResponse.json(
      { error: 'Failed to create judge' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// PUT - Update judge (Admin only)
export async function PUT(request) {
  const client = await getClient();
  
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'System Administrator') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { judge_id, full_name, phone, email, address, date_of_birth, gender,
            education_level, experience_years, is_active } = body;
    
    await client.query('BEGIN');
    
    const result = await client.query(`
      UPDATE judges 
      SET full_name = COALESCE($1, full_name),
          phone = COALESCE($2, phone),
          email = COALESCE($3, email),
          address = COALESCE($4, address),
          date_of_birth = COALESCE($5, date_of_birth),
          gender = COALESCE($6, gender),
          education_level = COALESCE($7, education_level),
          experience_years = COALESCE($8, experience_years),
          is_active = COALESCE($9, is_active),
          updated_at = NOW()
      WHERE judge_id = $10
      RETURNING *
    `, [full_name, phone, email, address, date_of_birth, gender,
        education_level, experience_years, is_active, judge_id]);
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Judge not found' }, { status: 404 });
    }
    
    await client.query('COMMIT');
    
    return NextResponse.json({
      success: true,
      judge: result.rows[0],
      message: 'Judge updated successfully'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating judge:', error);
    return NextResponse.json(
      { error: 'Failed to update judge' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// DELETE - Soft delete judge (Admin only)
export async function DELETE(request) {
  const client = await getClient();
  
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'System Administrator') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const judgeId = searchParams.get('id');
    
    if (!judgeId) {
      return NextResponse.json({ error: 'Judge ID required' }, { status: 400 });
    }
    
    await client.query(`
      UPDATE judges SET is_active = false, updated_at = NOW()
      WHERE judge_id = $1
    `, [judgeId]);
    
    return NextResponse.json({
      success: true,
      message: 'Judge removed successfully'
    });
    
  } catch (error) {
    console.error('Error deleting judge:', error);
    return NextResponse.json(
      { error: 'Failed to delete judge' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
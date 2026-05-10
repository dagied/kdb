import { NextResponse } from 'next/server';
import { getClient } from '@/_lib/db';
import { getSession } from '@/_lib/auth';

// GET - Fetch all kebeles
export async function GET(request) {
  const client = await getClient();
  
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await client.query(`
      SELECT 
        kebele_id,
        kebele_name,
        description,
        created_at
      FROM kebele
      ORDER BY kebele_name
    `);

    return NextResponse.json({
      success: true,
      kebeles: result.rows
    });

  } catch (error) {
    console.error('Error fetching kebeles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch kebeles', kebeles: [] },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// POST - Create a new kebele
export async function POST(request) {
  const client = await getClient();
  
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'System Administrator') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { kebele_name, description } = await request.json();

    if (!kebele_name || !kebele_name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Kebele name is required' },
        { status: 400 }
      );
    }

    // Check if kebele already exists
    const existingCheck = await client.query(
      `SELECT kebele_id FROM kebele WHERE kebele_name = $1`,
      [kebele_name.trim()]
    );

    if (existingCheck.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'A kebele with this name already exists' },
        { status: 409 }
      );
    }

    const result = await client.query(
      `INSERT INTO kebele (kebele_name, description)
       VALUES ($1, $2)
       RETURNING kebele_id, kebele_name, description, created_at`,
      [kebele_name.trim(), description || null]
    );

    return NextResponse.json({
      success: true,
      kebele: result.rows[0],
      message: 'Kebele created successfully'
    });

  } catch (error) {
    console.error('Error creating kebele:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create kebele' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
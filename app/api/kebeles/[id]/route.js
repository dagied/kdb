import { NextResponse } from 'next/server';
import { getClient } from '@/_lib/db';
import { getSession } from '@/_lib/auth';

// PUT - Update a kebele
export async function PUT(request, { params }) {
  const client = await getClient();
  
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'System Administrator') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { kebele_name, description } = await request.json();

    if (!kebele_name || !kebele_name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Kebele name is required' },
        { status: 400 }
      );
    }

    // Check if another kebele has the same name
    const existingCheck = await client.query(
      `SELECT kebele_id FROM kebele 
       WHERE kebele_name = $1 AND kebele_id != $2`,
      [kebele_name.trim(), id]
    );

    if (existingCheck.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Another kebele with this name already exists' },
        { status: 409 }
      );
    }

    const result = await client.query(
      `UPDATE kebele 
       SET kebele_name = $1, description = $2, updated_at = NOW()
       WHERE kebele_id = $3
       RETURNING kebele_id, kebele_name, description, created_at`,
      [kebele_name.trim(), description || null, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Kebele not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      kebele: result.rows[0],
      message: 'Kebele updated successfully'
    });

  } catch (error) {
    console.error('Error updating kebele:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update kebele' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// DELETE - Delete a kebele
export async function DELETE(request, { params }) {
  const client = await getClient();
  
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'System Administrator') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if kebele has related houses
    const houseCheck = await client.query(
      `SELECT COUNT(*) FROM house WHERE kebele_id = $1`,
      [id]
    );

    if (parseInt(houseCheck.rows[0].count) > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete kebele with existing houses. Reassign houses first.' },
        { status: 409 }
      );
    }

    const result = await client.query(
      `DELETE FROM kebele WHERE kebele_id = $1 RETURNING kebele_id`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Kebele not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Kebele deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting kebele:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete kebele' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
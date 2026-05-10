import { NextResponse } from 'next/server';
import { getClient } from '@/_lib/db';
import { getSession } from '@/_lib/auth';

/**
 * GET /api/houses/[houseId]
 * 
 * Look up a house by its ID
 */
export async function GET(request, { params }) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const client = await getClient();
  
  try {
    const { houseId } = await params;
    
    const result = await client.query(
      `SELECT h.house_id, h.house_no, h.kebele_id, h.zone, k.kebele_name
       FROM house h
       JOIN kebele k ON k.kebele_id = h.kebele_id
       WHERE h.house_id = $1`,
      [houseId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: `House "${houseId}" not found.` },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
    
  } catch (error) {
    console.error('Error searching house:', error);
    return NextResponse.json(
      { message: 'Failed to search house' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
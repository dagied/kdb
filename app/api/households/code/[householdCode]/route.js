import { NextResponse } from 'next/server';
import { getClient } from '@/_lib/db';
import { getSession } from '@/_lib/auth';

/**
 * GET /api/households/code/[householdCode]
 * 
 * Search for a household by its household_code (e.g., HH-0001)
 */
export async function GET(request, { params }) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const client = await getClient();
  
  try {
    const { householdCode } = await params;
    
    // Search for household by household_code
    const result = await client.query(
      `SELECT 
         hh.household_id,
         hh.household_code,
         hh.house_id,
         hh.kebele_id,
         hh.head_resident_id,
         CONCAT(r.fname, ' ', r.lname) AS head_name,
         (SELECT COUNT(*) FROM resident WHERE household_id = hh.household_id AND is_active = true) AS member_count
       FROM household hh
       LEFT JOIN resident r ON r.resident_id = hh.head_resident_id AND r.is_head = true
       WHERE hh.household_code = $1`,
      [householdCode]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: `Household with code "${householdCode}" not found.` },
        { status: 404 }
      );
    }
    
    // Get household members
    const membersResult = await client.query(
      `SELECT 
         r.resident_id,
         CONCAT(r.fname, ' ', r.lname, ' ', COALESCE(r.grandfather_name, '')) AS full_name,
         r.sex AS gender,
         r.household_role,
         r.is_head,
         r.is_active
       FROM resident r
       WHERE r.household_id = $1
         AND r.is_active = true
       ORDER BY r.is_head DESC, r.fname`,
      [result.rows[0].household_id]
    );
    
    return NextResponse.json({
      ...result.rows[0],
      members: membersResult.rows
    });
    
  } catch (error) {
    console.error('Error searching household:', error);
    return NextResponse.json(
      { message: 'Failed to search household' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
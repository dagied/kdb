import { NextResponse } from 'next/server';
import { getSession } from '@/_lib/auth';
import { getClient } from '@/_lib/db';

/**
 * GET /api/residents/[id]
 * 
 * Fetch a single resident by ID with all details
 */
export async function GET(request, { params }) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const client = await getClient();
    
    try {
      const result = await client.query(`
        SELECT 
          r.*,
          hh.household_code,
          j.job_title,
          COALESCE(
            (SELECT array_agg(rc.phone) FROM resident_contact rc WHERE rc.resident_id = r.resident_id),
            '{}'
          ) as phones
        FROM resident r
        LEFT JOIN household hh ON hh.household_id = r.household_id
        LEFT JOIN job j ON j.job_id = r.job_id
        WHERE r.resident_id = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Resident not found.' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        resident: result.rows[0]
      });
      
    } finally {
      client.release();
    }
    
  } catch (err) {
    console.error('[GET /api/residents/[id]]', err);
    return NextResponse.json(
      { success: false, message: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { getClient } from '@/_lib/db';
import { getSession } from '@/_lib/auth';

export async function GET(request) {
  const client = await getClient();
  
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'System Administrator') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await client.query(`
      SELECT 
        s.staff_id,
        s.full_name,
        s.phone,
        s.email,
        s.gender,
        s.is_active,
        s.created_at,
        a.username,
        a.email as account_email,
        r.role_name
      FROM staff s
      JOIN account a ON s.account_id = a.account_id
      JOIN system_role r ON s.role_id = r.role_id
      ORDER BY s.staff_id DESC
    `);

    // Ensure we always return an array, even if empty
    const staffList = result.rows.map(row => ({
      staff_id: row.staff_id,
      full_name: row.full_name,
      phone: row.phone,
      email: row.email || row.account_email,
      gender: row.gender,
      role_name: row.role_name,
      is_active: row.is_active,
      created_at: row.created_at
    }));

    return NextResponse.json(staffList);

  } catch (error) {
    console.error('Error fetching staff:', error);
    // Return empty array instead of error to prevent frontend crash
    return NextResponse.json([], { status: 200 });
  } finally {
    client.release();
  }
}
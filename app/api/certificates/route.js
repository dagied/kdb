import { NextResponse } from 'next/server';
import { getClient } from '@/_lib/db';
import { getSession } from '@/_lib/auth';

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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit'), 10);
    const limitClause = Number.isInteger(limit) && limit > 0 ? ` LIMIT ${limit}` : '';

    const birthResult = await client.query(
      `SELECT birth_id FROM birth_certificate ORDER BY birth_id DESC${limitClause}`
    );
    const deathResult = await client.query(
      `SELECT death_id FROM death_certificate ORDER BY death_id DESC${limitClause}`
    );
    const marriageResult = await client.query(
      `SELECT marriage_id FROM marriage_certificate ORDER BY marriage_id DESC${limitClause}`
    );

    const certificates = [
      ...birthResult.rows.map((row) => ({ type: 'birth', id: row.birth_id })),
      ...deathResult.rows.map((row) => ({ type: 'death', id: row.death_id })),
      ...marriageResult.rows.map((row) => ({ type: 'marriage', id: row.marriage_id }))
    ];

    return NextResponse.json({
      success: true,
      certificates,
      count: certificates.length
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch certificates', certificates: [] },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

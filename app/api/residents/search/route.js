import { NextResponse } from 'next/server';
import { getClient } from '@/_lib/db';
import { getSession } from '@/_lib/auth';

export async function GET(request) {
  let client;
  
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'name';

    console.log(`Searching: query="${query}", type="${type}"`);

    if (!query || query.trim() === '') {
      return NextResponse.json({ success: true, residents: [] });
    }

    client = await getClient();
    
    // Query with only columns that exist in resident table
    let sqlQuery = `
      SELECT 
        r.resident_id,
        r.fname,
        r.lname,
        r.grandfather_name,
        r.sex,
        r.birthdate,
        r.marital_status,
        r.house_id,
        r.household_id,
        r.household_role,
        r.is_head,
        r.national_id,
        r.place_of_birth,
        r.fname_am,
        r.lname_am,
        hh.household_code,
        (SELECT COUNT(*) FROM resident WHERE household_id = r.household_id AND is_active = true) as household_members_count
      FROM resident r
      LEFT JOIN household hh ON hh.household_id = r.household_id
      WHERE r.is_active = true
    `;
    
    const params = [];
    const searchTerm = `%${query.trim()}%`;
    
    if (type === 'name') {
      sqlQuery += ` AND (r.fname ILIKE $1 OR r.lname ILIKE $1 OR r.grandfather_name ILIKE $1 OR r.fname_am ILIKE $1 OR r.lname_am ILIKE $1)`;
      params.push(searchTerm);
    } else if (type === 'house') {
      // house_id is text in your schema
      sqlQuery += ` AND r.house_id ILIKE $1`;
      params.push(searchTerm);
    } else if (type === 'household') {
      sqlQuery += ` AND hh.household_code ILIKE $1`;
      params.push(searchTerm);
    }
    
    sqlQuery += ` ORDER BY r.fname LIMIT 20`;
    
    console.log('Executing query');
    const result = await client.query(sqlQuery, params);
    
    console.log(`Found ${result.rows.length} residents`);
    
    return NextResponse.json({
      success: true,
      residents: result.rows
    });
    
  } catch (error) {
    console.error('Search error details:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to search residents'
      },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
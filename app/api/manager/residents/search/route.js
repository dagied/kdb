// app/api/manager/residents/search/route.js
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
    
    let sqlQuery = `
      SELECT 
        r.resident_id,
        r.fname,
        r.lname,
        r.mname,
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
        r.mname_am,
        r.phone_number,
        r.is_active,
        r.status,
        hh.household_code,
        h.house_no
      FROM resident r
      LEFT JOIN household hh ON hh.household_id = r.household_id
      LEFT JOIN house h ON h.house_id = r.house_id
      WHERE r.is_active = true AND r.status = 'active'
    `;
    
    const params = [];
    const searchTerm = `%${query.trim()}%`;
    
    if (type === 'name') {
      sqlQuery += ` AND (r.fname ILIKE $1 OR r.lname ILIKE $1 OR r.mname ILIKE $1 OR r.grandfather_name ILIKE $1 OR r.fname_am ILIKE $1 OR r.lname_am ILIKE $1 OR r.mname_am ILIKE $1)`;
      params.push(searchTerm);
    } else if (type === 'house') {
      sqlQuery += ` AND (r.house_id ILIKE $1 OR h.house_no ILIKE $1)`;
      params.push(searchTerm);
    } else if (type === 'household') {
      sqlQuery += ` AND hh.household_code ILIKE $1`;
      params.push(searchTerm);
    }
    
    sqlQuery += ` ORDER BY r.fname LIMIT 20`;
    
    console.log('Executing query');
    const result = await client.query(sqlQuery, params);
    
    console.log(`Found ${result.rows.length} residents`);
    
    // Format the response
    const residents = result.rows.map(row => ({
      resident_id: row.resident_id,
      full_name: `${row.fname} ${row.lname || ''} ${row.grandfather_name || ''}`.trim(),
      first_name: row.fname,
      last_name: row.lname,
      middle_name: row.mname,
      father_name: row.lname, // Use lname as father's name
      grandfather_name: row.grandfather_name,
      house_number: row.house_no || row.house_id,
      house_id: row.house_id,
      household_id: row.household_id,
      household_code: row.household_code,
      household_role: row.household_role,
      is_head: row.is_head,
      sex: row.sex,
      birthdate: row.birthdate,
      marital_status: row.marital_status,
      national_id: row.national_id,
      place_of_birth: row.place_of_birth,
      phone_number: row.phone_number,
      fname_am: row.fname_am,
      lname_am: row.lname_am,
      mname_am: row.mname_am,
      is_active: row.is_active
    }));
    
    return NextResponse.json({
      success: true,
      residents: residents
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
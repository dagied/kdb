// app/api/manager/id-card/active/route.js
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
    const residentId = searchParams.get('residentId');

    if (!residentId) {
      return NextResponse.json(
        { error: 'residentId is required' },
        { status: 400 }
      );
    }

    client = await getClient();
    
    const result = await client.query(
      `SELECT 
        ic.id_card_id,
        ic.id_number,
        ic.resident_id,
        ic.full_name,
        ic.full_name_am,
        ic.father_name,
        ic.grandfather_name,
        ic.sex,
        ic.birth_date_gc,
        ic.issue_date_gc,
        ic.expiry_date_gc,
        ic.status,
        ic.issue_number,
        ic.house_number,
        ic.phone_number,
        ic.photo_url,
        r.fname,
        r.lname,
        r.mname,
        r.birthdate,
        r.house_id
      FROM id_card ic
      LEFT JOIN resident r ON r.resident_id = ic.resident_id
      WHERE ic.resident_id = $1 AND ic.status = 'active'
      ORDER BY ic.issue_date_gc DESC
      LIMIT 1`,
      [residentId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({
        success: true,
        idCard: null,
        message: 'No active ID card found'
      });
    }
    
    const row = result.rows[0];
    
    return NextResponse.json({
      success: true,
      idCard: {
        id_card_id: row.id_card_id,
        id_number: row.id_number,
        resident_id: row.resident_id,
        full_name: row.full_name || `${row.fname} ${row.lname || ''}`,
        full_name_am: row.full_name_am,
        father_name: row.father_name || row.lname,
        grandfather_name: row.grandfather_name,
        gender: row.sex,
        birth_date_gc: row.birth_date_gc || row.birthdate,
        issue_date_gc: row.issue_date_gc,
        expiry_date_gc: row.expiry_date_gc,
        status: row.status,
        issue_number: row.issue_number,
        house_number: row.house_number || row.house_id,
        phone_number: row.phone_number,
        photo_url: row.photo_url
      },
      resident: {
        resident_id: row.resident_id,
        fname: row.fname,
        lname: row.lname,
        house_id: row.house_id
      }
    });
    
  } catch (error) {
    console.error('Error fetching active ID card:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch active ID card'
      },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
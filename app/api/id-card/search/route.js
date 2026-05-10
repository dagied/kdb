import { NextResponse } from 'next/server';
import { getClient } from '@/_lib/db';
import { getSession } from '@/_lib/auth';

export async function GET(request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const idNumber = searchParams.get('id_number');
  
  if (!idNumber) {
    return NextResponse.json({ error: 'ID number is required' }, { status: 400 });
  }

  const client = await getClient();
  
  try {
    const result = await client.query(
      `SELECT 
        id_card_id, id_number, resident_id, full_name, full_name_am,
        father_name, father_name_am, sex, birth_date_gc, birth_date_ec,
        issue_date_gc, issue_date_ec, expiry_date_gc, expiry_date_ec,
        status, place_of_birth, phone, residence
       FROM id_card 
       WHERE id_number = $1 AND status != 'renewed'`,
      [idNumber]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID card not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      card: result.rows[0] 
    });
    
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to search ID card' 
    }, { status: 500 });
  } finally {
    client.release();
  }
}
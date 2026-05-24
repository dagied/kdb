import { NextResponse } from 'next/server';
import { getClient } from '@/_lib/db';
import { getSession } from '@/_lib/auth';

export async function GET(request) {
  const client = await getClient();
  
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const residentId = searchParams.get('resident_id');
    
    if (!residentId) {
      return NextResponse.json({ error: 'resident_id is required' }, { status: 400 });
    }
    
    const result = await client.query(
      `SELECT id_card_id, id_number, expiry_date_gc, issue_date_gc 
       FROM id_card 
       WHERE resident_id = $1 AND status = 'active'`,
      [residentId]
    );
    
    const hasActiveId = result.rows.length > 0;
    const today = new Date().toISOString().split('T')[0];
    const isExpired = hasActiveId && result.rows[0].expiry_date_gc < today;
    
    return NextResponse.json({
      has_active_id: hasActiveId && !isExpired,
      id_number: result.rows[0]?.id_number || null,
      id_card_id: result.rows[0]?.id_card_id || null,
      issue_date: result.rows[0]?.issue_date_gc || null,
      expiry_date: result.rows[0]?.expiry_date_gc || null,
      is_expired: isExpired
    });
    
  } catch (error) {
    console.error('Error checking ID status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
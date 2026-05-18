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
    const isActive = searchParams.get('is_active');
    
    let query = `SELECT region_id, name_en, name_am, name_om, sort_order 
                 FROM regions WHERE is_active = true 
                 ORDER BY sort_order, name_en`;
    
    const result = await client.query(query);
    
    return NextResponse.json({
      success: true,
      regions: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching regions:', error);
    return NextResponse.json({ error: 'Failed to fetch regions' }, { status: 500 });
  } finally {
    client.release();
  }
}
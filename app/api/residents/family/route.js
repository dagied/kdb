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
    
    // Get the main resident's house_id
    const mainResident = await client.query(
      `SELECT house_id FROM resident WHERE resident_id = $1`,
      [residentId]
    );
    
    if (mainResident.rows.length === 0) {
      return NextResponse.json({ error: 'Resident not found' }, { status: 404 });
    }
    
    const houseId = mainResident.rows[0].house_id;
    
    // Get family members with their relationships
    const result = await client.query(`
      SELECT 
        r.resident_id,
        r.fname,
        r.lname,
        r.fname_am,
        r.lname_am,
        r.house_id,
        CASE 
          WHEN r.relationship_to_head = 'Head' THEN 'Head of Household'
          WHEN r.relationship_to_head = 'Spouse' THEN 'Spouse'
          WHEN r.relationship_to_head = 'Child' THEN 'Child'
          ELSE 'Family Member'
        END as relationship_display
      FROM resident r
      WHERE r.house_id = $1
      AND r.resident_id != $2
      AND r.status != 'transferred'
      AND r.is_active = true
    `, [houseId, residentId]);
    
    // Format family members
    const family = result.rows.map(member => ({
      resident_id: member.resident_id,
      name: `${member.fname} ${member.lname}`,
      name_am: member.fname_am && member.lname_am ? `${member.fname_am} ${member.lname_am}` : '',
      relationship: member.relationship_display,
      house_id: member.house_id
    }));
    
    return NextResponse.json({
      success: true,
      family: family
    });
    
  } catch (error) {
    console.error('Error fetching family members:', error);
    return NextResponse.json({ error: 'Failed to fetch family members' }, { status: 500 });
  } finally {
    client.release();
  }
}
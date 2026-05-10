import { NextResponse } from 'next/server';
import { getClient } from '@/_lib/db';
import { getSession } from '@/_lib/auth';
import { gregorianToEthiopian } from '@/utils/calendar';

export async function PUT(request) {
  const client = await getClient();
  
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id_number, resident_id } = await request.json();
    
    // Calculate new expiry date (4 years from now)
    const renewalDate = new Date();
    const newExpiryDate = new Date();
    newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 4);
    
    const renewalEc = gregorianToEthiopian(renewalDate);
    const newExpiryEc = gregorianToEthiopian(newExpiryDate);
    
    // Get old ID info
    const oldCard = await client.query(
      `SELECT * FROM id_card WHERE id_number = $1`,
      [id_number]
    );
    
    if (oldCard.rows.length === 0) {
      return NextResponse.json({ error: 'ID card not found' }, { status: 404 });
    }
    
    await client.query('BEGIN');
    
    // Update the ID card with new expiry
    const result = await client.query(
      `UPDATE id_card 
       SET expiry_date_gc = $1, expiry_date_ec = $2,
           status = 'active', updated_at = NOW()
       WHERE id_number = $3
       RETURNING id_number, expiry_date_gc, expiry_date_ec`,
      [newExpiryDate.toISOString().split('T')[0], newExpiryEc.formattedEc, id_number]
    );
    
    // Record renewal
    await client.query(
      `INSERT INTO id_renewal (
        resident_id, old_id_number, new_id_number,
        renewal_date_gc, renewal_date_ec, previous_expiry_gc,
        new_expiry_gc, processed_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        resident_id, id_number, id_number,
        renewalDate.toISOString().split('T')[0], renewalEc.formattedEc,
        oldCard.rows[0].expiry_date_gc,
        newExpiryDate.toISOString().split('T')[0],
        session.staff_id
      ]
    );
    
    // ✅ ADD SERVICE REQUEST - ID Renewal
    await client.query(
      `INSERT INTO service_request (resident_id, service_id, status, request_date, notes)
       VALUES ($1, (SELECT service_id FROM service WHERE service_name = 'ID Renewal'), 'completed', CURRENT_TIMESTAMP, $2)`,
      [resident_id, `ID card renewed: ${id_number}, new expiry: ${newExpiryDate.toISOString().split('T')[0]}`]
    );
    
    await client.query('COMMIT');
    
    return NextResponse.json({
      success: true,
      id_number: result.rows[0].id_number,
      new_expiry_date: result.rows[0].expiry_date_gc,
      new_expiry_date_ec: result.rows[0].expiry_date_ec,
      message: 'ID card renewed successfully'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error renewing ID card:', error);
    return NextResponse.json({ error: 'Failed to renew ID card' }, { status: 500 });
  } finally {
    client.release();
  }
}
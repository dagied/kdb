// app/api/manager/lost-id/route.js
import { NextResponse } from 'next/server';
import { getClient } from '@/_lib/db';
import { getSession } from '@/_lib/auth';

export async function POST(request) {
  const client = await getClient();
  
  try {
    console.log('🚀 Starting Lost ID deactivation...');
    
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { resident_id, police_report_number } = body;

    console.log('Resident ID:', resident_id);

    if (!resident_id) {
      return NextResponse.json(
        { success: false, message: 'Resident ID is required' },
        { status: 400 }
      );
    }

    // ============================================================
    // STEP 1: GET CURRENT ACTIVE ID CARD
    // ============================================================
    const activeIdCard = await client.query(
      `SELECT id_card_id, id_number, status 
       FROM id_card 
       WHERE resident_id = $1 AND status = 'active'`,
      [resident_id]
    );

    if (activeIdCard.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No active ID card found for this resident' },
        { status: 404 }
      );
    }

    const oldIdCard = activeIdCard.rows[0];
    console.log('Found active ID to cancel:', oldIdCard.id_number);

    // ============================================================
    // STEP 2: CANCEL THE ID - SIMPLE UPDATE (NO TRANSACTION)
    // ============================================================
    const updateResult = await client.query(
      `UPDATE id_card 
       SET status = 'cancelled', 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id_card_id = $1 
       AND status = 'active'
       RETURNING id_card_id, id_number, status`,
      [oldIdCard.id_card_id]
    );

    if (updateResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Failed to cancel the ID card' },
        { status: 500 }
      );
    }
    
    console.log('✅ ID cancelled. New status:', updateResult.rows[0].status);

    // ============================================================
    // STEP 3: Get resident info for response
    // ============================================================
    const residentInfo = await client.query(
      `SELECT r.fname, r.lname, r.grandfather_name, h.house_no 
       FROM resident r
       LEFT JOIN house h ON h.house_id = r.house_id
       WHERE r.resident_id = $1`,
      [resident_id]
    );

    const resident = residentInfo.rows[0];
    const fullName = `${resident.fname} ${resident.lname || ''} ${resident.grandfather_name || ''}`.trim();
    const houseNumber = resident.house_no || '';

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Lost ID has been cancelled successfully',
      data: {
        old_id: {
          id_card_id: oldIdCard.id_card_id,
          id_number: oldIdCard.id_number,
          status: 'cancelled'
        },
        resident: {
          resident_id: resident_id,
          full_name: fullName,
          house_number: houseNumber
        },
        confirmation_slip: {
          slip_number: `LOST-${Date.now()}`,
          report_date: new Date().toISOString().split('T')[0],
          police_report: police_report_number || 'Not provided',
          verified_by: session.name || session.email || 'Kebele Manager'
        }
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to cancel lost ID: ' + error.message 
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
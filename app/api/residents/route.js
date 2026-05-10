import { NextResponse } from 'next/server';
import { validateResidentPayload } from '@/_lib/validators';
import { registerResident } from '@/_lib/residentService';
import { getSession } from '@/_lib/auth';
import { getClient } from '@/_lib/db';

/**
 * GET /api/residents
 * 
 * Fetch all residents with their household and contact information
 * Accessible by: Kebele Manager, Record Officer, System Administrator
 */
export async function GET(request) {
  try {
    // ── Auth check ────────────────────────────────────────────────────────────
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const allowedRoles = ['Kebele Manager', 'Record Officer', 'System Administrator'];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. You do not have permission to view residents.' },
        { status: 403 }
      );
    }

    const client = await getClient();
    
    try {
      // Fetch all active residents with their details
      const result = await client.query(`
        SELECT 
          r.resident_id,
          r.fname,
          r.lname,
          r.grandfather_name,
          r.sex,
          r.birthdate,
          r.marital_status,
          r.place_of_birth,
          r.nationality,
          r.national_id,
          r.previous_kebele,
          r.proof_of_residence,
          r.education_level,
          r.religion,
          r.notes,
          r.verified_by,
          r.verification_date,
          r.verification_note,
          r.house_id,
          r.household_id,
          r.household_role,
          r.is_head,
          r.is_active,
          r.status,
          r.registration_date,
          r.created_at,
          r.updated_at,
          hh.household_code,
          j.job_title,
          COALESCE(
            (SELECT array_agg(rc.phone) FROM resident_contact rc WHERE rc.resident_id = r.resident_id),
            '{}'
          ) as phones
        FROM resident r
        LEFT JOIN household hh ON hh.household_id = r.household_id
        LEFT JOIN job j ON j.job_id = r.job_id
        WHERE r.is_active = true
        ORDER BY r.created_at DESC
      `);
      
      return NextResponse.json({
        success: true,
        residents: result.rows,
        count: result.rows.length
      });
      
    } catch (dbError) {
      console.error('[GET /api/residents] Database error:', dbError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch residents from database.' },
        { status: 500 }
      );
    } finally {
      client.release();
    }

  } catch (err) {
    console.error('[GET /api/residents]', err);
    return NextResponse.json(
      { success: false, message: 'An internal server error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/residents
 *
 * Registers a new resident.
 * Requires an authenticated session with role = "Kebele Manager".
 */
export async function POST(request) {
  try {
    // ── Auth check ────────────────────────────────────────────────────────────
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const allowedRoles = ['Kebele Manager', 'System Administrator'];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Only Kebele Managers can register residents.' },
        { status: 403 }
      );
    }

    // ── Parse body ────────────────────────────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, errors: ['Invalid JSON body.'] },
        { status: 400 }
      );
    }

    // ── Validate ──────────────────────────────────────────────────────────────
    const validation = validateResidentPayload(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, errors: validation.errors },
        { status: 400 }
      );
    }

    // ── Business logic ────────────────────────────────────────────────────────
    const result = await registerResident(body, session.staff_id);

    return NextResponse.json(
      {
        success: true,
        resident_id: result.resident_id,
        household_id: result.household_id,
        household_code: result.household_code,
        message: 'Resident registered successfully.',
      },
      { status: 201 }
    );

  } catch (err) {
    console.error('[POST /api/residents]', err);

    // Known business-rule errors (thrown in residentService)
    const knownErrors = [
      'does not exist',
      'already has a registered Head',
      'not linked to house',
      'not found in household_role',
    ];
    const isKnown = knownErrors.some(msg => err.message.includes(msg));

    if (isKnown) {
      return NextResponse.json(
        { success: false, errors: [err.message] },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'An internal server error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { getClient } from '@/_lib/db';
import bcrypt from 'bcrypt';
import { getSession } from '@/_lib/auth';

// GET - Fetch current user profile
export async function GET(request) {
  let client;
  
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Session:', session);

    client = await getClient();
    
    const result = await client.query(`
      SELECT 
        a.account_id,
        a.username,
        a.email,
        a.created_at as account_created,
        s.staff_id,
        s.full_name,
        s.phone,
        s.gender,
        s.birthdate,
        s.marital_status,
        s.is_active,
        r.role_name
      FROM account a
      JOIN staff s ON a.account_id = s.account_id
      JOIN system_role r ON s.role_id = r.role_id
      WHERE s.staff_id = $1
    `, [session.staff_id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const user = result.rows[0];
    
    return NextResponse.json({
      success: true,
      user: {
        staff_id: user.staff_id,
        full_name: user.full_name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        birthdate: user.birthdate ? new Date(user.birthdate).toISOString().split('T')[0] : null,
        marital_status: user.marital_status,
        role_name: user.role_name,
        is_active: user.is_active,
        account_created: user.account_created ? new Date(user.account_created).toISOString() : null
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile: ' + error.message },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}

// PUT - Update user profile
export async function PUT(request) {
  let client;
  
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { full_name, email, phone, birthdate, gender, marital_status } = await request.json();

    client = await getClient();
    
    // Update staff information
    await client.query(
      `UPDATE staff 
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           birthdate = COALESCE($3, birthdate),
           gender = COALESCE($4, gender),
           marital_status = COALESCE($5, marital_status),
           updated_at = NOW()
       WHERE staff_id = $6`,
      [full_name, phone, birthdate, gender, marital_status, session.staff_id]
    );

    // Update email in account table
    if (email) {
      await client.query(
        `UPDATE account 
         SET email = $1, updated_at = NOW()
         WHERE account_id = (SELECT account_id FROM staff WHERE staff_id = $2)`,
        [email, session.staff_id]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}

// PATCH - Change password
export async function PATCH(request) {
  let client;
  
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { current_password, new_password } = await request.json();

    if (!current_password || !new_password) {
      return NextResponse.json(
        { success: false, error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (new_password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 6 characters' },
        { status: 400 }
      );
    }

    client = await getClient();
    
    // Get current password
    const result = await client.query(
      `SELECT a.password 
       FROM account a
       JOIN staff s ON a.account_id = s.account_id
       WHERE s.staff_id = $1`,
      [session.staff_id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const isValid = await bcrypt.compare(current_password, result.rows[0].password);
    
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password
    await client.query(
      `UPDATE account 
       SET password = $1, updated_at = NOW()
       WHERE account_id = (SELECT account_id FROM staff WHERE staff_id = $2)`,
      [hashedPassword, session.staff_id]
    );

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to change password' },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
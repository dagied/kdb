import { NextResponse } from 'next/server';
import { getClient } from '@/_lib/db';
import { getSession } from '@/_lib/auth';
import { sendBulkEmail } from '@/_lib/mailer';

export async function POST(request) {
  const client = await getClient();
  
  try {
    // Check authentication
    const session = await getSession();
    
    if (!session || session.role !== 'System Administrator') {
      return NextResponse.json(
        { error: 'Unauthorized. Only System Administrators can create announcements.' },
        { status: 401 }
      );
    }

    // Parse request body
    const { title, content, target } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required.' },
        { status: 400 }
      );
    }

    // Map frontend target to database target_role
    let targetRole = null;
    if (target === 'manager') {
      targetRole = 'Kebele Manager';
    } else if (target === 'officer') {
      targetRole = 'Record Officer';
    } else if (target === 'all') {
      targetRole = 'all';
    }

    // Build query based on target audience
    let staffQuery = `
      SELECT DISTINCT a.email 
      FROM staff s
      JOIN account a ON a.account_id = s.account_id
      JOIN system_role r ON s.role_id = r.role_id
      WHERE a.email IS NOT NULL 
        AND a.email != ''
        AND s.is_active = true
    `;

    const queryParams = [];

    if (target === 'manager') {
      staffQuery += ` AND r.role_name = $1`;
      queryParams.push('Kebele Manager');
    } else if (target === 'officer') {
      staffQuery += ` AND r.role_name = $1`;
      queryParams.push('Record Officer');
    }
    // 'all' doesn't need additional filters

    console.log('Executing query:', staffQuery);
    console.log('Query params:', queryParams);

    // Get staff emails
    const result = await client.query(staffQuery, queryParams);
    
    const emails = result.rows.map(row => row.email).filter(email => email && email.trim());
    
    console.log('Emails found:', emails.length);
    console.log('Email addresses:', emails);

    // Save announcement to database using your actual table schema
    const announcementResult = await client.query(
      `INSERT INTO announcement (title, content, posted_by, target_role, is_active, posted_date, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING announcement_id`,
      [title, content, session.staff_id, targetRole, true]
    );

    const announcementId = announcementResult.rows[0].announcement_id;

    // Send emails only if there are valid email addresses
    let emailResult = { sent: 0, failed: 0 };
    
    if (emails.length > 0) {
      try {
        emailResult = await sendBulkEmail(emails, title, content);
        console.log(`Emails sent: ${emailResult.sent} successful, ${emailResult.failed} failed`);
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Don't fail the whole request if email fails
        // Just log it and continue
      }
    } else {
      console.log('No valid email addresses found for the selected audience.');
    }

    return NextResponse.json({
      success: true,
      message: `Announcement created successfully. ${emailResult.sent} emails sent.`,
      sentTo: emailResult.sent,
      failedEmails: emailResult.failed,
      announcement_id: announcementId
    });

  } catch (error) {
    console.error('Announcement creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create announcement: ' + error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
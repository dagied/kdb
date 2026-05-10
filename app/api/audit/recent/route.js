// app/api/audit/recent/route.js
import { NextResponse } from 'next/server';
import { query } from '@/_lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 10;
    
    // Fetch recent activities from audit_logs table
    const recentActivities = await query(
      `SELECT 
        id,
        action,
        description,
        COALESCE(user_name, 'System') as user_name,
        COALESCE(user_role, 'User') as user_role,
        request_type,
        status,
        metadata,
        created_at,
        to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as time
      FROM audit_logs 
      ORDER BY created_at DESC 
      LIMIT $1`,
      [limit]
    );
    
    // Format the response for your dashboard
    const formattedActivities = recentActivities.map(activity => ({
      id: activity.id,
      action: activity.action,
      description: activity.description || activity.action,
      userName: activity.user_name,
      userRole: activity.user_role,
      time: activity.time,
      created_at: activity.created_at,
      status: activity.status,
      metadata: activity.metadata || {}
    }));
    
    return NextResponse.json(formattedActivities);
    
  } catch (error) {
    console.error('Error fetching activities:', error);
    // Return empty array instead of error
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      action, 
      description, 
      userName, 
      userRole, 
      requestType,
      metadata, 
      status,
      userId
    } = body;
    
    const result = await query(
      `INSERT INTO audit_logs 
       (action, description, user_id, user_name, user_role, request_type, metadata, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
       RETURNING id, created_at, to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as time`,
      [
        action,
        description || action,
        userId || null,
        userName || 'System',
        userRole || 'User',
        requestType || 'General',
        metadata || {},
        status || 'pending'
      ]
    );
    
    const newLog = {
      id: result[0].id,
      action,
      description: description || action,
      userName: userName || 'System',
      userRole: userRole || 'User',
      requestType: requestType || 'General',
      status: status || 'pending',
      created_at: result[0].created_at,
      time: result[0].time
    };
    
    return NextResponse.json(newLog, { status: 201 });
    
  } catch (error) {
    console.error('Error creating audit log:', error);
    return NextResponse.json(
      { error: 'Failed to create audit log' },
      { status: 500 }
    );
  }
}
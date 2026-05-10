import { NextResponse } from 'next/server';
import { getClient } from '@/_lib/db';
import { getSession } from '@/_lib/auth';

export async function GET(request) {
  const client = await getClient();
  
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total residents
    const residentsResult = await client.query(`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN sex = 'M' THEN 1 ELSE 0 END) as male,
             SUM(CASE WHEN sex = 'F' THEN 1 ELSE 0 END) as female
      FROM resident
      WHERE is_active = true
    `);
    
    const totalResidents = parseInt(residentsResult.rows[0].total) || 0;
    const male = parseInt(residentsResult.rows[0].male) || 0;
    const female = parseInt(residentsResult.rows[0].female) || 0;

    // Get ID cards issued (count of id_card entries)
    const idResult = await client.query(`
      SELECT COUNT(*) as total FROM id_card
    `);
    const idIssued = parseInt(idResult.rows[0].total) || 0;

    // Get pending service requests (assuming a service_request table)
    let pendingRequests = 0;
    try {
      const pendingResult = await client.query(`
        SELECT COUNT(*) as total FROM service_request WHERE status = 'pending'
      `);
      pendingRequests = parseInt(pendingResult.rows[0].total) || 0;
    } catch (err) {
      console.error('Service request table may not exist yet:', err.message);
    }

    // Get active social court cases
    let activeCases = 0;
    try {
      const casesResult = await client.query(`
        SELECT COUNT(*) as total FROM social_court_case WHERE status NOT IN ('RESOLVED', 'CLOSED')
      `);
      activeCases = parseInt(casesResult.rows[0].total) || 0;
    } catch (err) {
      console.error('Social court table may not exist yet:', err.message);
    }

    // Get recent activities (last 5 actions from audit_log)
    let recentActivities = [];
    try {
      const activitiesResult = await client.query(`
        SELECT 
          a.log_id,
          a.action,
          a.table_name,
          a.record_id,
          a.new_value,
          a.created_at,
          s.full_name as performed_by
        FROM audit_log a
        LEFT JOIN staff s ON s.staff_id = a.staff_id
        ORDER BY a.created_at DESC
        LIMIT 5
      `);
      recentActivities = activitiesResult.rows.map(row => ({
        id: row.log_id,
        action: row.action,
        description: row.new_value || `${row.action} on ${row.table_name}`,
        performed_by: row.performed_by || 'System',
        time: new Date(row.created_at).toLocaleString()
      }));
    } catch (err) {
      console.error('Could not fetch recent activities:', err.message);
      // Fallback mock data
      recentActivities = [
        { id: 1, action: 'Resident registered', description: 'New resident added', performed_by: 'Admin', time: new Date().toLocaleString() }
      ];
    }

    // Get recent social court cases (limit 5)
    let recentCases = [];
    try {
      const casesResult = await client.query(`
        SELECT 
          case_id,
          case_number,
          plaintiff_name,
          defendant_name,
          status,
          filing_date
        FROM social_court_case
        ORDER BY filing_date DESC
        LIMIT 5
      `);
      recentCases = casesResult.rows;
    } catch (err) {
      console.error('Social court table not ready:', err.message);
    }

    // Get upcoming hearings (from hearing table if exists)
    let upcomingHearings = [];
    try {
      const hearingsResult = await client.query(`
        SELECT 
          h.hearing_id,
          h.case_id,
          c.case_number,
          h.hearing_date,
          h.location
        FROM hearing h
        JOIN social_court_case c ON c.case_id = h.case_id
        WHERE h.hearing_date > NOW()
        ORDER BY h.hearing_date ASC
        LIMIT 3
      `);
      upcomingHearings = hearingsResult.rows;
    } catch (err) {
      console.error('Hearings table not ready:', err.message);
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalResidents,
        idIssued,
        pendingRequests,
        activeCases,
        male,
        female,
        // weekly growth can be calculated by comparing with previous month data
        weeklyGrowth: 12.5 // Placeholder; you can compute from historical data
      },
      recentActivities,
      recentCases,
      upcomingHearings
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
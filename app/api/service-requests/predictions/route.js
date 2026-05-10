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

    const { searchParams } = new URL(request.url);
    const weeks = parseInt(searchParams.get('weeks')) || 4;

    // Get historical data by category
    const historicalData = await client.query(`
      SELECT 
        DATE_TRUNC('week', request_date) as week,
        s.category,
        COUNT(*) as request_count
      FROM service_request sr
      JOIN service s ON s.service_id = sr.service_id
      WHERE request_date >= NOW() - INTERVAL '3 months'
      GROUP BY DATE_TRUNC('week', request_date), s.category
      ORDER BY week DESC
    `);

    // Calculate moving averages for prediction
    const predictions = {};
    const categories = ['Civil Registration', 'ID Services', 'Social Services', 'Administrative Services', 'Court Services'];
    
    for (const category of categories) {
      const categoryData = historicalData.rows.filter(r => r.category === category);
      
      if (categoryData.length >= 2) {
        // Simple linear prediction based on last 4 weeks average
        const last4Weeks = categoryData.slice(0, 4);
        const avgWeekly = last4Weeks.reduce((sum, w) => sum + parseInt(w.request_count), 0) / last4Weeks.length;
        
        // Calculate trend (increase/decrease)
        const oldest = parseInt(last4Weeks[last4Weeks.length - 1]?.request_count) || 0;
        const newest = parseInt(last4Weeks[0]?.request_count) || 0;
        const trend = newest - oldest;
        const trendFactor = 1 + (trend / Math.max(oldest, 1) * 0.3); // 30% influence from trend
        
        predictions[category] = {
          current_weekly_avg: Math.round(avgWeekly),
          predicted_next_week: Math.round(avgWeekly * trendFactor),
          predicted_next_month: Math.round(avgWeekly * trendFactor * 4),
          trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
          trend_percentage: Math.abs(Math.round((trend / Math.max(oldest, 1)) * 100))
        };
      } else {
        predictions[category] = {
          current_weekly_avg: 0,
          predicted_next_week: 0,
          predicted_next_month: 0,
          trend: 'insufficient_data',
          trend_percentage: 0
        };
      }
    }
    
    // Get daily patterns
    const dailyPatterns = await client.query(`
      SELECT 
        EXTRACT(DOW FROM request_date) as day_of_week,
        s.category,
        COUNT(*) as request_count
      FROM service_request sr
      JOIN service s ON s.service_id = sr.service_id
      WHERE request_date >= NOW() - INTERVAL '30 days'
      GROUP BY EXTRACT(DOW FROM request_date), s.category
      ORDER BY day_of_week
    `);

    // Get peak hours
    const peakHours = await client.query(`
      SELECT 
        EXTRACT(HOUR FROM request_date) as hour,
        COUNT(*) as request_count
      FROM service_request
      WHERE request_date >= NOW() - INTERVAL '30 days'
      GROUP BY EXTRACT(HOUR FROM request_date)
      ORDER BY request_count DESC
      LIMIT 3
    `);

    // Generate recommendations
    const recommendations = [];
    const totalPrediction = Object.values(predictions).reduce((sum, p) => sum + p.predicted_next_week, 0);
    
    if (totalPrediction > 100) {
      recommendations.push("⚠️ High workload predicted for next week. Consider adding temporary staff.");
    }
    
    for (const [category, data] of Object.entries(predictions)) {
      if (data.trend === 'increasing' && data.trend_percentage > 20) {
        recommendations.push(`📈 ${category} requests are increasing by ${data.trend_percentage}%. Prepare additional resources.`);
      }
      
      if (data.predicted_next_week > 30) {
        recommendations.push(`🎯 ${category} will have high demand (${data.predicted_next_week}+ requests). Schedule extra staff.`);
      }
    }
    
    if (peakHours.rows.length > 0) {
      const peakHour = Math.floor(peakHours.rows[0].hour);
      recommendations.push(`⏰ Peak hours: ${peakHour}:00 - ${peakHour + 1}:00. Ensure adequate staffing during this time.`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push("✅ Normal workload expected. Continue regular operations.");
    }

    return NextResponse.json({
      success: true,
      predictions,
      daily_patterns: dailyPatterns.rows,
      peak_hours: peakHours.rows,
      recommendations,
      total_predicted_next_week: totalPrediction,
      confidence_level: historicalData.rows.length >= 20 ? "High" : historicalData.rows.length >= 10 ? "Medium" : "Low"
    });
    
  } catch (error) {
    console.error('Error generating predictions:', error);
    return NextResponse.json(
      { error: 'Failed to generate predictions' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
// // pages/api/analytics/predict.js
// import { Pool } from 'pg';

// const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// // Simple linear regression: given x=[1,2,3,...], y=[counts], predict y at x=n+1
// function linearRegression(y) {
//   const n = y.length;
//   if (n === 0) return { slope: 0, intercept: 0, predicted: 0 };

//   const x = y.map((_, i) => i + 1);
//   const sumX = x.reduce((a, b) => a + b, 0);
//   const sumY = y.reduce((a, b) => a + b, 0);
//   const sumXY = x.reduce((a, xi, i) => a + xi * y[i], 0);
//   const sumX2 = x.reduce((a, xi) => a + xi * xi, 0);

//   const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
//   const intercept = (sumY - slope * sumX) / n;
//   const predicted = Math.max(0, Math.round(slope * (n + 1) + intercept));

//   // R² to measure how reliable the prediction is
//   const yMean = sumY / n;
//   const ssTot = y.reduce((a, yi) => a + (yi - yMean) ** 2, 0);
//   const ssRes = x.reduce((a, xi, i) => a + (y[i] - (slope * xi + intercept)) ** 2, 0);
//   const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);

//   return { slope: +slope.toFixed(2), intercept: +intercept.toFixed(2), predicted, r2: +r2.toFixed(2) };
// }

// export default async function handler(req, res) {
//   if (req.method !== 'GET') return res.status(405).end();

//   try {
//     // 1. Monthly totals for the past 12 months (overall)
//     const overallResult = await pool.query(`
//       SELECT
//         TO_CHAR(DATE_TRUNC('month', request_date), 'YYYY-MM') AS month,
//         COUNT(*)::int AS total
//       FROM service_request
//       WHERE request_date >= NOW() - INTERVAL '12 months'
//       GROUP BY 1
//       ORDER BY 1
//     `);

//     // 2. Monthly totals per service type (last 6 months)
//     const byServiceResult = await pool.query(`
//       SELECT
//         TO_CHAR(DATE_TRUNC('month', sr.request_date), 'YYYY-MM') AS month,
//         s.service_name,
//         COUNT(*)::int AS total
//       FROM service_request sr
//       JOIN service s ON s.service_id = sr.service_id
//       WHERE sr.request_date >= NOW() - INTERVAL '6 months'
//       GROUP BY 1, 2
//       ORDER BY 2, 1
//     `);

//     // 3. Status breakdown for current month
//     const statusResult = await pool.query(`
//       SELECT status, COUNT(*)::int AS count
//       FROM service_request
//       WHERE DATE_TRUNC('month', request_date) = DATE_TRUNC('month', NOW())
//       GROUP BY status
//     `);

//     // 4. Average resolution time (days) for completed requests
//     const resolutionResult = await pool.query(`
//       SELECT ROUND(AVG(
//         EXTRACT(EPOCH FROM (completed_date - request_date)) / 86400
//       )::numeric, 1) AS avg_days
//       FROM service_request
//       WHERE status = 'completed' AND completed_date IS NOT NULL
//     `);

//     // --- Run regression on overall monthly counts ---
//     const months = overallResult.rows;
//     const overallCounts = months.map(r => r.total);
//     const overallForecast = linearRegression(overallCounts);

//     // --- Run regression per service type ---
//     const serviceMap = {};
//     for (const row of byServiceResult.rows) {
//       if (!serviceMap[row.service_name]) serviceMap[row.service_name] = [];
//       serviceMap[row.service_name].push(row.total);
//     }

//     const servicePredictions = Object.entries(serviceMap).map(([name, counts]) => ({
//       service_name: name,
//       historical: counts,
//       ...linearRegression(counts),
//     })).sort((a, b) => b.predicted - a.predicted);

//     res.json({
//       success: true,
//       historical: months,                          // [{month, total}, ...]
//       overall_forecast: overallForecast,           // predicted count for next month
//       service_predictions: servicePredictions,     // per-service breakdown
//       status_breakdown: statusResult.rows,         // current month status counts
//       avg_resolution_days: resolutionResult.rows[0]?.avg_days ?? null,
//       data_points: overallCounts.length,           // how many months of data fed in
//     });

//   } catch (err) {
//     console.error('Prediction error:', err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// }

// pages/api/analytics/predict.js
export async function GET() {
  try {
    const response = await fetch('http://localhost:8001/predict');
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    console.error('ML service error:', err);
    return new Response(JSON.stringify({ success: false, error: 'ML service unavailable' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
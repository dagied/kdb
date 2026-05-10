import { NextResponse } from "next/server";
import { getClient } from "@/_lib/db";

export async function GET() {
  const client = await getClient();

  try {
    const result = await client.query(`
      SELECT 
        sr.request_id,
        sr.resident_id,
        r.fname || ' ' || r.lname AS resident_name,
        s.service_name,
        sr.status,
        sr.request_date
      FROM service_request sr
      JOIN service s ON sr.service_id = s.service_id
      JOIN resident r ON sr.resident_id = r.resident_id
      WHERE sr.request_date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY sr.request_date DESC;
    `);

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
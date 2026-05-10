import { query } from "@/_lib/db";
import { NextResponse } from "next/server";

export async function GET() {

  const users = await query("SELECT COUNT(*) FROM account");
  const staff = await query("SELECT COUNT(*) FROM staff");
  const kebeles = await query("SELECT COUNT(*) FROM kebele");

  return NextResponse.json({
    users: parseInt(users.rows[0].count),
    staff: parseInt(staff.rows[0].count),
    kebeles: parseInt(kebeles.rows[0].count)
  });
}
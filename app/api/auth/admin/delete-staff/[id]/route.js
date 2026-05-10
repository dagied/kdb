import { NextResponse } from "next/server";
import { getClient } from "@/_lib/db";

export async function DELETE(req, context) {
  const { params } = context;
  const { id } = await params; // ✅ correct in Next.js 15+

  const client = await getClient();

  try {
    await client.query("BEGIN");

    // check staff
    const staffRes = await client.query(
      "SELECT account_id FROM staff WHERE staff_id = $1",
      [id]
    );

    if (staffRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Staff not found" },
        { status: 404 }
      );
    }

    const accountId = staffRes.rows[0].account_id;

    // IMPORTANT: fix foreign key issue first
    await client.query(
      "UPDATE certificate SET created_by = NULL WHERE created_by = $1",
      [id]
    );

    await client.query("DELETE FROM staff WHERE staff_id = $1", [id]);

    await client.query("DELETE FROM account WHERE account_id = $1", [accountId]);

    await client.query("COMMIT");

    return NextResponse.json({ message: "Staff deleted successfully" });

  } catch (error) {
    await client.query("ROLLBACK");

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );

  } finally {
    client.release();
  }
}
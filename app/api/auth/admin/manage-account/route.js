
import { NextResponse } from "next/server";
import { getClient } from "@/_lib/db";
import bcrypt from "bcryptjs";
import { sendBulkEmail } from "@/_lib/mailer";

export async function POST(req) {
  let client;

  try {
    client = await getClient();

    const {
      account_id,
      full_name,
      phone,
      gender,
      marital_status,
      email,
      currentPassword,
      newPassword
    } = await req.json();

    await client.query("BEGIN");

    // 🔍 1. Get current account password
    const accRes = await client.query(
      `SELECT password, email FROM account WHERE account_id = $1`,
      [account_id]
    );

    if (accRes.rows.length === 0) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    const storedPassword = accRes.rows[0].password;

    // 🔐 2. If password change requested → verify current password
    if (newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, storedPassword);

      if (!isMatch) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      const hashed = await bcrypt.hash(newPassword, 10);

      await client.query(
        `UPDATE account SET password = $1 WHERE account_id = $2`,
        [hashed, account_id]
      );
    }

    // 👤 3. Update staff info
    await client.query(
      `UPDATE staff
       SET full_name = $1,
           phone = $2,
           gender = $3,
           marital_status = $4
       WHERE account_id = $5`,
      [full_name, phone, gender, marital_status, account_id]
    );

    // 📧 4. Update email if changed
    await client.query(
      `UPDATE account SET email = $1 WHERE account_id = $2`,
      [email, account_id]
    );

    await client.query("COMMIT");

    // 📩 5. Send email notification
    await sendBulkEmail(
      [email],
      "Profile Update Completed",
      `
        Hello,

        Your account information has been successfully updated.

        If you did not perform this action, please contact the system administrator immediately.

        Status: UPDATE COMPLETE ✔
      `
    );

    return NextResponse.json({
      success: true,
      message: "Update completed successfully"
    });

  } catch (err) {
    if (client) await client.query("ROLLBACK");

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );

  } finally {
    if (client) client.release();
  }
}
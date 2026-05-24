import { query } from "@/_lib/db";
import { NextResponse } from "next/server";
import { SignJWT } from "jose";

export async function POST(req) {
  const { staffId, otpCode } = await req.json();

  try {
    // ─── Find valid OTP ───────────────────────────────────────────────────
    const result = await query(
      `SELECT * FROM otp_tokens
       WHERE staff_id = $1
         AND otp_code = $2
         AND used = FALSE
         AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [staffId, otpCode]
    );

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired OTP code." },
        { status: 401 }
      );
    }

    // ─── Mark OTP as used ─────────────────────────────────────────────────
    await query(
      `UPDATE otp_tokens SET used = TRUE WHERE id = $1`,
      [result[0].id]
    );

    // ─── Fetch user details ───────────────────────────────────────────────
    const userResult = await query(
      `SELECT s.staff_id, s.full_name, s.email, a.username, r.role_name
       FROM staff s
       JOIN account a ON s.account_id = a.account_id
       JOIN system_role r ON s.role_id = r.role_id
       WHERE s.staff_id = $1`,
      [staffId]
    );

    const user = userResult[0];

    // ─── Issue JWT ────────────────────────────────────────────────────────
    const token = await new SignJWT({
      userId: user.staff_id,
      role: user.role_name,
      user: user.username,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1d")
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));

    const res = NextResponse.json({
      success: true,
      user: {
        name: user.full_name,
        role: user.role_name,
        staff_id: user.staff_id,
        username: user.username,
      },
    });

    res.cookies.set("auth_token", token, {
      httpOnly: true,
      path: "/",
    });

    return res;
  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
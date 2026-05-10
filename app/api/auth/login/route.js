import { query } from "@/_lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { SignJWT } from "jose";

export async function POST(req) {
  const { username, password } = await req.json();

  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";

  // ─────────────────────────────────────────────
  // 1. Check suspension
  // ─────────────────────────────────────────────
  try {
    const suspendedResult = await query(
      `SELECT suspended_until 
       FROM login_attempts 
       WHERE ip = $1 OR username = $2 
       ORDER BY last_attempt DESC 
       LIMIT 1`,
      [ip, username]
    );

    if (suspendedResult.length > 0) {
      const suspendedUntil = suspendedResult[0].suspended_until;

      if (suspendedUntil && new Date() < new Date(suspendedUntil)) {
        return NextResponse.json(
          { error: "Too many failed attempts. Try again later." },
          { status: 429 }
        );
      }
    }
  } catch (error) {
    console.error("Failed to check suspension:", error);
  }

  try {
    // ─────────────────────────────────────────────
    // 2. Find user
    // ─────────────────────────────────────────────
    const result = await query(
      `SELECT a.*, s.staff_id, s.full_name, r.role_name
       FROM account a
       JOIN staff s ON a.account_id = s.account_id
       JOIN system_role r ON s.role_id = r.role_id
       WHERE a.username = $1`,
      [username]
    );

    if (result.length === 0) {
      await incrementAttempts(ip, username);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const user = result[0];

    // ─────────────────────────────────────────────
    // 3. Check password
    // ─────────────────────────────────────────────
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      await incrementAttempts(ip, username);
      return NextResponse.json(
        { error: "Password is not correct" },
        { status: 401 }
      );
    }

    // ─────────────────────────────────────────────
    // 4. Reset attempts on success
    // ─────────────────────────────────────────────
    try {
      await query(
        `DELETE FROM login_attempts 
         WHERE ip = $1 OR username = $2`,
        [ip, username]
      );
    } catch (error) {
      console.error("Failed to reset attempts:", error);
    }

    // ─────────────────────────────────────────────
    // 5. Generate JWT
    // ─────────────────────────────────────────────
    const token = await new SignJWT({
      userId: user.staff_id,
      role: user.role_name,
      user: user.username,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1d")
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));

    // Updated response to include staff_id
    const res = NextResponse.json({
      success: true,
      user: {
        name: user.full_name,
        role: user.role_name,
        staff_id: user.staff_id,  // ← ADD THIS
        username: user.username    // ← ADD THIS (optional)
      },
    });

    res.cookies.set("auth_token", token, {
      httpOnly: true,
      path: "/",
    });

    return res;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────
// HELPER: Increment login attempts
// ─────────────────────────────────────────────
async function incrementAttempts(ip, username) {
  try {
    const existing = await query(
      `SELECT attempts 
       FROM login_attempts 
       WHERE ip = $1 OR username = $2 
       ORDER BY last_attempt DESC 
       LIMIT 1`,
      [ip, username]
    );

    let attempts = 1;

    if (existing.length > 0) {
      attempts = existing[0].attempts + 1;
    }

    if (attempts >= 3) {
      const suspendedUntil = new Date(Date.now() + 30 * 60 * 1000);

      await query(
        `INSERT INTO login_attempts (ip, username, attempts, suspended_until)
         VALUES ($1, $2, $3, $4)`,
        [ip, username, attempts, suspendedUntil]
      );
    } else {
      await query(
        `INSERT INTO login_attempts (ip, username, attempts)
         VALUES ($1, $2, $3)`,
        [ip, username, attempts]
      );
    }
  } catch (error) {
    console.error("Failed to increment attempts:", error);
  }
}
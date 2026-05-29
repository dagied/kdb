import { query } from "@/_lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";

export async function POST(req) {
  const { username, password } = await req.json();

  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";

  // Debug: Check if environment variables exist (remove after testing)
  console.log("EMAIL_USER exists:", !!process.env.EMAIL_USER);
  console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);

  // Updated transporter using simpler Gmail service configuration
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    const suspendedResult = await query(
      `SELECT suspended_until FROM login_attempts 
       WHERE ip = $1 OR username = $2 
       ORDER BY last_attempt DESC LIMIT 1`,
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
    const result = await query(
      `SELECT a.*, s.staff_id, s.full_name, s.email, r.role_name
       FROM account a
       JOIN staff s ON a.account_id = s.account_id
       JOIN system_role r ON s.role_id = r.role_id
       WHERE a.username = $1`,
      [username]
    );

    if (result.length === 0) {
      await incrementAttempts(ip, username);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = result[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      await incrementAttempts(ip, username);
      return NextResponse.json(
        { error: "Password is not correct" },
        { status: 401 }
      );
    }

    await query(
      `DELETE FROM login_attempts WHERE ip = $1 OR username = $2`,
      [ip, username]
    ).catch(console.error);

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await query(
      `UPDATE otp_tokens SET used = TRUE WHERE staff_id = $1 AND used = FALSE`,
      [user.staff_id]
    );

    await query(
      `INSERT INTO otp_tokens (staff_id, otp_code, expires_at) VALUES ($1, $2, $3)`,
      [user.staff_id, otpCode, expiresAt]
    );

    // Send email with better error logging
    const info = await transporter.sendMail({
      from: `"Bosa Addis Kebele System" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Your Login Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="background: #1f2937; padding: 24px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0; font-size: 20px;">Bosa Addis Kebele</h2>
            <p style="color: #9ca3af; margin: 4px 0 0; font-size: 13px;">Administrative Management System</p>
          </div>
          <div style="background: #f9fafb; padding: 32px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
            <p style="color: #374151; margin: 0 0 16px;">Hello <strong>${user.full_name}</strong>,</p>
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">
              Use the code below to complete your sign-in. It expires in <strong>10 minutes</strong>.
            </p>
            <div style="background: white; border: 2px dashed #3b82f6; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #1f2937;">${otpCode}</span>
            </div>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              If you did not attempt to log in, please contact the system administrator immediately.
            </p>
          </div>
        </div>
      `,
    });

    console.log("EMAIL SENT successfully to:", user.email);
    console.log("Message ID:", info.messageId);

    return NextResponse.json({
      requiresOtp: true,
      staffId: user.staff_id,
      maskedEmail: maskEmail(user.email),
    });
  } catch (error) {
    console.error("Login error:", error);
    
    // More detailed error for email failures
    if (error.code === 'EAUTH') {
      console.error("Gmail authentication failed. Check your EMAIL_PASS (use App Password)");
      return NextResponse.json(
        { error: "Email service configuration error. Please contact administrator." },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function maskEmail(email) {
  const [local, domain] = email.split("@");
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(local.length - 2)}@${domain}`;
}

async function incrementAttempts(ip, username) {
  try {
    const existing = await query(
      `SELECT attempts FROM login_attempts 
       WHERE ip = $1 OR username = $2 
       ORDER BY last_attempt DESC LIMIT 1`,
      [ip, username]
    );

    let attempts = existing.length > 0 ? existing[0].attempts + 1 : 1;
    const suspendedUntil =
      attempts >= 3 ? new Date(Date.now() + 30 * 60 * 1000) : null;

    await query(
      `INSERT INTO login_attempts (ip, username, attempts, suspended_until)
       VALUES ($1, $2, $3, $4)`,
      [ip, username, attempts, suspendedUntil]
    );
  } catch (error) {
    console.error("Failed to increment attempts:", error);
  }
}
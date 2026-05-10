import { NextResponse } from "next/server";
import { getClient } from "@/_lib/db";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendCredentials } from "@/_lib/email";

function generateUsername(name) {
  return name.toLowerCase().replace(/\s/g, "_") + "_" + Math.floor(Math.random() * 9999);
}

function generatePassword() {
  return crypto.randomBytes(6).toString("base64");
}

export async function POST(req) {

  const client = await getClient();

  try {
    await client.query("BEGIN");

    const body = await req.json();

    const {
      full_name,
      role_id,
      phone,
      email,
      gender,
      birthdate,
      marital_status,
      profile_image
    } = body;

    // Validate required fields
    if (!full_name || !role_id || !email || !gender || !birthdate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const roleIdInt = Number(role_id); // ✅ FIX ADDED HERE

    // Check duplicate email
    const existingAccount = await client.query(
      "SELECT account_id FROM account WHERE email = $1",
      [email]
    );

    if (existingAccount.rows.length > 0) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // credentials
    const username = generateUsername(full_name);
    const password = generatePassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    // account
    const acc = await client.query(
      `INSERT INTO account (username, password, email, role_id)
       VALUES ($1,$2,$3,$4)
       RETURNING account_id`,
      [username, hashedPassword, email, roleIdInt]
    );

    const account_id = acc.rows[0].account_id;

    // staff
    await client.query(
      `INSERT INTO staff 
      (full_name, role_id, phone, email, gender, birthdate, marital_status, profile_image, account_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        full_name,
        roleIdInt,
        phone,
        email,
        gender,
        birthdate,
        marital_status,
        profile_image, // 👈 NOW THIS IS URL
        account_id
      ]
    );

    await client.query("COMMIT");

    // send email
    await sendCredentials(email, username, password);

    return NextResponse.json({
      message: "Staff created successfully"
    });

  } catch (error) {

    await client.query("ROLLBACK");

    console.error(error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
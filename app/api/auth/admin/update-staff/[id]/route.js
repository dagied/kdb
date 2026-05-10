import { NextResponse } from "next/server";
import { getClient } from "@/_lib/db";

export async function PUT(req, { params }) {
  const staffId = params.id;
  const client = await getClient();

  try {
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

    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE staff 
       SET full_name = $1,
           role_id = $2,
           phone = $3,
           email = $4,
           gender = $5,
           birthdate = $6,
           marital_status = $7,
           profile_image = $8
       WHERE staff_id = $9
       RETURNING *`,
      [
        full_name,
        role_id,
        phone,
        email,
        gender,
        birthdate,
        marital_status,
        profile_image,
        staffId
      ]
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Staff not found" },
        { status: 404 }
      );
    }

    await client.query("COMMIT");

    return NextResponse.json({
      message: "Staff updated successfully",
      data: result.rows[0]
    });

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
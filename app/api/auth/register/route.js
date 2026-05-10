export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { query } from '@/_lib/db';

export async function POST(req) {
    try {
        const { username, password, full_name, role_id } = await req.json();

        // 1. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Insert into account
        const acc = await query(
            `INSERT INTO account (username, password, role_id)
             VALUES ($1, $2, $3) RETURNING account_id`,
            [username, hashedPassword, role_id]
        );

        const account_id = acc.rows[0].account_id;

        // 3. Insert into staff
        await query(
            `INSERT INTO staff (account_id, full_name, role_id)
             VALUES ($1, $2, $3)`,
            [account_id, full_name, role_id]
        );

        return NextResponse.json({ success: true });

    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
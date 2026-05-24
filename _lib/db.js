// lib/db.js

import { Pool } from 'pg';

// Singleton pool (safe for Next.js)
let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false  // required for Railway
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('connect', () => {
      console.log('✅ Connected to PostgreSQL');
    });

    pool.on('error', (err) => {
      console.error('❌ PostgreSQL error:', err);
    });
  }

  return pool;
}

// 🔥 QUERY HELPER (returns rows directly)
export async function query(text, params = []) {
  const start = Date.now();
  const client = await getPool().connect();

  try {
    const res = await client.query(text, params);

    const duration = Date.now() - start;
    console.log('📊 Query:', {
      text,
      duration: `${duration}ms`,
      rows: res.rowCount,
    });

    return res.rows; // ✅ important (your services expect rows)
  } catch (error) {
    console.error('❌ Query error:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// 🔥 GET CLIENT (manual control if needed)
export async function getClient() {
  return await getPool().connect();
}

// 🔥 TRANSACTION HELPER (THIS FIXES YOUR ERROR)
export async function withTransaction(callback) {
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');

    const result = await callback(client);

    await client.query('COMMIT');

    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Transaction error:', error.message);
    throw error;
  } finally {
    client.release();
  }
}
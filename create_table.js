import { query } from './_lib/db.js';

async function createTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS login_attempts (
        id SERIAL PRIMARY KEY,
        ip VARCHAR(45),
        username VARCHAR(255),
        attempts INT DEFAULT 0,
        last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        suspended_until TIMESTAMP
      );
    `);
    console.log('Table created successfully');
  } catch (error) {
    console.error('Error creating table:', error);
  }
}

createTable();
import { NextResponse } from 'next/server';
import { getClient } from '@/_lib/db';

export async function GET(request) {
  const client = await getClient();
  
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'en';
    
    // Map language code to column name
    const columnMap = {
      'en': 'en_text',
      'am': 'am_text',
      'om': 'om_text'
    };
    
    const column = columnMap[lang] || 'en_text';
    
    const result = await client.query(`
      SELECT key_name, ${column} as text
      FROM translations
    `);
    
    const translations = {};
    result.rows.forEach(row => {
      translations[row.key_name] = row.text || row.key_name;
    });
    
    return NextResponse.json(translations);
    
  } catch (error) {
    console.error('Error fetching translations:', error);
    return NextResponse.json({}, { status: 500 });
  } finally {
    client.release();
  }
}
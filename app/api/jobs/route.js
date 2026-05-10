import { NextResponse } from 'next/server';
import { getClient } from '@/_lib/db';
import { getSession } from '@/_lib/auth';

export async function GET(request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const client = await getClient();
  
  try {
    const result = await client.query(
      `SELECT job_id, job_title, description 
       FROM job 
       ORDER BY job_title`
    );
    
    return NextResponse.json({ 
      success: true, 
      jobs: result.rows 
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { message: 'Failed to fetch jobs' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function POST(request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const client = await getClient();
  
  try {
    const { job_title, description } = await request.json();
    
    if (!job_title || !job_title.trim()) {
      return NextResponse.json(
        { message: 'Job title is required' },
        { status: 400 }
      );
    }
    
    const checkResult = await client.query(
      `SELECT job_id FROM job WHERE LOWER(job_title) = LOWER($1)`,
      [job_title.trim()]
    );
    
    if (checkResult.rows.length > 0) {
      return NextResponse.json({ 
        success: true, 
        job_id: checkResult.rows[0].job_id,
        message: 'Job already exists' 
      });
    }
    
    const result = await client.query(
      `INSERT INTO job (job_title, description) 
       VALUES ($1, $2) 
       RETURNING job_id, job_title, created_at`,
      [job_title.trim(), description || null]
    );
    
    return NextResponse.json({ 
      success: true, 
      job: result.rows[0],
      message: 'Job added successfully' 
    });
  } catch (error) {
    console.error('Error adding job:', error);
    return NextResponse.json(
      { message: 'Failed to add job' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
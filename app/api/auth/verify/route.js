import { NextResponse } from 'next/server';
import { getSession } from '@/_lib/auth';

export async function GET(request) {
  try {
    const session = await getSession(request);
    
    if (!session) {
      return NextResponse.json({ 
        authenticated: false,
        message: 'No active session' 
      });
    }
    
    return NextResponse.json({ 
      authenticated: true,
      userId: session.staff_id,
      role: session.role,
      username: session.username
    });
    
  } catch (error) {
    console.error('Session verification error:', error);
    return NextResponse.json({ 
      authenticated: false,
      message: 'Session verification failed' 
    });
  }
}
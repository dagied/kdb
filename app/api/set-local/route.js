import { NextResponse } from 'next/server';

export async function POST(request) {
  const { locale } = await request.json();
  
  const response = NextResponse.json({ success: true });
  
  response.cookies.set('locale', locale, {
    path: '/',
    maxAge: 365 * 24 * 60 * 60,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  
  return response;
}
import { NextResponse } from 'next/server';
import { gregorianToEthiopian, ethiopianToGregorian } from '@/utils/calendar';
import { getSession } from '@/_lib/auth';

export async function POST(request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { date, direction } = await request.json();
    
    let result;
    if (direction === 'gc-to-ec') {
      result = gregorianToEthiopian(date);
    } else if (direction === 'ec-to-gc') {
      result = ethiopianToGregorian(date);
    } else {
      return NextResponse.json({ error: 'Invalid direction' }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Calendar conversion error:', error);
    return NextResponse.json({ error: 'Conversion failed' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/session';

export async function POST(req) {
  const res = NextResponse.json({ message: 'Logged out' });
  destroySession(req, res);
  return res;
}

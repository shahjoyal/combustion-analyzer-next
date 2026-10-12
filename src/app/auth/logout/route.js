import { withAlerts } from '@/lib/withAlerts';
import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/session';

async function handlePOST(req) {
  const res = NextResponse.json({ message: 'Logged out' });
  destroySession(req, res);
  return res;
}

export const POST = withAlerts('POST /auth/logout', handlePOST);

import { withAlerts } from '@/lib/withAlerts';
import { withEncryption } from '@/lib/withEncryption';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getUserModel } from '@/lib/models';
import { getSessionUserId } from '@/lib/session';

async function handleGET(req) {
  try {
    const userId = getSessionUserId(req);
    if (!userId) return NextResponse.json({ authenticated: false });

    await connectToDatabase();
    const User = getUserModel();
    const user = await User.findById(userId, 'email trialsLeft lockedUntil lastIP');
    if (!user) return NextResponse.json({ authenticated: false });

    return NextResponse.json({
      authenticated: true,
      email: user.email,
      trialsLeft: user.trialsLeft,
      lockedUntil: user.lockedUntil,
      lastIP: user.lastIP,
    });
  } catch (err) {
    console.error('/auth/status error', err);
    return NextResponse.json({ error: 'Status check failed' }, { status: 500 });
  }
}

export const GET = withEncryption(withAlerts('GET /auth/status', handleGET));
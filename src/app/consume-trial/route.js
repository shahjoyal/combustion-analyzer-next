import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getUserModel } from '@/lib/models';
import { getSessionUserId, destroySession } from '@/lib/session';

// Ported from requireAuth middleware in app.js
async function requireAuth(req) {
  const uid = getSessionUserId(req);
  if (!uid) return { error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) };

  await connectToDatabase();
  const User = getUserModel();
  const user = await User.findById(uid);
  if (!user) {
    return { error: NextResponse.json({ error: 'User not found' }, { status: 401 }) };
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { error: NextResponse.json({ error: 'Account locked until ' + user.lockedUntil.toISOString() }, { status: 403 }) };
  }
  return { user };
}

export async function POST(req) {
  try {
    const { user, error } = await requireAuth(req);
    if (error) return error;

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return NextResponse.json(
        { error: 'Account locked', lockedUntil: user.lockedUntil, trialsLeft: user.trialsLeft },
        { status: 403 }
      );
    }

    user.trialsLeft = (user.trialsLeft || 0) - 1;

    if (user.trialsLeft <= 0) {
      user.trialsLeft = 0;
      user.lockedUntil = new Date(Date.now() + 24 * 3600 * 1000);
      await user.save();

      const res = NextResponse.json({
        message: 'Trials exhausted. Account locked for 24 hours.',
        trialsLeft: user.trialsLeft,
        lockedUntil: user.lockedUntil,
      });
      destroySession(req, res);
      return res;
    }

    await user.save();
    return NextResponse.json({ message: 'Trial consumed', trialsLeft: user.trialsLeft, lockedUntil: user.lockedUntil || null });
  } catch (err) {
    console.error('/consume-trial error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

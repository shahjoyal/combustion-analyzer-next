import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import { getUserModel } from '@/lib/models';
import { createSession } from '@/lib/session';
import { getClientIp } from '@/lib/coalUtils';

export async function POST(req) {
  try {
    await connectToDatabase();
    const User = getUserModel();
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: 'Email & password required' }, { status: 400 });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return NextResponse.json({ error: 'Account locked until ' + user.lockedUntil.toISOString() }, { status: 403 });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const ip = getClientIp(req);
    user.lastIP = ip;
    user.ipHistory = user.ipHistory || [];
    user.ipHistory.push({ ip, when: new Date() });
    await user.save();

    const res = NextResponse.json({ message: 'Logged in' });
    createSession(res, user._id.toString());
    return res;
  } catch (err) {
    console.error('/auth/login error', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}

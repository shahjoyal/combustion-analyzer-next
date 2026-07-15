// Shared handler for GET /api/coal, /api/coals, /api/coal/list, /api/coal/all
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getCoalModel } from '@/lib/models';
import { normalizeCoalDoc } from '@/lib/coalUtils';

export async function coalListHandler() {
  try {
    await connectToDatabase();
    const Coal = getCoalModel();
    const docs = await Coal.find({}).lean().exec();
    const normalized = docs.map((d) => normalizeCoalDoc(d));
    return NextResponse.json(normalized);
  } catch (err) {
    console.error('GET /api/coals error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

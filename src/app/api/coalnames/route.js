import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getCoalModel } from '@/lib/models';

export async function GET() {
  try {
    await connectToDatabase();
    const Coal = getCoalModel();
    const docs = await Coal.find({}, { coal: 1 }).lean().exec();
    const minimal = docs.map((d) => ({ _id: d._id, coal: d.coal || d['Coal source name'] || d.name }));
    return NextResponse.json(minimal);
  } catch (err) {
    console.error('GET /api/coalnames error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

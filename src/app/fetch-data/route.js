import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getCoalModel } from '@/lib/models';

export async function GET() {
  try {
    await connectToDatabase();
    const Coal = getCoalModel();
    const data = await Coal.find({}, { __v: 0 }).lean();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

import { withAlerts } from '@/lib/withAlerts';
import { withEncryption } from '@/lib/withEncryption';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getCoalModel } from '@/lib/models';

async function handleGET() {
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

export const GET = withEncryption(withAlerts('GET /fetch-data', handleGET));
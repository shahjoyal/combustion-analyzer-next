import { NextResponse } from 'next/server';
import fs from 'fs';
import { TEST_CSV_PATH } from '@/lib/persistPaths';

export async function POST(req) {
  try {
    const { csv, rows } = await req.json();
    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json({ success: false, message: 'Invalid rows' }, { status: 400 });
    }

    if (csv && typeof csv === 'string') {
      fs.writeFileSync(TEST_CSV_PATH, csv, 'utf-8');
    } else {
      fs.writeFileSync(TEST_CSV_PATH, JSON.stringify(rows, null, 2));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

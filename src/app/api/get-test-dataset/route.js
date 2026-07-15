import { NextResponse } from 'next/server';
import fs from 'fs';
import { TEST_CSV_PATH } from '@/lib/persistPaths';
import { parseTestCsv } from '@/lib/coalUtils';

export async function GET() {
  try {
    if (!fs.existsSync(TEST_CSV_PATH)) {
      return NextResponse.json({ success: true, headers: [], rows: [] });
    }
    const csvText = fs.readFileSync(TEST_CSV_PATH, 'utf8');
    const parsed = parseTestCsv(csvText);
    return NextResponse.json({ success: true, headers: parsed.headers, rows: parsed.rows });
  } catch (err) {
    console.error('get-test-dataset error:', err);
    return NextResponse.json({ success: false, message: 'Failed to read test dataset' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import fs from 'fs';
import { COMPARISON_JSON_PATH } from '@/lib/persistPaths';

export async function GET() {
  try {
    if (!fs.existsSync(COMPARISON_JSON_PATH)) {
      return NextResponse.json({ success: true, data: null });
    }
    const data = JSON.parse(fs.readFileSync(COMPARISON_JSON_PATH, 'utf8'));
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('get-comparison-state error:', err);
    return NextResponse.json({ success: false, message: 'Failed to read comparison state' }, { status: 500 });
  }
}

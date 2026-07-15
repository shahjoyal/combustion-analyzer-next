import { NextResponse } from 'next/server';
import fs from 'fs';
import { COMPARISON_JSON_PATH } from '@/lib/persistPaths';

export async function POST(req) {
  try {
    const payload = (await req.json()) || {};
    fs.writeFileSync(COMPARISON_JSON_PATH, JSON.stringify(payload, null, 2), 'utf8');
    return NextResponse.json({ success: true, message: 'Comparison state saved successfully' });
  } catch (err) {
    console.error('save-comparison-state error:', err);
    return NextResponse.json({ success: false, message: 'Failed to save comparison state' }, { status: 500 });
  }
}

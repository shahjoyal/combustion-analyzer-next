import { withAlerts } from '@/lib/withAlerts';
import { withEncryption } from '@/lib/withEncryption';
import { NextResponse } from 'next/server';
import fs from 'fs';
import { COMPARISON_JSON_PATH } from '@/lib/persistPaths';

async function handlePOST(req) {
  try {
    const payload = (await req.json()) || {};
    fs.writeFileSync(COMPARISON_JSON_PATH, JSON.stringify(payload, null, 2), 'utf8');
    return NextResponse.json({ success: true, message: 'Comparison state saved successfully' });
  } catch (err) {
    console.error('save-comparison-state error:', err);
    return NextResponse.json({ success: false, message: 'Failed to save comparison state' }, { status: 500 });
  }
}

export const POST = withEncryption(withAlerts('POST /api/save-comparison-state', handlePOST));
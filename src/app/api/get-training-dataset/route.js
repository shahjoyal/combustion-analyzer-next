import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const lastPath = path.join(process.cwd(), 'last_training_upload.csv');
  if (!fs.existsSync(lastPath)) return NextResponse.json({ success: false, rows: [] });
  const text = fs.readFileSync(lastPath, 'utf8').trim();
  const lines = text.split('\n').filter(Boolean);
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map((line, i) => {
    const vals = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const row = { _rowNum: i + 1 };
    headers.forEach((h, j) => { row[h] = vals[j] ?? ''; });
    return row;
  });
  return NextResponse.json({ success: true, headers, rows });
}

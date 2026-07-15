import fs from 'fs';
import path from 'path';

export async function GET() {
  const lastPath = path.join(process.cwd(), 'last_training_upload.csv');
  if (!fs.existsSync(lastPath)) return new Response('', { status: 404 });
  return new Response(fs.readFileSync(lastPath, 'utf8'), {
    headers: { 'Content-Type': 'text/csv' },
  });
}

import { withAlerts } from '@/lib/withAlerts';
import { withEncryption } from '@/lib/withEncryption';
import fs from 'fs';
import path from 'path';

async function handleGET() {
  const lastPath = path.join(process.cwd(), 'last_training_upload.csv');
  if (!fs.existsSync(lastPath)) return new Response('', { status: 404 });
  return new Response(fs.readFileSync(lastPath, 'utf8'), {
    headers: { 'Content-Type': 'text/csv' },
  });
}

export const GET = withEncryption(withAlerts('GET /api/last-training-upload', handleGET));
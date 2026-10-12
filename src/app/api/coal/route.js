import { withAlerts } from '@/lib/withAlerts';
import { withEncryption } from '@/lib/withEncryption';
import { coalListHandler } from '@/lib/coalListHandler';
async function handleGET() {
  return coalListHandler();
}

export const GET = withEncryption(withAlerts('GET /api/coal', handleGET));
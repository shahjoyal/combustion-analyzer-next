import { withAlerts } from '@/lib/withAlerts';
import { coalListHandler } from '@/lib/coalListHandler';
async function handleGET() {
  return coalListHandler();
}

export const GET = withAlerts('GET /api/coals', handleGET);

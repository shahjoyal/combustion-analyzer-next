import { coalListHandler } from '@/lib/coalListHandler';
export async function GET() {
  return coalListHandler();
}

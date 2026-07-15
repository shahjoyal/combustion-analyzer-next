import path from 'path';
import fs from 'fs';

export const PERSIST_DIR = path.join(process.cwd(), 'data');
export const TEST_CSV_PATH = path.join(PERSIST_DIR, 'test.csv');
export const COMPARISON_JSON_PATH = path.join(PERSIST_DIR, 'comparison_state.json');

if (!fs.existsSync(PERSIST_DIR)) {
  fs.mkdirSync(PERSIST_DIR, { recursive: true });
}

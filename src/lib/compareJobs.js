// src/lib/compareJobs.js
// Ported verbatim from app.js: an in-memory job table for the long-running
// /api/compare-models training job, plus the worker_threads runner that
// keeps the CPU-bound RF/ANN/LSSVM training off the main event loop.

import path from 'path';
import { Worker } from 'worker_threads';

if (!global._compareModelsJobs) {
  global._compareModelsJobs = new Map();
}
export const compareModelsJobs = global._compareModelsJobs;

// periodic cleanup of old finished jobs (same 30 min cutoff idea as original)
if (!global._compareModelsCleanupTimer) {
  global._compareModelsCleanupTimer = setInterval(() => {
    const cutoff = Date.now() - 30 * 60 * 1000;
    for (const [id, job] of compareModelsJobs.entries()) {
      if (job.status !== 'running' && job.createdAt < cutoff) compareModelsJobs.delete(id);
    }
  }, 5 * 60 * 1000);
}

const WORKER_PATH = path.join(process.cwd(), 'src', 'lib', 'legacy', 'model_compare_worker.js');

export function runAllModelsInWorker(lastPath, { verbose, timeoutMs, onProgress } = {}) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(WORKER_PATH, {
      workerData: { lastPath, verbose, timeoutMs },
    });
    let settled = false;
    worker.on('message', (msg) => {
      if (!msg) return;
      if (msg.type === 'progress') {
        onProgress && onProgress(msg.event);
      } else if (msg.type === 'done') {
        settled = true;
        resolve(msg.result);
        worker.terminate();
      } else if (msg.type === 'error') {
        settled = true;
        reject(new Error(msg.message));
        worker.terminate();
      }
    });
    worker.on('error', (err) => {
      if (!settled) {
        settled = true;
        reject(err);
      }
    });
    worker.on('exit', (code) => {
      if (!settled && code !== 0) {
        settled = true;
        reject(new Error(`model_compare_worker exited with code ${code}`));
      }
    });
  });
}

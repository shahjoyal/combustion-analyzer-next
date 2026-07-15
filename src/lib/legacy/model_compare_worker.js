// model_compare_worker.js
//
// Runs runAllModels() (Pure/Hybrid/Residual RF, ANN, LSSVM - all synchronous,
// CPU-bound JS) on a dedicated worker_threads thread instead of the main
// Node event loop. Without this, training blocks the ENTIRE server - not
// just the /api/compare-models request, but every other request too,
// including the /api/compare-models/status/:jobId polling endpoint, which is
// why polling itself was seen to 504.
//
// Communication with the main thread is via postMessage:
//   { type: 'progress', event }  - forwarded from runAllModels' onProgress
//   { type: 'done', result }     - final result object
//   { type: 'error', message }   - fatal error

const { parentPort, workerData } = require('worker_threads');
const { runAllModels } = require('./model_compare');

(async () => {
  try {
    const { lastPath, verbose, timeoutMs } = workerData;

    const result = await runAllModels(lastPath, {
      onProgress: (ev) => parentPort.postMessage({ type: 'progress', event: ev }),
      verbose,
      continueOnError: true,
      debuggerOnError: false,
      timeoutMs
    });

    parentPort.postMessage({ type: 'done', result });
  } catch (err) {
    parentPort.postMessage({ type: 'error', message: String((err && err.message) || err) });
  }
})();
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { convertExcelToCSV, removeCoalNameColumn } from '@/lib/coalUtils';
import { compareModelsJobs, runAllModelsInWorker } from '@/lib/compareJobs';
import { ML_SERVICE_URL } from '@/lib/aftEngine';

const ROOT = process.cwd();

async function runCompareModelsJob(jobId, lastPath, { verbose, timeoutMs, __cmStart, __cmLog }) {
  const job = compareModelsJobs.get(jobId);
  const progressLog = job.progressLog;
  const pushProgress = (ev) => {
    const toPush = Object.assign({}, ev);
    if (toPush._mem && Object.keys(toPush._mem).length > 5) {
      toPush._mem = { rss: toPush._mem.rss, heapUsed: toPush._mem.heapUsed };
    }
    progressLog.push(toPush);
  };

  let nodeResults = {};
  __cmLog('runAllModels: START (JS models, on worker thread)');
  try {
    nodeResults = await runAllModelsInWorker(lastPath, { onProgress: pushProgress, verbose, timeoutMs });
    __cmLog('runAllModels: DONE (JS models)');
  } catch (runErr) {
    console.error('runAllModels fatal error', runErr);
    __cmLog(`runAllModels: FAILED - ${runErr && runErr.message}`);
    progressLog.push({ event: 'fatal', message: String(runErr) });
  }

  const testSetRows = nodeResults._testSet || [];
  delete nodeResults._testSet;

  let xgbResults = {};
  const ML_CALL_TIMEOUT_MS = process.env.ML_SERVICE_TIMEOUT_MS ? Number(process.env.ML_SERVICE_TIMEOUT_MS) : 170000;
  __cmLog(`python call: START -> ${ML_SERVICE_URL}/train_from_path (path=${lastPath}, abortTimeout=${ML_CALL_TIMEOUT_MS}ms)`);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ML_CALL_TIMEOUT_MS);
  try {
    const pyResp = await fetch(`${ML_SERVICE_URL}/train_from_path`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: lastPath }),
      signal: controller.signal,
    });
    __cmLog(`python call: response received, status=${pyResp.status}`);

    if (pyResp.ok) {
      const pyJson = await pyResp.json();
      xgbResults = pyJson.results || pyJson;
      __cmLog('python call: JSON parsed OK');
      progressLog.push({ event: 'python_done', message: 'Python XGBoost finished', details: xgbResults });
    } else {
      const txt = await pyResp.text();
      __cmLog(`python call: NON-OK status=${pyResp.status} body=${txt.slice(0, 500)}`);
      progressLog.push({ event: 'python_error', message: 'Python training returned non-OK', details: txt });
      console.warn('Python training failed:', txt);
    }
  } catch (pyErr) {
    const wasAbort = pyErr && pyErr.name === 'AbortError';
    __cmLog(`python call: ${wasAbort ? `TIMED OUT after ${ML_CALL_TIMEOUT_MS}ms (training likely still running server-side)` : `FAILED - ${pyErr && pyErr.message}`}`);
    progressLog.push({
      event: 'python_unreachable',
      message: wasAbort ? `Python call aborted after ${ML_CALL_TIMEOUT_MS}ms client-side timeout` : 'Python ML service not reachable',
      details: pyErr && pyErr.message,
    });
    console.warn('Python service not reachable:', pyErr && pyErr.message);
  } finally {
    clearTimeout(timer);
  }
  __cmLog('python call: END');

  const mergedResults = { ...nodeResults };
  for (const key in xgbResults) {
    if (!mergedResults[key]) mergedResults[key] = xgbResults[key];
  }

  __cmLog(`TOTAL: ${Date.now() - __cmStart}ms`);

  job.status = 'done';
  job.data = {
    success: true,
    results: mergedResults,
    trainingPath: lastPath,
    testSet: testSetRows,
    progressLog,
  };
}

export async function POST(req) {
  const __cmStart = Date.now();
  const __cmLog = (label) => console.log(`[compare-models] ${label} (+${Date.now() - __cmStart}ms)`);
  try {
    __cmLog('REQUEST RECEIVED');
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file) return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    __cmLog(`file received: name=${file.name} size=${file.size} bytes`);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = path.extname(file.name || '').toLowerCase();
    let csvText;

    if (ext === '.xlsx' || ext === '.xls') {
      try {
        csvText = convertExcelToCSV(buffer);
      } catch (convErr) {
        console.error('/api/compare-models Excel -> CSV conversion failed:', convErr && convErr.message);
        return NextResponse.json({ success: false, message: 'Failed to convert Excel to CSV', details: String(convErr) }, { status: 400 });
      }
    } else {
      csvText = buffer.toString('utf8').replace(/\r\n/g, '\n').trim() + '\n';
    }

    csvText = removeCoalNameColumn(csvText);
    csvText = csvText.replace(/\r\n/g, '\n').trim() + '\n';

    const lastPath = path.join(ROOT, 'last_training_upload.csv');
    const { searchParams } = new URL(req.url);
    const trainMode = (formData.get('trainMode') || searchParams.get('trainMode') || 'new').toString().toLowerCase();

    if (trainMode === 'append' && fs.existsSync(lastPath)) {
      try {
        const existingText = fs.readFileSync(lastPath, 'utf8').replace(/\r\n/g, '\n').trim();
        const existingLines = existingText ? existingText.split('\n') : [];
        const newLines = csvText ? csvText.split('\n') : [];

        if (existingLines.length === 0) {
          fs.writeFileSync(lastPath, csvText, 'utf8');
          console.log('/api/compare-models: existing dataset empty, wrote uploaded CSV to', lastPath);
        } else {
          const existingHeader = existingLines[0].trim();
          const newHeader = newLines[0] ? newLines[0].trim() : '';
          if (existingHeader !== newHeader) {
            return NextResponse.json(
              {
                success: false,
                message: 'Header mismatch between existing dataset and uploaded file. Ensure the same columns (order and names).',
                details: { existingHeader, newHeader },
              },
              { status: 400 }
            );
          }

          const mergedLines = [existingHeader, ...existingLines.slice(1), ...newLines.slice(1)].filter((l) => l !== undefined && l !== null);
          const mergedText = mergedLines.join('\n').trim() + '\n';

          fs.writeFileSync(lastPath, mergedText, 'utf8');
          console.log('/api/compare-models appended uploaded CSV to', lastPath);
        }
      } catch (appendErr) {
        console.error('/api/compare-models append error:', appendErr);
        return NextResponse.json({ success: false, message: 'Failed to append to existing dataset', details: String(appendErr) }, { status: 500 });
      }
    } else {
      fs.writeFileSync(lastPath, csvText, 'utf8');
      console.log('/api/compare-models saved CSV to', lastPath, '(mode:', trainMode, ')');
    }
    __cmLog(`CSV written to disk at ${lastPath} (mode: ${trainMode})`);

    const verbose = searchParams.get('debug') === '1' || searchParams.get('debug') === 'true';
    const timeoutMs = searchParams.get('timeoutMs')
      ? Number(searchParams.get('timeoutMs'))
      : process.env.DEFAULT_TRAIN_TIMEOUT_MS
      ? Number(process.env.DEFAULT_TRAIN_TIMEOUT_MS)
      : undefined;

    const jobId = crypto.randomUUID();
    compareModelsJobs.set(jobId, { status: 'running', data: null, message: null, progressLog: [], createdAt: Date.now() });
    __cmLog(`job created: ${jobId} - responding immediately, training continues in background`);

    // fire-and-forget background job (same as the old worker_threads flow)
    runCompareModelsJob(jobId, lastPath, { verbose, timeoutMs, __cmStart, __cmLog }).catch((err) => {
      console.error('compare-models background job crashed', err);
      const job = compareModelsJobs.get(jobId);
      if (job) {
        job.status = 'error';
        job.message = String((err && err.message) || err);
      }
    });

    return NextResponse.json({ success: true, jobId });
  } catch (err) {
    console.error('Model comparison error:', err);
    __cmLog(`FATAL ERROR after ${Date.now() - __cmStart}ms: ${err && err.message}`);
    return NextResponse.json({ success: false, message: 'Server error during model comparison', details: String(err) }, { status: 500 });
  }
}

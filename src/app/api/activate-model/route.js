import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { loadActiveModel, activeModel } from '@/lib/aftEngine';

const ROOT = process.cwd();

export async function POST(req) {
  try {
    const body = await req.json();
    const modelName = body.modelName;
    if (!modelName) return NextResponse.json({ success: false, message: 'Model name missing' });

    let scriptPath = null;
    if (modelName === 'pure_rf') scriptPath = path.join(ROOT, 'src', 'lib', 'legacy', 'rf2.js');
    else if (modelName === 'hybrid_rf') scriptPath = path.join(ROOT, 'src', 'lib', 'legacy', 'hybrid2.js');
    else if (modelName === 'ann') scriptPath = path.join(ROOT, 'src', 'lib', 'legacy', 'ann2.js');
    else if (modelName === 'base_formula') {
      fs.writeFileSync(path.join(ROOT, 'active_model.json'), JSON.stringify({ type: 'base_formula' }, null, 2));
      loadActiveModel();
      return NextResponse.json({ success: true });
    } else if (modelName === 'pure_xgb' || modelName === 'hybrid_xgb') {
      // For XGBoost we DO NOT run a JS trainer - the Python ml-service owns those models.
      fs.writeFileSync(path.join(ROOT, 'active_model.json'), JSON.stringify({ type: modelName }, null, 2));
      activeModel.type = modelName;
      activeModel.model = null;
      activeModel.raw = null;
      activeModel.annScaling = null;
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, message: 'Invalid model selected' });
    }

    if (!fs.existsSync(scriptPath)) return NextResponse.json({ success: false, message: 'Script not found' });

    const lastPath = path.join(ROOT, 'last_training_upload.csv');
    const trainingArg = fs.existsSync(lastPath) ? lastPath : path.join(ROOT, 'aft_training_data1.csv');

    console.log('Running trainer:', scriptPath, 'with training CSV:', trainingArg);

    return await new Promise((resolve) => {
      // The trainer scripts write their JSON outputs (best_model_ann.json,
      // aft_model.json, etc.) relative to their own CWD (`__dirname` /
      // process.cwd()), so we run them with cwd set to the project root -
      // same as the original `node ann2.js` invocation from the repo root.
      const child = spawn(process.execPath, [scriptPath, trainingArg], { env: process.env, cwd: ROOT });

      child.stdout.on('data', (data) => process.stdout.write('[trainer stdout] ' + data.toString()));
      child.stderr.on('data', (data) => process.stderr.write('[trainer stderr] ' + data.toString()));

      child.on('close', (code) => {
        if (code !== 0) {
          console.error('Training failed with exit code', code);
          return resolve(NextResponse.json({ success: false, message: 'Training failed' }));
        }

        fs.writeFileSync(path.join(ROOT, 'active_model.json'), JSON.stringify({ type: modelName }, null, 2));
        try {
          loadActiveModel();
        } catch (e) {
          console.warn('loadActiveModel after activation failed', e && e.message);
        }

        console.log('Model activated:', modelName);
        resolve(NextResponse.json({ success: true }));
      });
    });
  } catch (err) {
    console.error('/api/activate-model error:', err);
    return NextResponse.json({ success: false, message: String(err) });
  }
}

// rf.js
// Usage:
//   node rf.js [csv_path] [user_id]
// If csv_path omitted, script prefers (in order):
//  - <project>/user_models/<user_id>/last_training_upload.csv
//  - <project>/user_models/<user_id>/dataset.csv
//  - newest file in <project>/user_models/<user_id>/uploads/
//  - ./last_training_upload.csv (fallback global)
//
// Models and JSONs (aft_model.json, preprocessing.json, summary_*.json) are saved
// into the user's folder (user_models/<user_id>) if user_id provided, else into ./models

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { RandomForestRegression } = require('ml-random-forest');

function asFloat(v) {
  if (v === null || v === undefined) return null;
  const n = parseFloat(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}
function quantile(sortedArr, q) {
  if (!sortedArr.length) return 0;
  if (q <= 0) return sortedArr[0];
  if (q >= 1) return sortedArr[sortedArr.length-1];
  const pos = (sortedArr.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sortedArr[base+1] !== undefined) {
    return sortedArr[base] + rest * (sortedArr[base+1] - sortedArr[base]);
  } else {
    return sortedArr[base];
  }
}
function meanAbs(a,b){ let s=0; for(let i=0;i<a.length;i++) s+=Math.abs(a[i]-b[i]); return s/a.length; }
function rmseCalc(a,b){ let s=0; for(let i=0;i<a.length;i++) s+=Math.pow(a[i]-b[i],2); return Math.sqrt(s/a.length); }
function percentWithin(a,b,tol){ let c=0; for(let i=0;i<a.length;i++) if (Math.abs(a[i]-b[i])<=tol) c++; return (c/a.length)*100; }
function shuffleArray(arr){ for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

const argCsv = process.argv[2];
const argUserId = process.argv[3] || process.env.USER_ID || null;

// Base folder for per-user models
const USER_MODELS_BASE = path.join(__dirname, 'user_models');

// Helper to find candidate CSV inside user folder
function findUserCsv(userDir) {
  const candidates = [
    path.join(userDir, 'last_training_upload.csv'),
    path.join(userDir, 'dataset.csv')
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  // check uploads folder for newest file
  const uploadsDir = path.join(userDir, 'uploads');
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir)
      .map(f => ({ name: f, abs: path.join(uploadsDir, f), mtime: fs.statSync(path.join(uploadsDir, f)).mtime.getTime() }))
      .filter(x => fs.statSync(x.abs).isFile())
      .sort((a,b)=>b.mtime - a.mtime);
    if (files.length) return files[0].abs;
  }
  return null;
}

// Determine CSV file path
let CSV_FILE = null;
if (argCsv) {
  CSV_FILE = path.isAbsolute(argCsv) ? argCsv : path.join(process.cwd(), argCsv);
} else if (argUserId) {
  // Prefer files in user_models/<userId> (not ml-service prefix) to match app flow
  const userDirCandidate = path.join(USER_MODELS_BASE, String(argUserId));
  const found = findUserCsv(userDirCandidate);
  if (found) CSV_FILE = found;
  else CSV_FILE = path.join(__dirname, 'last_training_upload.csv'); // fallback
} else {
  CSV_FILE = path.join(__dirname, 'last_training_upload.csv');
}

// Determine model output dir (per-user if user_id provided)
const MODEL_DIR = argUserId
  ? path.join(USER_MODELS_BASE, String(argUserId))
  : path.join(__dirname, 'models');

if (!fs.existsSync(CSV_FILE)) {
  console.error('CSV not found (rf.js expects uploaded file at):', CSV_FILE);
  process.exit(1);
}

fs.mkdirSync(MODEL_DIR, { recursive: true });
console.log('Using CSV:', CSV_FILE);
console.log('Saving outputs to model dir:', MODEL_DIR);

const rows = [];
fs.createReadStream(CSV_FILE)
  .pipe(csv())
  .on('data', r => rows.push(r))
  .on('end', main)
  .on('error', e => { console.error(e); process.exit(1); });

function main(){
  const data=[];
  rows.forEach((row, i) => {
    // robust header handling: support possible header variants
    // try common keys first, fallback to lowercased keys
    const getVal = (obj, key) => {
      if (obj[key] !== undefined) return obj[key];
      const low = key.toLowerCase();
      for (const k of Object.keys(obj)) {
        if (k.trim().toLowerCase() === low) return obj[k];
      }
      return undefined;
    };

    const values = [
      asFloat(getVal(row,'SiO2')), asFloat(getVal(row,'Al2O3')), asFloat(getVal(row,'Fe2O3')),
      asFloat(getVal(row,'CaO')), asFloat(getVal(row,'MgO')), asFloat(getVal(row,'Na2O')),
      asFloat(getVal(row,'K2O')), asFloat(getVal(row,'SO3')), asFloat(getVal(row,'TiO2')),
      asFloat(getVal(row,'P2O5')), asFloat(getVal(row,'S')) // <-- newly included columns
    ];
    const aft = asFloat(getVal(row,'AFT'));
    if (values.some(v => v === null) || aft === null) return;
    data.push({ index: i+1, values, aft });
  });
  if (!data.length) { console.error('No valid rows found in CSV:', CSV_FILE); process.exit(1); }
  console.log('Valid rows:', data.length);

  const Xraw = data.map(d => d.values.slice(0)); // now includes 11 features if P2O5,S present
  const Y = data.map(d => d.aft);

  // Winsorize each feature at 1%/99% and save cutoffs
  const Xt = Xraw.map(r => r.slice());
  const cutoffs = { lower: [], upper: [] };
  for (let c = 0; c < Xt[0].length; c++) {
    const col = Xt.map(r => r[c]).slice().sort((a,b)=>a-b);
    const lo = quantile(col, 0.01), hi = quantile(col, 0.99);
    cutoffs.lower.push(lo); cutoffs.upper.push(hi);
    for (let r = 0; r < Xt.length; r++) {
      if (Xt[r][c] < lo) Xt[r][c] = lo;
      if (Xt[r][c] > hi) Xt[r][c] = hi;
    }
  }

  fs.writeFileSync(path.join(MODEL_DIR, 'preprocessing.json'), JSON.stringify(cutoffs, null, 2));
  console.log('Saved preprocessing.json to', path.join(MODEL_DIR, 'preprocessing.json'));

  // Shuffle & split (80/20)
  const ids = shuffleArray(Array.from({length: Xt.length}, (_,i) => i));
  const split = Math.floor(0.8 * ids.length);
  const trainIdx = ids.slice(0, split), testIdx = ids.slice(split);
  fs.writeFileSync(path.join(MODEL_DIR, 'test_indices.json'), JSON.stringify({ testIdx, trainIdx }, null, 2));

  const X_train = trainIdx.map(i => Xt[i]), Y_train = trainIdx.map(i => Y[i]);
  const X_test  = testIdx.map(i => Xt[i]), Y_test  = testIdx.map(i => Y[i]);

  console.log('Train size:', X_train.length, 'Test size:', X_test.length);

  // grid
  const grid = [
    { nEstimators: 100, maxDepth: 10, minNumSamples: 4, replacement: false },
    { nEstimators: 150, maxDepth: 12, minNumSamples: 3, replacement: false },
    { nEstimators: 200, maxDepth: 14, minNumSamples: 2, replacement: false }
  ];

  let best = { mae: Infinity, params: null, modelJSON: null, preds: null };

  for (const cfg of grid) {
    console.log('Training', cfg);
    const rf = new RandomForestRegression({
      nEstimators: cfg.nEstimators,
      maxFeatures: Math.max(1, Math.floor(Math.sqrt(X_train[0].length))),
      maxDepth: cfg.maxDepth,
      minNumSamples: cfg.minNumSamples,
      replacement: !!cfg.replacement,
      seed: 42
    });
    rf.train(X_train, Y_train);
    const preds = rf.predict(X_test);
    const mae = meanAbs(Y_test, preds);
    const rmse = rmseCalc(Y_test, preds);
    const within20 = percentWithin(Y_test, preds, 20);
    console.log(` -> MAE ${mae.toFixed(2)}, RMSE ${rmse.toFixed(2)}, %within±20 ${within20.toFixed(1)}%`);
    if (mae < best.mae) {
      best.mae = mae; best.params = cfg; best.modelJSON = rf.toJSON(); best.preds = preds;
    }
  }

  if (!best.modelJSON) { console.error('No model trained'); process.exit(1); }

  // Save model JSON to modelDir/aft_model.json (app.js can load from user folder if activated)
  fs.writeFileSync(path.join(MODEL_DIR, 'aft_model.json'), JSON.stringify(best.modelJSON, null, 2));
  fs.writeFileSync(path.join(MODEL_DIR, 'model_meta.json'), JSON.stringify({
    params: best.params,
    date: new Date().toISOString(),
    train_size: X_train.length,
    test_size: X_test.length
  }, null, 2));
  console.log('Saved aft_model.json and model_meta.json. Best MAE:', best.mae);

  // per-row analysis (rounded predictions)
  const predsRounded = best.preds.map(p => Math.round(p));
  const results = [];
  let maxAbs=-Infinity, minAbs=Infinity, totalAbs=0, c20=0,c40=0,c60=0;
  let maxRow=null, minRow=null;
  for (let i=0;i<predsRounded.length;i++){
    const idx = testIdx[i];
    const actual = Y_test[i];
    const pred = predsRounded[i];
    const absE = Math.abs(actual - pred);
    totalAbs += absE;
    if (absE > maxAbs) { maxAbs = absE; maxRow = { row: data[idx].index, actual, pred, absE, features: data[idx].values }; }
    if (absE < minAbs) { minAbs = absE; minRow = { row: data[idx].index, actual, pred, absE, features: data[idx].values }; }
    if (absE > 20) c20++; if (absE>40) c40++; if (absE>60) c60++;
    results.push({ row: data[idx].index, actual, pred, absE, features: data[idx].values });
  }

  const summary = {
    model: 'pure_rf',
    params: best.params,
    MAE_on_test: Number(best.mae.toFixed(4)),
    avg_abs_error: Number((totalAbs / predsRounded.length).toFixed(4)),
    max_abs_error: maxAbs,
    min_abs_error: minAbs,
    count_abs_gt_20: c20,
    count_abs_gt_40: c40,
    count_abs_gt_60: c60,
    test_rows: predsRounded.length
  };

  // updated header: include P2O5 and S (the two new features)
  fs.writeFileSync(path.join(MODEL_DIR, 'results_pure_rf_prod.csv'), [
    'row,actualAFT,predictedAFT,absError,SiO2,Al2O3,Fe2O3,CaO,MgO,Na2O,K2O,SO3,TiO2,P2O5,S',
    ...results.map(r => `${r.row},${r.actual},${r.pred},${r.absE},${r.features.join(',')}`)
  ].join('\n'));
  fs.writeFileSync(path.join(MODEL_DIR, 'summary_pure_rf_prod.json'), JSON.stringify(summary, null, 2));
  fs.writeFileSync(path.join(MODEL_DIR, 'best_model_pure_rf.json'), JSON.stringify(best.modelJSON, null, 2));
  console.log('Saved results and summary into', MODEL_DIR);
}
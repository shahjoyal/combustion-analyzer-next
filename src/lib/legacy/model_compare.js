// model_compare.js

const fs = require('fs');
const csv = require('csv-parser');
const { RandomForestRegression } = require('ml-random-forest');
const brain = require('brain.js');
const path = require('path');


// ---------------- UTILITIES ----------------

function asFloat(v) {
  const n = parseFloat(String(v).replace(/,/g,''));
  return Number.isFinite(n) ? n : null;
}

function mulberry32(a) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

function seededShuffle(arr, seed=42) {
  const rnd = mulberry32(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}


// ---------------- METRICS ----------------

function computeStats(preds, actuals, metaRows) {

  let totalAbs = 0;
  let maxError = -Infinity;
  let minError = Infinity;

  let c20=0,c40=0,c60=0;

  for (let i=0;i<preds.length;i++) {

    const err = Math.abs(preds[i] - actuals[i]);

    totalAbs += err;

    if(err > maxError) maxError = err;
    if(err < minError) minError = err;

    if(err > 20) c20++;
    if(err > 40) c40++;
    if(err > 60) c60++;
  }

  return {
    rows: preds.length,
    avgAbs: Number((totalAbs/preds.length).toFixed(2)),
    maxError: Number(maxError.toFixed(6)),
    minError: Number(minError.toFixed(6)),
    gt20: c20,
    gt40: c40,
    gt60: c60
  };
}


// ---------------- BASE FORMULA ----------------

function formulaAFT(v) {
  const [
    SiO2 = 0,
    Al2O3 = 0,
    Fe2O3 = 0,
    CaO = 0,
    MgO = 0,
    Na2O = 0,
    K2O = 0,
    SO3 = 0,
    TiO2 = 0
  ] = v;

  const NaK = (Na2O || 0) + (K2O || 0);
  const sumSiAl = SiO2 + Al2O3;
  const FeCa = (Fe2O3 || 0) + (CaO || 0);
  const FECA_THRESHOLD = 12.6;

  if (sumSiAl < 45) {
    if (FeCa <= FECA_THRESHOLD) {
      return 949.3601
        + 0.5646 * SiO2
        + 2.1826 * Al2O3
        + 1.6339 * Fe2O3
        + 6.3412 * CaO
        + 8.6798 * MgO
        + 5.0377 * NaK
        + 0.7961 * SO3
        - 2.1892 * TiO2;
    } else {
      return 949.3601
        + 0.5646 * SiO2
        + 2.1826 * Al2O3
        + 1.6339 * Fe2O3
        + 6.3412 * CaO
        + 8.6798 * MgO
        + 5.0377 * NaK
        + 0.7961 * SO3
        - 2.1892 * TiO2;
    }
  } else if (sumSiAl < 55) {
    if (FeCa <= FECA_THRESHOLD) {
      return 1124.2069
        - 0.0797 * SiO2
        + 4.2971 * Al2O3
        - 0.1462 * Fe2O3
        + 4.7533 * CaO
        + 3.0594 * MgO
        + 3.0923 * NaK
        - 2.2814 * SO3
        - 4.1400 * TiO2;
    } else {
      return 1124.2069
        - 0.0797 * SiO2
        + 4.2971 * Al2O3
        - 0.1462 * Fe2O3
        + 4.7533 * CaO
        + 3.0594 * MgO
        + 3.0923 * NaK
        - 2.2814 * SO3
        - 4.1400 * TiO2;
    }
  } else if (sumSiAl < 65) {
    if (FeCa <= FECA_THRESHOLD) {
      return 1137.4961
        + 1.1956 * SiO2
        + 3.5062 * Al2O3
        + 3.3419 * Fe2O3
        - 12.5158 * CaO
        - 2.2775 * MgO
        + 0.0163 * NaK
        + 6.7002 * SO3
        + 1.9344 * TiO2;
    } else {
      return 1177.4801
        + 0.1559 * SiO2
        + 7.8153 * Al2O3
        - 1.7562 * Fe2O3
        + 1.9570 * CaO
        - 4.3791 * MgO
        - 2.8309 * NaK
        - 4.1712 * SO3
        + 1.7976 * TiO2;
    }
  } else if (sumSiAl < 75) {
    if (FeCa <= FECA_THRESHOLD) {
      return -1452.0645
        + 45.6395 * SiO2
        + 43.3054 * Al2O3
        - 31.2287 * Fe2O3
        - 67.6606 * CaO
        - 37.1564 * MgO
        - 28.9117 * NaK
        + 36.5424 * SO3
        + 1.4591 * TiO2;
    } else {
      return 1103.1611
        + 3.1111 * SiO2
        + 6.8292 * Al2O3
        + 0.2934 * Fe2O3
        + 0.8048 * CaO
        - 8.8943 * MgO
        - 6.3487 * NaK
        - 4.9725 * SO3
        + 4.9459 * TiO2;
    }
  } else {
    if (FeCa <= FECA_THRESHOLD) {
      return 1468.9852
        + 0.4432 * SiO2
        + 2.0587 * Al2O3
        - 3.8776 * Fe2O3
        - 6.5077 * CaO
        - 8.5353 * MgO
        + 3.2333 * NaK
        - 10.3822 * SO3
        + 3.3885 * TiO2;
    } else {
      return 1109.9520
        + 1.4242 * SiO2
        + 7.7724 * Al2O3
        + 3.3740 * Fe2O3
        - 8.8021 * CaO
        - 15.7613 * MgO
        + 6.8226 * NaK
        + 9.8592 * SO3
        + 22.3574 * TiO2;
    }
  }
}

class LSSVMRegressorJS {
  constructor(gamma = 200.0, sigma = 8.0) {
    this.gamma = gamma;
    this.sigma = sigma;
    this.alphas = null;
    this.bias = null;
    this.X_train = null;
    this.scalerMean = null;
    this.scalerStd = null;
  }

  // ---- z-score normalisation ----
  _fitNormalize(X) {
    const n = X.length;
    const d = X[0].length;
    this.scalerMean = new Array(d).fill(0);
    this.scalerStd  = new Array(d).fill(0);
    for (let i = 0; i < n; i++)
      for (let j = 0; j < d; j++)
        this.scalerMean[j] += X[i][j];
    for (let j = 0; j < d; j++) this.scalerMean[j] /= n;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < d; j++)
        this.scalerStd[j] += (X[i][j] - this.scalerMean[j]) ** 2;
    for (let j = 0; j < d; j++) {
      this.scalerStd[j] = Math.sqrt(this.scalerStd[j] / n);
      if (this.scalerStd[j] === 0) this.scalerStd[j] = 1;
    }
  }

  _normalize(X) {
    return X.map(row => row.map((v, j) => (v - this.scalerMean[j]) / this.scalerStd[j]));
  }

  // ---- RBF kernel: K(x_i, x_j) = exp(-||x_i - x_j||^2 / (2*sigma^2)) ----
  _rbf(x1, x2) {
    let sq = 0;
    for (let j = 0; j < x1.length; j++) sq += (x1[j] - x2[j]) ** 2;
    return Math.exp(-sq / (2 * this.sigma ** 2));
  }

  _kernelMatrix(X1, X2) {
    return X1.map(xi => X2.map(xj => this._rbf(xi, xj)));
  }

  // ---- Solve linear system Ax = b using Gaussian elimination ----
  _solveLinear(A, b) {
    const n = b.length;
    const M = A.map((row, i) => [...row, b[i]]);
    for (let col = 0; col < n; col++) {
      let maxRow = col;
      for (let row = col + 1; row < n; row++)
        if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row;
      [M[col], M[maxRow]] = [M[maxRow], M[col]];
      const pivot = M[col][col];
      if (Math.abs(pivot) < 1e-12) continue;
      for (let row = col + 1; row < n; row++) {
        const factor = M[row][col] / pivot;
        for (let k = col; k <= n; k++) M[row][k] -= factor * M[col][k];
      }
    }
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      x[i] = M[i][n];
      for (let j = i + 1; j < n; j++) x[i] -= M[i][j] * x[j];
      x[i] /= M[i][i] || 1e-12;
    }
    return x;
  }

  // ---- Training ----
  fit(X, y) {
    // Cap training samples to avoid very slow matrix solve on large datasets
    const MAX_SAMPLES = 1500;
    if (X.length > MAX_SAMPLES) {
      const idx = [];
      for (let i = 0; i < X.length; i++) idx.push(i);
      seededShuffle(idx, 42);
      X = idx.slice(0, MAX_SAMPLES).map(i => X[i]);
      y = idx.slice(0, MAX_SAMPLES).map(i => y[i]);
    }

    const n = y.length;
    this._fitNormalize(X);
    const Xn = this._normalize(X);
    this.X_train = Xn;

    const K = this._kernelMatrix(Xn, Xn);
    for (let i = 0; i < n; i++) K[i][i] += 1.0 / this.gamma;  // regularisation

    // Build (n+1) x (n+1) KKT system
    const size = n + 1;
    const A    = Array.from({ length: size }, () => new Array(size).fill(0));
    const bVec = new Array(size).fill(0);

    A[0][0] = 0;
    for (let j = 1; j <= n; j++) A[0][j] = 1;
    bVec[0] = 0;

    for (let i = 0; i < n; i++) {
      A[i + 1][0] = 1;
      for (let j = 0; j < n; j++) A[i + 1][j + 1] = K[i][j];
      bVec[i + 1] = y[i];
    }

    const z    = this._solveLinear(A, bVec);
    this.bias   = z[0];
    this.alphas = z.slice(1);
    return this;
  }

  // ---- Prediction ----
  predict(X) {
    const Xn = this._normalize(X);
    return Xn.map(xtest => {
      let val = this.bias;
      for (let i = 0; i < this.X_train.length; i++)
        val += this.alphas[i] * this._rbf(this.X_train[i], xtest);
      return val;
    });
  }
}


// ---------------- MODELS ----------------


function trainPureRF(X, Y, trainIdx, testIdx) {

  const rf = new RandomForestRegression({
    nEstimators: 150,
    maxDepth: 12,
    minNumSamples: 3,
    seed: 42
  });

  rf.train(trainIdx.map(i => X[i]), trainIdx.map(i => Y[i]));

  const preds = rf.predict(testIdx.map(i => X[i]));
  const actual = testIdx.map(i => Y[i]);

  return { stats: computeStats(preds, actual), preds, actual };
}


// hybrid RF (formula as extra feature)

function trainHybridRF(X, Y, trainIdx, testIdx) {

  const X_hybrid = X.map(v => [...v, formulaAFT(v)]);

  const rf = new RandomForestRegression({
    nEstimators: 150,
    maxDepth: 12,
    minNumSamples: 3,
    seed: 42
  });

  rf.train(trainIdx.map(i => X_hybrid[i]), trainIdx.map(i => Y[i]));

  const preds = rf.predict(testIdx.map(i => X_hybrid[i]));
  const actual = testIdx.map(i => Y[i]);

  return { stats: computeStats(preds, actual), preds, actual };
}


// residual hybrid (BEST approach usually)

function trainResidualHybridRF(X, Y, trainIdx, testIdx) {

  const baseTrain = trainIdx.map(i => formulaAFT(X[i]));
  const baseTest = testIdx.map(i => formulaAFT(X[i]));

  const residualY = trainIdx.map((i, j) => Y[i] - baseTrain[j]);

  const rf = new RandomForestRegression({
    nEstimators: 150,
    maxDepth: 12,
    minNumSamples: 3,
    seed: 42
  });

  rf.train(trainIdx.map(i => X[i]), residualY);

  const residualPred = rf.predict(testIdx.map(i => X[i]));

  const preds = residualPred.map((r, i) => r + baseTest[i]);
  const actual = testIdx.map(i => Y[i]);

  return { stats: computeStats(preds, actual), preds, actual };
}


// ANN

function trainANN(X, Y, trainIdx, testIdx) {

  const net = new brain.NeuralNetwork({
    hiddenLayers: [32, 16]
  });

  const training = trainIdx.map(i => ({
    input: X[i],
    output: [Y[i] / 2000]
  }));

  net.train(training, { iterations: 5000, log: false });

  const preds = testIdx.map(i => net.run(X[i])[0] * 2000);
  const actual = testIdx.map(i => Y[i]);

  return { stats: computeStats(preds, actual), preds, actual };
}


// base formula

function runBaseFormula(X, Y, testIdx) {

  const preds = testIdx.map(i => formulaAFT(X[i]));
  const actual = testIdx.map(i => Y[i]);

  return { stats: computeStats(preds, actual), preds, actual };
}


// LSSVM — pure features

function trainLSSVM(X, Y, trainIdx, testIdx, gamma = 200.0, sigma = 8.0) {
  const model   = new LSSVMRegressorJS(gamma, sigma);
  const X_train = trainIdx.map(i => X[i]);
  const y_train = trainIdx.map(i => Y[i]);
  const X_test  = testIdx.map(i => X[i]);
  const y_test  = testIdx.map(i => Y[i]);

  model.fit(X_train, y_train);

  const rawPreds = model.predict(X_test);
  const preds    = rawPreds.map(p => Math.round(p));

  return { stats: computeStats(preds, y_test), preds, actual: y_test };
}


// Hybrid LSSVM — raw features + base formula appended as extra feature

function trainHybridLSSVM(X, Y, trainIdx, testIdx, gamma = 200.0, sigma = 8.0) {
  const X_hybrid = X.map(v => [...v, formulaAFT(v)]);
  return trainLSSVM(X_hybrid, Y, trainIdx, testIdx, gamma, sigma);
}


// ---------------- MAIN ----------------


async function runAllModels(datasetPath, options = {}) {
  const { onProgress } = options;

  const rows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(datasetPath)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

  if (rows.length === 0) {
    throw new Error("Dataset empty");
  }

  const featureNames = [
    "SiO2", "Al2O3", "Fe2O3", "CaO", "MgO",
    "Na2O", "K2O", "SO3", "TiO2",
    "P2O5", "S"
  ];
  const target = "AFT";

  const X = [];
  const Y = [];
  // Keep the raw row for display purposes (CoalName etc.)
  const metaRows = [];

  for (const r of rows) {

    const rowLower = {};
    for (const k in r) rowLower[k.trim().toLowerCase()] = r[k];

    const v = featureNames.map(f => asFloat(rowLower[f.toLowerCase()]));
    const y = asFloat(rowLower[target.toLowerCase()]);

    if (v.some(a => a === null) || y === null) continue;

    X.push(v);
    Y.push(y);
    metaRows.push(rowLower); // store original row values for the test-set display table
  }

  console.log("runAllModels: valid rows parsed =", X.length);

  if (X.length < 10) {
    throw new Error("Not enough valid rows");
  }

  const idx = seededShuffle([...Array(X.length).keys()], 42);
  const split = Math.floor(idx.length * 0.8);
  const trainIdx = idx.slice(0, split);
  const testIdx = idx.slice(split);
  console.log(`runAllModels: trainIdx=${trainIdx.length} testIdx=${testIdx.length}`);

  // Raw test-set rows only — no predictions attached
  const testSetRows = testIdx.map((origIdx) => ({
    rowIndex: origIdx + 1, // 1-based for display
    coalName: metaRows[origIdx]['coalname'] || metaRows[origIdx]['coal name'] || metaRows[origIdx]['coal_name'] || '',
    SiO2:  Number(X[origIdx][0].toFixed(4)),
    Al2O3: Number(X[origIdx][1].toFixed(4)),
    Fe2O3: Number(X[origIdx][2].toFixed(4)),
    CaO:   Number(X[origIdx][3].toFixed(4)),
    MgO:   Number(X[origIdx][4].toFixed(4)),
    Na2O:  Number(X[origIdx][5].toFixed(4)),
    K2O:   Number(X[origIdx][6].toFixed(4)),
    SO3:   Number(X[origIdx][7].toFixed(4)),
    TiO2:  Number(X[origIdx][8].toFixed(4)),
    actualAFT: Y[origIdx]
  }));

  const results = {};
  const __stageStart = (label) => { console.log(`runAllModels: starting ${label}`); return Date.now(); };
  const __stageEnd = (label, t0) => console.log(`runAllModels: ${label} done (+${Date.now() - t0}ms)`);

  // Pure RF
  try {
    onProgress?.({ event: "rf_start" });
    const __t = __stageStart("Pure RF");
    const { stats } = trainPureRF(X, Y, trainIdx, testIdx);
    results.pureRF = stats;
    onProgress?.({ event: "rf_done" });
    __stageEnd("pure RF", __t);
  } catch (e) {
    console.error("RF error", e);
  }

  // Hybrid RF (formula as extra feature)
  try {
    onProgress?.({ event: "hybrid_rf_start" });
    const __t = __stageStart("Hybrid RF");
    const { stats } = trainHybridRF(X, Y, trainIdx, testIdx);
    results.hybridRF = stats;
    onProgress?.({ event: "hybrid_rf_done" });
    __stageEnd("hybrid RF", __t);
  } catch (e) {
    console.error("Hybrid RF error", e);
  }

  // Residual hybrid RF
  try {
    onProgress?.({ event: "residual_rf_start" });
    const __t = __stageStart("Residual Hybrid RF");
    const { stats } = trainResidualHybridRF(X, Y, trainIdx, testIdx);
    results.residualRF = stats;
    onProgress?.({ event: "residual_rf_done" });
    __stageEnd("residual RF", __t);
  } catch (e) {
    console.error("Residual RF error", e);
  }

  // ANN
  try {
    onProgress?.({ event: "ann_start" });
    const __t = __stageStart("ANN");
    const { stats } = trainANN(X, Y, trainIdx, testIdx);
    results.ann = stats;
    onProgress?.({ event: "ann_done" });
    __stageEnd("ANN", __t);
  } catch (e) {
    console.error("ANN error", e);
  }

  // Base formula
  try {
    onProgress?.({ event: "formula_start" });
    const __t = __stageStart("Base Formula");
    const { stats } = runBaseFormula(X, Y, testIdx);
    results.baseFormula = stats;
    onProgress?.({ event: "formula_done" });
    __stageEnd("Base Formula", __t);
  } catch (e) {
    console.error("Formula error", e);
  }

  // LSSVM (pure features)
  try {
    onProgress?.({ event: "lssvm_start" });
    const __t = __stageStart("LSSVM");
    const { stats } = trainLSSVM(X, Y, trainIdx, testIdx, 200.0, 8.0);
    results.lssvm = stats;
    onProgress?.({ event: "lssvm_done" });
    __stageEnd("LSSVM", __t);
  } catch (e) {
    console.error("LSSVM error", e);
  }

  // Hybrid LSSVM (features + base formula)
  try {
    onProgress?.({ event: "hybrid_lssvm_start" });
    const __t = __stageStart("Hybrid LSSVM");
    const { stats } = trainHybridLSSVM(X, Y, trainIdx, testIdx, 200.0, 8.0);
    results.hybridLSSVM = stats;
    onProgress?.({ event: "hybrid_lssvm_done" });
    __stageEnd("Hybrid LSSVM", __t);
  } catch (e) {
    console.error("Hybrid LSSVM error", e);
  }

  // Attach raw test set and its count for the frontend
  results._testSet = testSetRows;
  results._testSetCount = testSetRows.length;

  return results;
}

module.exports = { runAllModels };
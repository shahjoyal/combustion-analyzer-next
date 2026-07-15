// src/lib/aftEngine.js
//
// This module is a byte-for-byte port of the AFT calculation logic that
// used to live inline in app.js: formulaAFT(), buildFeaturesForModel(),
// applyPreprocessing(), the in-memory `activeModel` loader, and
// calculateAFT(). NONE of the arithmetic/formulas have been changed -
// only wrapped so it can be `import`ed from Next.js route handlers instead
// of living as top-level statements in an Express file.

import fs from 'fs';
import path from 'path';
import { RandomForestRegression } from 'ml-random-forest';
import brain from 'brain.js';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8002';
const ROOT = process.cwd();
const p = (...parts) => path.join(ROOT, ...parts);

// in-memory active model container
// shape: { type: 'pure_rf'|'hybrid_rf'|'ann'|'pure_xgb'|'hybrid_xgb'|'base_formula', model, raw, annScaling }
export let activeModel = { type: 'base_formula', model: null, raw: null, annScaling: null };

// load preprocessing cutoffs saved during training (optional)
export let preprocessing = null;
function loadPreprocessing() {
  try {
    preprocessing = JSON.parse(fs.readFileSync(p('preprocessing.json')));
    if (!Array.isArray(preprocessing.lower) || !Array.isArray(preprocessing.upper)) {
      console.warn('preprocessing.json missing expected lower/upper arrays — ignoring');
      preprocessing = null;
    } else {
      console.log('Loaded preprocessing.json');
    }
  } catch (err) {
    preprocessing = null;
  }
}

export function loadActiveModel() {
  try {
    let active = null;
    if (fs.existsSync(p('active_model.json'))) {
      try {
        active = JSON.parse(fs.readFileSync(p('active_model.json'), 'utf8'));
      } catch (e) {
        console.warn('active_model.json exists but could not be parsed', e && e.message);
      }
    }

    if (!active || !active.type) {
      if (fs.existsSync(p('aft_model.json'))) {
        try {
          const aftJ = JSON.parse(fs.readFileSync(p('aft_model.json'), 'utf8'));
          if (aftJ && aftJ.modelType === 'ann' && aftJ.modelPath) {
            active = { type: 'ann', modelPath: aftJ.modelPath };
          } else {
            active = { type: 'pure_rf' };
          }
        } catch (e) {
          console.warn('Failed parsing aft_model.json fallback:', e && e.message);
          active = { type: 'base_formula' };
        }
      } else {
        active = { type: 'base_formula' };
      }
    }

    activeModel.type = active.type;

    if (activeModel.type === 'pure_rf' || activeModel.type === 'hybrid_rf') {
      if (!fs.existsSync(p('aft_model.json'))) {
        console.warn('aft_model.json not found for RF model load.');
        activeModel.model = null;
        activeModel.raw = null;
        return;
      }
      const aftJSON = JSON.parse(fs.readFileSync(p('aft_model.json'), 'utf8'));
      activeModel.raw = aftJSON;
      activeModel.model = RandomForestRegression.load(aftJSON);
      console.log('Loaded RF model into memory (type):', activeModel.type);
      return;
    }

    if (activeModel.type === 'ann') {
      let annPath = null;
      if (fs.existsSync(p('aft_model.json'))) {
        try {
          const aft = JSON.parse(fs.readFileSync(p('aft_model.json'), 'utf8'));
          if (aft && aft.modelPath) annPath = p(aft.modelPath);
        } catch (e) {
          /* ignore */
        }
      }
      if (!annPath) annPath = p('best_model_ann.json');

      if (!fs.existsSync(annPath)) {
        console.warn('ANN model JSON not found at', annPath);
        activeModel.model = null;
        activeModel.raw = null;
        return;
      }

      const netJson = JSON.parse(fs.readFileSync(annPath, 'utf8'));
      const net = new brain.NeuralNetwork();
      if (typeof net.fromJSON === 'function') net.fromJSON(netJson);
      activeModel.model = net;
      activeModel.raw = netJson;
      try {
        const scalingPath = p('ann_scaling.json');
        if (fs.existsSync(scalingPath)) {
          activeModel.annScaling = JSON.parse(fs.readFileSync(scalingPath, 'utf8'));
          console.log('Loaded ANN scaling info (ann_scaling.json)');
        } else {
          activeModel.annScaling = null;
        }
      } catch (e) {
        activeModel.annScaling = null;
      }

      console.log('Loaded ANN model into memory from', annPath);
      return;
    }

    if (activeModel.type === 'pure_xgb' || activeModel.type === 'hybrid_xgb') {
      activeModel.model = null;
      activeModel.raw = null;
      activeModel.annScaling = null;
      return;
    }

    if (activeModel.type === 'base_formula') {
      activeModel.model = null;
      activeModel.raw = null;
      activeModel.annScaling = null;
      console.log('Active model set to base_formula (no ML model loaded).');
      return;
    }

    console.warn('Unrecognized active model type:', activeModel.type);
  } catch (err) {
    console.warn('loadActiveModel error (files may be missing):', err && err.message ? err.message : err);
  }
}

// Base empirical AFT formula (piecewise, driven by SiO2+Al2O3 ratio).
export function formulaAFT(values) {
  const [SiO2, Al2O3, Fe2O3, CaO, MgO, Na2O, K2O, SO3, TiO2] = values;
  const sumSiAl = SiO2 + Al2O3;

  if (sumSiAl < 55) {
    return (
      1245 +
      1.1 * SiO2 +
      0.95 * Al2O3 -
      2.5 * Fe2O3 -
      2.98 * CaO -
      4.5 * MgO -
      7.89 * (Na2O + K2O) -
      1.7 * SO3 -
      0.63 * TiO2
    );
  } else if (sumSiAl < 75) {
    return (
      1323 +
      1.45 * SiO2 +
      0.683 * Al2O3 -
      2.39 * Fe2O3 -
      3.1 * CaO -
      4.5 * MgO -
      7.49 * (Na2O + K2O) -
      2.1 * SO3 -
      0.63 * TiO2
    );
  } else {
    return (
      1395 +
      1.2 * SiO2 +
      0.9 * Al2O3 -
      2.5 * Fe2O3 -
      3.1 * CaO -
      4.5 * MgO -
      7.2 * (Na2O + K2O) -
      1.7 * SO3 -
      0.63 * TiO2
    );
  }
}

// Build the SAME feature vector used in training:
// [SiO2,Al2O3,Fe2O3,CaO,MgO,Na2O,K2O,SO3,TiO2,P2O5,S] (+ base formula for hybrid models)
export function buildFeaturesForModel(values) {
  if (!Array.isArray(values)) return [];

  let arr = values.map((v) => Number(v ?? 0));

  while (arr.length < 9) arr.push(0);
  while (arr.length < 11) arr.push(0);

  if (activeModel.type === 'hybrid_rf' || activeModel.type === 'hybrid_xgb') {
    const base = formulaAFT(arr.slice(0, 9));
    return [...arr.slice(0, 11), base];
  }

  return arr.slice(0, 11);
}

// Apply 1%/99% winsorization cutoffs saved during training.
export function applyPreprocessing(features) {
  if (!Array.isArray(features)) return [];
  if (!preprocessing || !Array.isArray(preprocessing.lower)) {
    return features.slice();
  }

  const out = features.slice();
  for (let i = 0; i < out.length; i++) {
    const lo = preprocessing.lower[i];
    const hi = preprocessing.upper[i];
    if (typeof lo === 'number' && out[i] < lo) out[i] = lo;
    if (typeof hi === 'number' && out[i] > hi) out[i] = hi;
  }
  return out;
}

export async function calculateAFT(values) {
  try {
    const features = buildFeaturesForModel(values);
    const prepped = applyPreprocessing(features);

    if (!activeModel || !activeModel.type) {
      return Math.round(formulaAFT(values));
    }

    // RF MODELS
    if (activeModel.type === 'pure_rf' || activeModel.type === 'hybrid_rf') {
      if (!activeModel.model || typeof activeModel.model.predict !== 'function') {
        console.warn('RF model not loaded — fallback formula.');
        return Math.round(formulaAFT(values));
      }
      try {
        const pred = activeModel.model.predict([prepped])[0];
        return Math.round(Math.max(1000, Math.min(1600, pred)));
      } catch (err) {
        console.warn('RF feature mismatch, retrying with padding');
        const expected = activeModel.model.n_features || prepped.length;
        let aligned = prepped.slice(0, expected);
        while (aligned.length < expected) aligned.push(0);
        const pred = activeModel.model.predict([aligned])[0];
        return Math.round(Math.max(1000, Math.min(1600, pred)));
      }
    }

    // ANN
    if (activeModel.type === 'ann') {
      if (!activeModel.model || typeof activeModel.model.run !== 'function') {
        return Math.round(formulaAFT(values));
      }
      const out = activeModel.model.run(prepped);
      const raw = Array.isArray(out) ? out[0] : out;
      return Math.round(Math.max(1000, Math.min(1600, raw)));
    }

    // XGBOOST (delegates to the separate Python ml-service)
    if (activeModel.type === 'pure_xgb' || activeModel.type === 'hybrid_xgb') {
      try {
        const response = await fetch(`${ML_SERVICE_URL}/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ values, model: activeModel.type }),
        });

        if (!response.ok) {
          const txt = await response.text();
          console.warn('Python predict failed:', txt);
          return Math.round(formulaAFT(values));
        }

        const json = await response.json();
        return json.prediction;
      } catch (err) {
        console.warn('XGB prediction error:', err.message);
        return Math.round(formulaAFT(values));
      }
    }

    return Math.round(formulaAFT(values));
  } catch (err) {
    console.warn('calculateAFT error:', err.message);
    return Math.round(formulaAFT(values));
  }
}

// call loader at module init (mirrors `loadActiveModel();` at the bottom of
// the old app.js top section)
loadPreprocessing();
loadActiveModel();

export { ML_SERVICE_URL };

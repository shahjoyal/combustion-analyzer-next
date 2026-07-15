

/* -------- Navigation & Logout -------- */
document.querySelectorAll('[data-target]').forEach(btn => {
  btn.addEventListener('click', () => { window.location.href = btn.dataset.target; });
});
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.setItem('isLoggedIn', 'false');
  window.location.href = 'login.html';
});

const csvInput = document.getElementById('csvFile');
const fileText = document.getElementById('fileNameText');
csvInput.addEventListener('change', function () {
  fileText.textContent = this.files.length ? 'Selected: ' + this.files[0].name : 'No file selected';
});

/* -------- Model list -------- */
// CHANGED: added residualRF, lssvm, hybridLSSVM
const ALL_MODELS = [
  { key: 'pureRF',      name: 'Pure RF' },
  { key: 'hybridRF',    name: 'Hybrid RF' },
  { key: 'residualRF',  name: 'Residual Hybrid RF' },
  { key: 'baseFormula', name: 'Base Formula' },
  { key: 'ann',         name: 'ANN' },
  { key: 'lssvm',       name: 'LSSVM' },
  { key: 'hybridLSSVM', name: 'Hybrid LSSVM' },
  { key: 'pure_xgb',    name: 'Pure XGBoost' },
  { key: 'hybrid_xgb',  name: 'Hybrid XGBoost' }
];

const DISPLAY_TO_KEY = {
  'Pure RF': 'pureRF',
  'Hybrid RF': 'hybridRF',
  'Residual Hybrid RF': 'residualRF',
  'Base Formula': 'baseFormula',
  'ANN': 'ann',
  'LSSVM': 'lssvm',
  'Hybrid LSSVM': 'hybridLSSVM',
  'Pure XGBoost': 'pure_xgb',
  'Hybrid XGBoost': 'hybrid_xgb'
};

const API_TO_KEY = {
  'pure_rf': 'pureRF',
  'hybrid_rf': 'hybridRF',
  'residual_rf': 'residualRF',
  'base_formula': 'baseFormula',
  'ann': 'ann',
  'lssvm': 'lssvm',
  'hybrid_lssvm': 'hybridLSSVM',
  'pure_xgb': 'pure_xgb',
  'hybrid_xgb': 'hybrid_xgb'
};

const API_TO_DISPLAY = {
  'pure_rf': 'Pure RF',
  'hybrid_rf': 'Hybrid RF',
  'residual_rf': 'Residual Hybrid RF',
  'base_formula': 'Base Formula',
  'ann': 'ANN',
  'lssvm': 'LSSVM',
  'hybrid_lssvm': 'Hybrid LSSVM',
  'pure_xgb': 'Pure XGBoost',
  'hybrid_xgb': 'Hybrid XGBoost'
};

const TEST_MODEL_LABELS = {
  pureRF: 'Pure RF',
  hybridRF: 'Hybrid RF',
  residualRF: 'Residual RF',
  ann: 'ANN',
  baseFormula: 'Base Formula',
  lssvm: 'LSSVM',
  hybridLSSVM: 'Hybrid LSSVM',
  pure_xgb: 'XGB Pure',
  hybrid_xgb: 'XGB Hybrid'
};

const TEST_MODEL_CSV_PREFIX = {
  pureRF: 'PureRF',
  hybridRF: 'HybridRF',
  residualRF: 'ResidualRF',
  ann: 'ANN',
  baseFormula: 'BaseFormula',
  lssvm: 'LSSVM',
  hybridLSSVM: 'HybridLSSVM',
  pure_xgb: 'XGB_Pure',
  hybrid_xgb: 'XGB_Hybrid'
};

const CSV_PREFIX_TO_MODEL = Object.entries(TEST_MODEL_CSV_PREFIX).reduce((acc, [key, prefix]) => {
  acc[prefix] = key;
  return acc;
}, {});

const SERVER_ENDPOINTS = {
  getComparisonState: './api/get-comparison-state',
  saveComparisonState: './api/save-comparison-state',
  getTestDataset: './api/get-test-dataset',
  saveTestDataset: './api/save-test-dataset'
};

let currentActiveModelKey = '';
let currentActiveModelName = '';

function setComparisonEmptyState(show) {
  const el = document.getElementById('comparisonResultsEmpty');
  if (el) el.style.display = show ? 'block' : 'none';
}

function updateComparisonCacheNote(text) {
  const el = document.getElementById('comparisonCacheNote');
  if (el) el.textContent = text;
}

function refreshActiveHighlight() {
  const rows = document.querySelectorAll('#result tr[data-model-key]');
  rows.forEach(row => {
    const isActive = currentActiveModelKey && row.dataset.modelKey === currentActiveModelKey;
    row.classList.toggle('current-active-row', isActive);
    const pill = row.querySelector('.status-pill');
    if (pill) {
      pill.className = 'status-pill ' + (isActive ? 'active' : 'inactive');
      pill.textContent = isActive ? 'Current Active Model' : 'Inactive';
    }
  });
}

function renderActiveModelBox() {
  const nameEl  = document.getElementById('activeModelName');
  const badgeEl = document.getElementById('activeModelBadge');
  nameEl.textContent = currentActiveModelName || 'Unknown';
  badgeEl.className = currentActiveModelKey ? 'badge success' : 'badge error';
  badgeEl.textContent = currentActiveModelKey ? 'active' : 'error';
  refreshActiveHighlight();
}

async function fetchJsonMaybe(url, options = {}) {
  const res = await fetch(url, options);
  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  if (contentType.includes('application/json')) {
    const data = await res.json();
    return { ok: res.ok, data, response: res };
  }
  const text = await res.text();
  return { ok: res.ok, text, response: res };
}

function normalizeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function csvEscape(value) {
  const s = value === undefined || value === null ? '' : String(value);
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function serializeTestSetToCsv(rows, modelCols) {
  if (!rows || !rows.length) return '';

  const showCoalName = !!rows[0].coalName;
  const cols = (modelCols && modelCols.length)
    ? modelCols
    : [...new Set(rows.flatMap(r => Object.keys(r.predictions || {})))];

  const header = ['#'];
  if (showCoalName) header.push('CoalName');
  header.push('SiO2', 'Al2O3', 'Fe2O3', 'CaO', 'MgO', 'Na2O', 'K2O', 'SO3', 'TiO2', 'ActualAFT');

  cols.forEach(c => {
    const prefix = TEST_MODEL_CSV_PREFIX[c] || c;
    header.push(`${prefix}_Pred`, `${prefix}_AbsErr`);
  });

  let csv = header.map(csvEscape).join(',') + '\n';

  rows.forEach((row, idx) => {
    const line = [];
    line.push(row.rowIndex !== undefined ? row.rowIndex : idx + 1);
    if (showCoalName) line.push(row.coalName ?? '');
    line.push(row.SiO2 ?? '', row.Al2O3 ?? '', row.Fe2O3 ?? '', row.CaO ?? '', row.MgO ?? '',
              row.Na2O ?? '', row.K2O ?? '', row.SO3 ?? '', row.TiO2 ?? '', row.actualAFT ?? '');

    cols.forEach(c => {
      const pred = row.predictions ? row.predictions[c] : undefined;
      if (pred !== undefined && pred !== null && row.actualAFT !== undefined && row.actualAFT !== null) {
        const p = Number(pred);
        const a = Number(row.actualAFT);
        line.push(Number.isFinite(p) ? p.toFixed(2) : '', Number.isFinite(p) && Number.isFinite(a) ? Math.abs(p - a).toFixed(2) : '');
      } else {
        line.push('', '');
      }
    });

    csv += line.map(csvEscape).join(',') + '\n';
  });

  return csv;
}

function rehydrateTestRowsFromCsv(csvText) {
  if (!csvText || !csvText.trim()) return [];

  const wb = XLSX.read(csvText, { type: 'string' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
  if (!rows.length) return [];

  return rows.map((r, idx) => {
    const row = {
      rowIndex: normalizeNumber(r['#']) ?? (idx + 1),
      predictions: {}
    };

    if (r.CoalName !== undefined && r.CoalName !== '') row.coalName = r.CoalName;

    ['SiO2','Al2O3','Fe2O3','CaO','MgO','Na2O','K2O','SO3','TiO2'].forEach(k => {
      if (r[k] !== undefined && r[k] !== '') row[k] = r[k];
    });

    row.actualAFT = normalizeNumber(r.ActualAFT) ?? r.ActualAFT;

    Object.keys(r).forEach(key => {
      const predMatch = key.match(/^(.*)_Pred$/);
      if (!predMatch) return;
      const prefix = predMatch[1];
      const modelKey = CSV_PREFIX_TO_MODEL[prefix];
      if (!modelKey) return;
      const pred = normalizeNumber(r[key]);
      if (pred !== null) row.predictions[modelKey] = pred;
    });

    return row;
  });
}

function normalizeServerTestSet(payload) {
  if (!payload) return [];
  if (Array.isArray(payload.rows) && payload.rows.length) {
    if (payload.rows[0] && payload.rows[0].predictions) return payload.rows;
  }
  if (Array.isArray(payload.testSet) && payload.testSet.length) {
    if (payload.testSet[0] && payload.testSet[0].predictions) return payload.testSet;
  }

  const csvText =
    (typeof payload.csv === 'string' && payload.csv) ||
    (typeof payload.text === 'string' && payload.text) ||
    (typeof payload.content === 'string' && payload.content) ||
    '';

  if (csvText) return rehydrateTestRowsFromCsv(csvText);
  return [];
}

async function saveComparisonStateToServer(payload) {
  try {
    await fetch(SERVER_ENDPOINTS.saveComparisonState, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.warn('Failed to save comparison state on server:', e);
  }
}

async function saveTestDatasetToServer(testSet, modelCols) {
  try {
    const csv = serializeTestSetToCsv(testSet, modelCols);
    await fetch(SERVER_ENDPOINTS.saveTestDataset, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: 'test.csv',
        csv,
        rows: testSet,
        modelCols: modelCols || []
      })
    });
  } catch (e) {
    console.warn('Failed to save test dataset on server:', e);
  }
}

async function loadComparisonStateFromServer() {
  try {
    const res = await fetch(SERVER_ENDPOINTS.getComparisonState);
    const json = await res.json();

    if (!json) return null;

    if (json.success && json.data && json.data.results) {
      return json.data;
    }

    if (json.success && json.results) {
      return json;
    }

    if (json.data && json.data.results) {
      return json.data;
    }

    if (json.results) {
      return json;
    }

    console.warn('Unexpected comparison format:', json);
    return null;
  } catch (e) {
    console.error('Failed loading comparison:', e);
    return null;
  }
}

async function loadTestDatasetFromServer() {
  try {
    const result = await fetchJsonMaybe(SERVER_ENDPOINTS.getTestDataset);
    if (!result.ok) return null;

    if (result.data && typeof result.data === 'object') {
      if (result.data.success === false) return null;
      return result.data;
    }

    if (typeof result.text === 'string' && result.text.trim()) {
      return { success: true, csv: result.text };
    }

    return null;
  } catch (e) {
    return null;
  }
}

function renderComparisonResultsFromApi(resultsObj, activeModelName) {
  const resultContainer = document.getElementById('result');
  const testSetSection = document.getElementById('testSetSection');
  const models = [];

  if (resultsObj.pureRF)                              models.push({ name: 'Pure RF',             data: resultsObj.pureRF });
  if (resultsObj.hybridRF)                            models.push({ name: 'Hybrid RF',           data: resultsObj.hybridRF });
  if (resultsObj.residualRF)                          models.push({ name: 'Residual Hybrid RF',  data: resultsObj.residualRF });
  if (resultsObj.baseFormula)                         models.push({ name: 'Base Formula',        data: resultsObj.baseFormula });
  if (resultsObj.ann || resultsObj.ANN)               models.push({ name: 'ANN',                 data: resultsObj.ann || resultsObj.ANN });
  if (resultsObj.lssvm)                               models.push({ name: 'LSSVM',               data: resultsObj.lssvm });
  if (resultsObj.hybridLSSVM)                         models.push({ name: 'Hybrid LSSVM',        data: resultsObj.hybridLSSVM });
  if (resultsObj.pure_xgb && resultsObj.pure_xgb.stats)   models.push({ name: 'Pure XGBoost',    data: resultsObj.pure_xgb.stats });
  if (resultsObj.hybrid_xgb && resultsObj.hybrid_xgb.stats) models.push({ name: 'Hybrid XGBoost',  data: resultsObj.hybrid_xgb.stats });

  if (!models.length) {
    resultContainer.innerHTML = '';
    setComparisonEmptyState(true);
    return;
  }

  setComparisonEmptyState(false);

  let best = models[0];
  models.forEach(m => {
    if (m.data && best.data && Number(m.data.avgAbs) < Number(best.data.avgAbs)) best = m;
  });

  let table = `
    <div class="comparison-results-wrap">
      <table>
        <tr>
          <th>Model</th>
          <th>Status</th>
          <th>Rows</th>
          <th>MAE</th>
          <th>Max Error</th>
          <th>Min Error</th>
          <th>&gt;20</th>
          <th>&gt;40</th>
          <th>&gt;60</th>
        </tr>`;

  models.forEach(m => {
    const modelKey = DISPLAY_TO_KEY[m.name] || '';
    const isActive = modelKey && currentActiveModelKey && modelKey === currentActiveModelKey;
    const cls = [
      m.name === best.name ? 'best' : '',
      isActive ? 'current-active-row' : ''
    ].filter(Boolean).join(' ');

    table += `<tr class="${cls}" data-model-key="${modelKey}">
      <td>${m.name}</td>
      <td><span class="status-pill ${isActive ? 'active' : 'inactive'}">${isActive ? 'Current Active Model' : 'Inactive'}</span></td>
      <td>${m.data.rows}</td>
      <td>${m.data.avgAbs}</td>
      <td>${m.data.maxError}</td>
      <td>${m.data.minError}</td>
      <td>${m.data.gt20}</td>
      <td>${m.data.gt40}</td>
      <td>${m.data.gt60}</td>
    </tr>`;
  });

  table += `</table></div>
  <div class="activate-panel">
    <h3>Activate Model</h3>
    <select id="activateModelSelect" style="padding:8px 12px; border-radius:8px; border:1px solid #ccc; min-width:220px;">
      <option value="">Select Model</option>
      <option value="pure_rf">Pure RF (Production)</option>
      <option value="hybrid_rf">Hybrid RF (Formula + RF)</option>
      <option value="base_formula">Base Formula</option>
      <option value="ann">ANN</option>
      <option value="lssvm">LSSVM</option>
      <option value="hybrid_lssvm">Hybrid LSSVM</option>
      <option value="pure_xgb">Pure XGBoost (pure_xgb)</option>
      <option value="hybrid_xgb">Hybrid XGBoost (hybrid_xgb)</option>
    </select>
    <button id="activateBtn" style="margin-left:15px;">Activate Now</button>
    <div id="activateLoader" style="margin-top:10px; display:none; font-size:14px; color:#555;">Activating model...</div>
  </div>`;

  resultContainer.innerHTML = table;
  document.getElementById('activateBtn').addEventListener('click', activateSelectedModel);

  if (testSetSection) {
    testSetSection.style.display = (_allTestRows && _allTestRows.length) ? 'block' : 'none';
  }

  refreshActiveHighlight();
  updateComparisonCacheNote(activeModelName ? `Last synced with ${activeModelName}` : 'Comparison loaded.');
}

function restoreComparisonResultsFromServer() {
  return loadComparisonStateFromServer().then(cached => {
    if (!cached || !cached.results) {
      setComparisonEmptyState(true);
      updateComparisonCacheNote('No server comparison saved yet.');
      return;
    }
    renderActiveModelBox();
    renderComparisonResultsFromApi(cached.results, cached.activeModelName || '');
    updateComparisonCacheNote('Showing server-stored comparison results.');
  }).catch(() => {
    setComparisonEmptyState(true);
    updateComparisonCacheNote('No server comparison saved yet.');
  });
}

/* -------- Template downloads -------- */
document.getElementById('downloadCSVTemplateBtn').addEventListener('click', () => {
  const header = "CoalName,SiO2,Al2O3,Fe2O3,CaO,MgO,Na2O,K2O,SO3,TiO2,P2O5,S,AFT\n";
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([header], { type: 'text/csv;charset=utf-8;' }));
  link.download = 'aft_template.csv';
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
});
document.getElementById('downloadExcelTemplateBtn').addEventListener('click', () => {
  const data = [['CoalName','SiO2','Al2O3','Fe2O3','CaO','MgO','Na2O','K2O','SO3','TiO2','P2O5','S','AFT']];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  XLSX.writeFile(wb, 'aft_template.xlsx');
});

/* -------- Progress card helpers -------- */
const modelState = {};

function createModelCard(model) {
  const container = document.createElement('div');
  container.className = 'model-card';
  container.id = 'card-' + model.key;
  container.innerHTML = `
    <div class="model-left">
      <canvas id="chart-${model.key}" width="86" height="86" style="max-width:86px;"></canvas>
    </div>
    <div class="model-meta">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div class="model-title">${model.name}</div>
          <div id="status-${model.key}" class="model-status">Waiting</div>
        </div>
        <div id="badge-${model.key}" class="badge idle">idle</div>
      </div>
      <div class="progress-bar-wrap">
        <div class="progress-bar">
          <div id="inner-${model.key}" class="progress-inner" style="width:0%"></div>
        </div>
        <div class="progress-percent" id="pct-${model.key}">0%</div>
      </div>
    </div>`;
  return container;
}

function initDonutChart(modelKey) {
  const ctx = document.getElementById('chart-' + modelKey).getContext('2d');
  return new Chart(ctx, {
    type: 'doughnut',
    data: { datasets: [{ data: [0, 100], backgroundColor: ['#02126e', '#f1f4ff'], borderWidth: 0 }] },
    options: {
      cutout: '72%', responsive: false, animation: { duration: 300 },
      plugins: { legend: { display: false }, tooltip: { enabled: false } }
    }
  });
}

function startProgressSimulation() {
  document.getElementById('progressArea').style.display = 'grid';
  ALL_MODELS.forEach(m => {
    if (modelState[m.key]) return;
    const card = createModelCard(m);
    document.getElementById('progressArea').appendChild(card);
    const chart = initDonutChart(m.key);
    modelState[m.key] = {
      percent: 0, interval: null, chart,
      refs: {
        inner:  document.getElementById('inner-'  + m.key),
        pct:    document.getElementById('pct-'    + m.key),
        status: document.getElementById('status-' + m.key),
        badge:  document.getElementById('badge-'  + m.key)
      }
    };
    const step = () => {
      const s = modelState[m.key]; if (!s) return;
      const cap = 88 + Math.floor(Math.random() * 7);
      const inc = 1  + Math.floor(Math.random() * 6);
      s.percent = Math.min(s.percent + inc, cap);
      s.refs.inner.style.width = s.percent + '%';
      s.refs.pct.textContent   = s.percent + '%';
      s.chart.data.datasets[0].data[0] = s.percent;
      s.chart.data.datasets[0].data[1] = 100 - s.percent;
      s.chart.update();
      s.refs.status.textContent = s.percent < 40 ? 'Initializing' : (s.percent < 80 ? 'Running' : 'Finalizing');
      s.refs.badge.className = 'badge ' + (s.percent < 40 ? 'loading' : 'running');
      s.refs.badge.textContent = s.refs.status.textContent.toLowerCase();
    };
    step();
    modelState[m.key].interval = setInterval(step, 450 + Math.floor(Math.random() * 400));
  });
}

function stopSimulationAndMark(resultsMap) {
  ALL_MODELS.forEach(m => {
    const s = modelState[m.key]; if (!s) return;
    clearInterval(s.interval);
    if (resultsMap && resultsMap[m.key]) {
      s.percent = 100;
      s.refs.inner.style.width = '100%'; s.refs.pct.textContent = '100%';
      s.chart.data.datasets[0].data = [100, 0]; s.chart.update();
      s.refs.status.textContent = 'Completed';
      s.refs.badge.className = 'badge success'; s.refs.badge.textContent = 'completed';
    } else {
      s.refs.status.textContent = 'Not executed';
      s.refs.badge.className = 'badge idle'; s.refs.badge.textContent = 'idle';
      s.refs.inner.style.background = 'linear-gradient(90deg,#9aa3bf,#c5cbe0)';
      s.refs.pct.textContent = s.percent > 0 ? s.percent + '%' : '0%';
      s.chart.data.datasets[0].backgroundColor = ['#9aa3bf', '#eef1f6']; s.chart.update();
    }
  });
}

/* -------- Active model fetch -------- */
async function fetchActiveModel() {
  const nameEl  = document.getElementById('activeModelName');
  const badgeEl = document.getElementById('activeModelBadge');
  try {
    badgeEl.className = 'badge loading'; badgeEl.textContent = 'loading';
    const res  = await fetch('./api/get-active-model');
    const data = await res.json();
    if (!data.success) throw new Error('API failed');

    const apiKey = String(data.model || '').toLowerCase().trim();
    currentActiveModelKey = API_TO_KEY[apiKey] || '';
    currentActiveModelName = API_TO_DISPLAY[apiKey] || data.model || 'Unknown';

    nameEl.textContent  = currentActiveModelName;
    badgeEl.className   = 'badge success'; badgeEl.textContent = 'active';
    renderActiveModelBox();
    refreshActiveHighlight();
  } catch (err) {
    currentActiveModelKey = '';
    currentActiveModelName = 'Unable to fetch';
    nameEl.textContent  = currentActiveModelName;
    badgeEl.className   = 'badge error'; badgeEl.textContent = 'error';
    refreshActiveHighlight();
  }
}

/* -------- Training dataset table state -------- */
let _allTrainingRows = [];
let _trainingHeaders = [];

function renderTrainingSetTable(rows) {
  const thead = document.getElementById('trainingSetHead');
  const tbody = document.getElementById('trainingSetBody');
  const table = document.getElementById('trainingSetTable');
  const empty = document.getElementById('trainingSetEmpty');

  if (!rows || !rows.length) {
    table.style.display = 'none';
    empty.style.display = 'block';
    return;
  }
  table.style.display = 'table';
  empty.style.display = 'none';

  let headHTML = '<tr><th>#</th>';
  _trainingHeaders.forEach(h => { headHTML += `<th>${h}</th>`; });
  headHTML += '</tr>';
  thead.innerHTML = headHTML;

  let bodyHTML = '';
  rows.forEach((row, idx) => {
    bodyHTML += `<tr><td>${row._rowNum !== undefined ? row._rowNum : idx + 1}</td>`;
    _trainingHeaders.forEach(h => {
      bodyHTML += `<td>${row[h] !== undefined && row[h] !== null ? row[h] : '—'}</td>`;
    });
    bodyHTML += '</tr>';
  });
  tbody.innerHTML = bodyHTML;
}

function filterTrainingSet() {
  const q = document.getElementById('trainingSetSearch').value.trim().toLowerCase();
  if (!q) { renderTrainingSetTable(_allTrainingRows); return; }
  const filtered = _allTrainingRows.filter(row => {
    return _trainingHeaders.some(h => String(row[h] !== undefined ? row[h] : '').toLowerCase().includes(q));
  });
  renderTrainingSetTable(filtered);
}

async function fetchTrainingDataset() {
  const countEl = document.getElementById('trainingSetCount');
  try {
    const res = await fetch('./api/get-training-dataset');
    if (!res.ok) throw new Error('Not found');
    const data = await res.json();

    if (!data.success || !data.rows || !data.rows.length) {
      _allTrainingRows = [];
      _trainingHeaders = [];
      renderTrainingSetTable([]);
      countEl.textContent = '';
      return;
    }

    _trainingHeaders = data.headers || Object.keys(data.rows[0]).filter(k => k !== '_rowNum');
    _allTrainingRows = data.rows;
    countEl.textContent = `(${data.rows.length} rows)`;
    renderTrainingSetTable(_allTrainingRows);
  } catch (err) {
    try {
      const res2 = await fetch('./api/last-training-upload');
      if (!res2.ok) throw new Error('No CSV endpoint');
      const csvText = await res2.text();
      const lines = csvText.trim().split('\n').filter(Boolean);
      if (lines.length < 2) { renderTrainingSetTable([]); countEl.textContent = ''; return; }
      _trainingHeaders = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      _allTrainingRows = lines.slice(1).map((line, i) => {
        const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row = { _rowNum: i + 1 };
        _trainingHeaders.forEach((h, j) => { row[h] = vals[j] !== undefined ? vals[j] : ''; });
        return row;
      });
      countEl.textContent = `(${_allTrainingRows.length} rows)`;
      renderTrainingSetTable(_allTrainingRows);
    } catch (e2) {
      _allTrainingRows = [];
      _trainingHeaders = [];
      renderTrainingSetTable([]);
      countEl.textContent = '';
    }
  }
}

document.getElementById('exportTrainingSetBtn').addEventListener('click', () => {
  if (!_allTrainingRows.length) { alert('No training data to export.'); return; }
  let csv = '#,' + _trainingHeaders.join(',') + '\n';
  _allTrainingRows.forEach((row, i) => {
    const rowNum = row._rowNum !== undefined ? row._rowNum : i + 1;
    csv += rowNum + ',' + _trainingHeaders.map(h => `"${row[h] !== undefined ? row[h] : ''}"`).join(',') + '\n';
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  link.download = 'training_dataset.csv';
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
});

document.getElementById('refreshDatasetBtn').addEventListener('click', fetchTrainingDataset);

/* -------- Test-set table state -------- */
let _allTestRows = [];
let _modelCols   = [];

function errClass(err) {
  if (err <= 20) return 'err-ok';
  if (err <= 40) return 'err-warn';
  return 'err-bad';
}

function renderTestSetTable(rows) {
  const thead = document.getElementById('testSetHead');
  const tbody = document.getElementById('testSetBody');

  let headHTML = '<tr>'
    + '<th>#</th>'
    + ((_allTestRows[0] && _allTestRows[0].coalName) ? '<th>Coal Name</th>' : '')
    + '<th>SiO2</th><th>Al2O3</th><th>Fe2O3</th><th>CaO</th><th>MgO</th>'
    + '<th>Na2O</th><th>K2O</th><th>SO3</th><th>TiO2</th>'
    + '<th>Actual AFT</th>';

  _modelCols.forEach(col => {
    const label = TEST_MODEL_LABELS[col] || col;
    headHTML += `<th>${label} Pred</th><th>${label} |Err|</th>`;
  });
  headHTML += '</tr>';
  thead.innerHTML = headHTML;

  const showCoalName = _allTestRows[0] && _allTestRows[0].coalName;
  let bodyHTML = '';
  rows.forEach((row) => {
    bodyHTML += `<tr><td>${row.rowIndex}</td>`;
    if (showCoalName) bodyHTML += `<td style="text-align:left;max-width:140px;overflow:hidden;text-overflow:ellipsis;" title="${row.coalName}">${row.coalName || '—'}</td>`;
    bodyHTML += `
      <td>${row.SiO2}</td><td>${row.Al2O3}</td><td>${row.Fe2O3}</td>
      <td>${row.CaO}</td><td>${row.MgO}</td><td>${row.Na2O}</td>
      <td>${row.K2O}</td><td>${row.SO3}</td><td>${row.TiO2}</td>
      <td><strong>${row.actualAFT}</strong></td>`;
    _modelCols.forEach(col => {
      const pred = row.predictions[col];
      if (pred !== undefined && pred !== null) {
        const err = Math.abs(pred - row.actualAFT).toFixed(2);
        bodyHTML += `<td>${Number(pred).toFixed(2)}</td><td class="${errClass(parseFloat(err))}">${err}</td>`;
      } else {
        bodyHTML += `<td>—</td><td>—</td>`;
      }
    });
    bodyHTML += '</tr>';
  });
  tbody.innerHTML = bodyHTML;
}

function filterTestSet() {
  const q = document.getElementById('testSetSearch').value.trim().toLowerCase();
  if (!q) { renderTestSetTable(_allTestRows); return; }
  const filtered = _allTestRows.filter(row => {
    if (row.coalName && row.coalName.toLowerCase().includes(q)) return true;
    if (String(row.actualAFT).includes(q)) return true;
    if (String(row.rowIndex).includes(q)) return true;
    return false;
  });
  renderTestSetTable(filtered);
}

function showTestSet(testSet) {
  if (!testSet || !testSet.length) return;
  _allTestRows = testSet;
  const colSet = new Set();
  testSet.forEach(r => Object.keys(r.predictions || {}).forEach(k => colSet.add(k)));
  _modelCols = [...colSet];
  document.getElementById('testSetCount').textContent = `(${testSet.length} rows — 20 % of uploaded data)`;
  document.getElementById('testSetSection').style.display = 'block';
  renderTestSetTable(_allTestRows);
}

document.getElementById('exportTestSetBtn').addEventListener('click', () => {
  if (!_allTestRows.length) return;
  const showCoalName = !!(_allTestRows[0] && _allTestRows[0].coalName);

  let header = '#,' + (showCoalName ? 'CoalName,' : '')
    + 'SiO2,Al2O3,Fe2O3,CaO,MgO,Na2O,K2O,SO3,TiO2,ActualAFT';
  _modelCols.forEach(c => {
    header += `,${(TEST_MODEL_CSV_PREFIX[c] || c)}_Pred,${(TEST_MODEL_CSV_PREFIX[c] || c)}_AbsErr`;
  });
  let csv = header + '\n';
  _allTestRows.forEach(row => {
    let line = `${row.rowIndex},` + (showCoalName ? `"${row.coalName}",` : '')
      + `${row.SiO2},${row.Al2O3},${row.Fe2O3},${row.CaO},${row.MgO},`
      + `${row.Na2O},${row.K2O},${row.SO3},${row.TiO2},${row.actualAFT}`;
    _modelCols.forEach(c => {
      const pred = row.predictions[c];
      if (pred !== undefined && pred !== null) {
        const err = Math.abs(pred - row.actualAFT).toFixed(2);
        line += `,${Number(pred).toFixed(2)},${err}`;
      } else { line += `,—,—`; }
    });
    csv += line + '\n';
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  link.download = 'test_set_predictions.csv';
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
});

/* -------- Main run handler -------- */
document.getElementById('runBtn').addEventListener('click', runComparison);

// Polls GET /api/compare-models/status/:jobId until the background training
// job finishes, then returns the same { success, results, trainingPath,
// testSet, progressLog } shape the old synchronous endpoint used to return
// directly - so everything below in runComparison() stays unchanged.
async function pollCompareModelsJob(jobId, { intervalMs = 3000, maxWaitMs = 15 * 60 * 1000 } = {}) {
  const start = Date.now();
  while (true) {
    const res = await fetch(`./api/compare-models/status/${jobId}`);
    const json = await res.json();

    if (json.status === 'done') return json.data;
    if (json.status === 'error') throw new Error(json.message || 'Model comparison failed');
    if (json.status === 'not_found') throw new Error('Model comparison job not found (server may have restarted)');

    if (Date.now() - start > maxWaitMs) {
      throw new Error('Timed out waiting for model comparison to finish');
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }
}

async function runComparison() {
  const fileInput = document.getElementById('csvFile');
  if (!fileInput.files.length) { alert('Please upload CSV file or Excel file'); return; }

  document.getElementById('result').innerHTML = '';
  setComparisonEmptyState(true);
  document.getElementById('testSetSection').style.display = 'none';
  document.getElementById('testSetSearch').value = '';
  _allTestRows = [];
  _modelCols = [];

  const progressArea = document.getElementById('progressArea');
  progressArea.innerHTML = '';
  progressArea.style.display = 'none';
  document.getElementById('loader').style.display = 'inline-block';

  startProgressSimulation();

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);
  const trainMode = document.querySelector('input[name="trainMode"]:checked').value;
  formData.append('trainMode', trainMode);

  let data;
  try {
    const startRes = await fetch('./api/compare-models', { method: 'POST', body: formData });
    const startJson = await startRes.json();
    if (!startJson || !startJson.success || !startJson.jobId) {
      throw new Error((startJson && startJson.message) || 'Failed to start model comparison job');
    }
    // Training (RF/ANN/LSSVM/XGBoost) now runs in the background on the
    // server, so we poll for status instead of waiting on one long request -
    // this is what stops slow servers from hitting a 504 Gateway Timeout.
    data = await pollCompareModelsJob(startJson.jobId);
  } catch (err) {
    document.getElementById('loader').style.display = 'none';
    stopSimulationAndMark(null);
    alert('Request failed or server unreachable.');
    return;
  }

  document.getElementById('loader').style.display = 'none';

  if (!data || !data.success) {
    stopSimulationAndMark(null);
    alert('Server returned an error or no data.');
    return;
  }

  const r = data.results || {};

  // CHANGED: added residualRF, lssvm, hybridLSSVM to resultsMap for progress card marking
  const resultsMap = {};
  if (r.pureRF      !== undefined) resultsMap.pureRF      = { stats: r.pureRF };
  if (r.hybridRF    !== undefined) resultsMap.hybridRF    = { stats: r.hybridRF };
  if (r.residualRF  !== undefined) resultsMap.residualRF  = { stats: r.residualRF };
  if (r.baseFormula !== undefined) resultsMap.baseFormula = { stats: r.baseFormula };
  if (r.ann         !== undefined) resultsMap.ann         = { stats: r.ann };
  if (r.lssvm       !== undefined) resultsMap.lssvm       = { stats: r.lssvm };
  if (r.hybridLSSVM !== undefined) resultsMap.hybridLSSVM = { stats: r.hybridLSSVM };
  if (r.pure_xgb   && r.pure_xgb.stats)   resultsMap.pure_xgb   = { stats: r.pure_xgb.stats };
  if (r.hybrid_xgb && r.hybrid_xgb.stats) resultsMap.hybrid_xgb = { stats: r.hybrid_xgb.stats };

  stopSimulationAndMark(resultsMap);

  renderComparisonResultsFromApi(r, currentActiveModelName);

  if (data.testSet && data.testSet.length) {
    showTestSet(data.testSet);
  } else {
    document.getElementById('testSetSection').style.display = 'none';
  }

  // Persist on server so users on other devices see the same latest results.
  await Promise.all([
    saveComparisonStateToServer({
      results: r,
      activeModelKey: currentActiveModelKey,
      activeModelName: currentActiveModelName,
      timestamp: new Date().toISOString(),
      fileName: fileInput.files[0]?.name || '',
      trainMode
    }),
    saveTestDatasetToServer(data.testSet || [], _modelCols)
  ]);

  fetchTrainingDataset();
}

/* -------- Activate model -------- */
async function activateSelectedModel() {
  const model = document.getElementById('activateModelSelect').value;
  if (!model) { alert('Please select a model to activate.'); return; }
  if (!confirm('This will overwrite the current active model. Continue?')) return;

  const loader = document.getElementById('activateLoader');
  loader.style.display = 'block';
  try {
    const userId = localStorage.getItem('user_id');
    const res  = await fetch('./api/activate-model', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelName: model, user_id: userId })
    });
    const data = await res.json();
    loader.style.display = 'none';
    if (!data.success) { alert('Activation failed: ' + data.message); return; }
    alert('Model activated successfully!');
    fetchActiveModel();
  } catch (err) {
    loader.style.display = 'none';
    alert('Server error during activation.');
  }
}

/* -------- Init -------- */
(async function initPage() {
  await fetchActiveModel();

  await Promise.all([
    restoreComparisonResultsFromServer(),
    (async () => {
      const cachedTest = await loadTestDatasetFromServer();
      const rows = normalizeServerTestSet(cachedTest);
      if (rows && rows.length) {
        showTestSet(rows);
      } else {
        document.getElementById('testSetSection').style.display = 'none';
      }
    })()
  ]);

  if (!_allTestRows.length) {
    document.getElementById('testSetSection').style.display = 'none';
  }

  fetchTrainingDataset();
})();


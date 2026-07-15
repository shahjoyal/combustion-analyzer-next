

    // --- Edit flow state ---
let latestSelectedId = null; // keep the latest-checked primary id

// --- Selection mode state ('normal' = click each checkbox individually, 'range' = click a start then an end) ---
let selectionMode = 'normal';
let rangeAnchorCheckbox = null; // the checkbox marked as the start of a range, while waiting for the end click

function setSelectionMode(mode) {
  selectionMode = mode;

  // clear any pending range anchor + its highlight when switching modes
  if (rangeAnchorCheckbox) rangeAnchorCheckbox.classList.remove('range-anchor');
  rangeAnchorCheckbox = null;

  const modeSelectBtn = document.getElementById('mode-select-btn');
  const modeRangeBtn = document.getElementById('mode-range-btn');
  if (modeSelectBtn) modeSelectBtn.classList.toggle('active', mode === 'normal');
  if (modeRangeBtn) modeRangeBtn.classList.toggle('active', mode === 'range');
}

document.addEventListener('DOMContentLoaded', () => {
  const modeSelectBtn = document.getElementById('mode-select-btn');
  const modeRangeBtn = document.getElementById('mode-range-btn');
  if (modeSelectBtn) modeSelectBtn.addEventListener('click', () => setSelectionMode('normal'));
  if (modeRangeBtn) modeRangeBtn.addEventListener('click', () => setSelectionMode('range'));
});

function handleCheckboxChange(e) {
  const cb = e.target;
  const id = cb.getAttribute('data-id') || '';

  if (selectionMode === 'range') {
    handleRangeCheckboxClick(cb);
    updateSelectionButtons();
    return;
  }

  if (cb.checked) {
    // mark latest when checked
    latestSelectedId = id;
  } else {
    // if user unchecked the latest, move latestSelectedId to the last checked checkbox (if any)
    if (latestSelectedId === id) {
      const checked = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'));
      latestSelectedId = checked.length ? checked[checked.length - 1].getAttribute('data-id') : null;
    }
  }
  updateSelectionButtons(); // reuse existing enable/disable behaviour
}

// Handles a checkbox click while in 'range' selection mode:
// first click = start of range (anchor), second click = end of range -> checks everything in between.
function handleRangeCheckboxClick(cb) {
  const allCbs = Array.from(document.querySelectorAll('#table-body input[type="checkbox"]'));
  const clickedIdx = allCbs.indexOf(cb);
  const id = cb.getAttribute('data-id') || '';

  if (!rangeAnchorCheckbox) {
    // no start picked yet
    if (!cb.checked) {
      // user unchecked a box that wasn't part of an active range pick; just update bookkeeping
      if (latestSelectedId === id) {
        const checked = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'));
        latestSelectedId = checked.length ? checked[checked.length - 1].getAttribute('data-id') : null;
      }
      return;
    }
    // this checkbox becomes the start of the range
    rangeAnchorCheckbox = cb;
    cb.classList.add('range-anchor');
    latestSelectedId = id;
    return;
  }

  // an anchor already exists -> this click defines the end of the range
  const anchorIdx = allCbs.indexOf(rangeAnchorCheckbox);
  const startIdx = Math.min(anchorIdx, clickedIdx);
  const endIdx = Math.max(anchorIdx, clickedIdx);

  for (let i = startIdx; i <= endIdx; i++) {
    allCbs[i].checked = true;
  }

  rangeAnchorCheckbox.classList.remove('range-anchor');
  rangeAnchorCheckbox = null;

  const checked = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'));
  latestSelectedId = checked.length ? checked[checked.length - 1].getAttribute('data-id') : null;
}


// enhance existing updateSelectionButtons to enable Edit button
function updateSelectionButtons() {
  const checked = document.querySelectorAll('input[type="checkbox"]:checked');
  const deleteBtn = document.getElementById('delete-selected-btn');
  const downloadBtn = document.getElementById('download-selected-btn');
  const editBtn = document.getElementById('edit-selected-btn');

  const any = checked.length > 0;
  if (deleteBtn) deleteBtn.disabled = !any;
  if (downloadBtn) downloadBtn.disabled = !any;
  if (editBtn) editBtn.disabled = !any;

  // if something selected but latestSelectedId is null (e.g. table re-render), set it to last checked
  if (any && !latestSelectedId) {
    const last = checked[checked.length - 1];
    latestSelectedId = last ? last.getAttribute('data-id') : null;
  }
}

// open modal and populate fields for the chosen row object
function openEditModal(rowObj, originalOid) {
  const backdrop = document.getElementById('edit-modal-backdrop');
  const fieldsDiv = document.getElementById('edit-form-fields');
  fieldsDiv.innerHTML = '';

  if (!rowObj) rowObj = {};
  if (rowObj.coalId === undefined) rowObj.coalId = '';

  const preferred = ['coalId','coal','name','SiO2','Al2O3','Fe2O3','CaO','MgO','Na2O','K2O','TiO2','SO3','P2O5','Mn3O4','Sulphur','GCV','cost','Transport ID','shipmentDate'];

  const keysSet = new Set(Object.keys(rowObj));
  keysSet.delete('_id');
  keysSet.delete('__v');

  const orderedPreferred = preferred.filter(k => k === 'coalId' || rowObj[k] !== undefined);
  const remaining = Array.from(keysSet).filter(k => !orderedPreferred.includes(k));
  const ordered = orderedPreferred.concat(remaining);

  // helper: map unicode subscripts to normal digits and trim spaces, lowercase for comparisons
  const subToNormal = {'₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9'};
  function normalizeKey(k='') { return String(k).split('').map(ch => subToNormal[ch] || ch).join('').replace(/\s+/g,''); }
  function normLower(k=''){ return normalizeKey(k).toLowerCase(); }

  // sets (use lowercased normalized keys)
  const oxideFieldsLower = new Set(['sio2','al2o3','fe2o3','cao','mgo','na2o','k2o','tio2','so3','p2o5','mn3o4']);
  const twoDecimalExtraLower = new Set(['sulphur','sulphurs','s']); // include variations you have
  const costFieldsLower = new Set(['gcv','cost']); // display rules special for these

  // helper to format numbers for input display:
  // - oxides and twoDecimalExtra -> up to 2 decimals, trailing zeros trimmed but show at most 2 digits
  // - cost/gcv -> use existing formatCellValue (so integers show without .00)
  function formatForInputDisplay(raw, normLowerKey) {
    // try numeric
    const maybeNum = Number(String(raw).replace(/,/g,''));
    if (!Number.isNaN(maybeNum) && isFinite(maybeNum)) {
      // cost-like fields -> use formatCellValue so integers don't get .00
      if (costFieldsLower.has(normLowerKey)) {
        return formatCellValue(maybeNum);
      }
      // oxides or sulphur -> round to 2 decimals and trim trailing zeros (up to 2 decimals)
      if (oxideFieldsLower.has(normLowerKey) || twoDecimalExtraLower.has(normLowerKey)) {
        const rounded = Math.round(maybeNum * 100) / 100;
        // if integer, show integer; else show up to 2 decimals trimmed
        if (Math.abs(rounded - Math.round(rounded)) < 1e-9) return String(Math.round(rounded));
        return rounded.toFixed(2).replace(/\.?0+$/, '');
      }
      // fallback numeric default: use formatCellValue
      return formatCellValue(maybeNum);
    }
    // non-numeric -> return as-is
    return String(raw === null || raw === undefined ? '' : raw);
  }

  // helper to compute numeric value to send to server:
  // - we will convert numeric strings to numbers and round oxides to 2 decimals before sending
  function numericForSave(raw, normLowerKey) {
    const maybeNum = Number(String(raw).replace(/,/g,''));
    if (!Number.isNaN(maybeNum) && isFinite(maybeNum)) {
      // round oxides/2-decimals to 2 decimals
      if (oxideFieldsLower.has(normLowerKey) || twoDecimalExtraLower.has(normLowerKey)) {
        return Math.round(maybeNum * 100) / 100;
      }
      // otherwise keep numeric but round to 2 decimals to be safe for backend (you can change)
      return Math.round(maybeNum * 100) / 100;
    }
    return raw;
  }

  // build inputs
  ordered.forEach(k => {
    const safeKey = String(k);
    let val = rowObj[k];
    if (val === null || val === undefined) val = '';
    const row = document.createElement('div');
    row.className = 'field-row';

    const normL = normLower(safeKey);

    // Decide input type
    if (oxideFieldsLower.has(normL) || twoDecimalExtraLower.has(normL) || costFieldsLower.has(normL)) {
      // Use number inputs for these keys
      const displayVal = formatForInputDisplay(val, normL);
      row.innerHTML = `<label>${safeKey}</label><input data-field="${safeKey}" type="number" step="any" value="${String(displayVal).replace(/"/g,'&quot;')}">`;
    } else {
      // default text input
      row.innerHTML = `<label>${safeKey}</label><input data-field="${safeKey}" type="text" value="${String(val).replace(/"/g,'&quot;')}">`;
    }

    fieldsDiv.appendChild(row);
  });

  // After fields exist, add blur formatting to inputs so they normalize when user leaves the field
  Array.from(fieldsDiv.querySelectorAll('input[data-field]')).forEach(inp => {
    const k = inp.getAttribute('data-field');
    const normL = normLower(k);
    // on blur, format the displayed value to match rules
    inp.addEventListener('blur', (e) => {
      const raw = inp.value;
      // if numeric-like, format appropriately
      const formatted = formatForInputDisplay(raw, normL);
      inp.value = formatted;
    });
    // optional: on focus, keep raw full value (do nothing)
  });

  // show modal
  backdrop.style.display = 'flex';
  backdrop.setAttribute('aria-hidden','false');

  // cancel
  document.getElementById('edit-cancel-btn').onclick = () => {
    backdrop.style.display = 'none';
    backdrop.setAttribute('aria-hidden','true');
  };

  // save
  document.getElementById('edit-save-btn').onclick = async () => {
    const inputs = Array.from(fieldsDiv.querySelectorAll('input[data-field]'));
    const updates = {};
    inputs.forEach(inp => {
      const k = inp.getAttribute('data-field');
      const v = inp.value.trim();
      const normL = normLower(k);
      if (v === '') { updates[k] = null; return; }
      // if numeric-like, convert and round where necessary
      const maybeNum = Number(String(v).replace(/,/g,''));
      if (!Number.isNaN(maybeNum) && isFinite(maybeNum)) {
        updates[k] = numericForSave(maybeNum, normL);
      } else {
        updates[k] = v;
      }
    });

    const idType = (rowObj.coalId !== undefined && rowObj.coalId !== null && String(rowObj.coalId).trim() !== '') ? 'coalId' : (rowObj._id ? '_id' : 'coalId');
    const idValue = (idType === 'coalId') ? (rowObj.coalId || latestSelectedId) : (rowObj._id || '');

    try {
      const res = await fetch('./update-coal', {
        method: 'PATCH',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ idType, idValue, updates })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || JSON.stringify(json));
      alert('Updated successfully');
      backdrop.style.display = 'none';
      backdrop.setAttribute('aria-hidden','true');
      if (updates.coalId !== undefined && updates.coalId !== null) {
        latestSelectedId = String(updates.coalId);
      }
      fetchData();
    } catch (err) {
      console.error('update error', err);
      alert('Update failed: ' + String(err.message || err));
    }
  };
}


// Edit button click handler: pick the latestSelectedId item (or last checked) and open modal
document.getElementById('edit-selected-btn').addEventListener('click', function(){
  const checked = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'));
  if (checked.length === 0) { alert('Select a row to edit'); return; }
  // choose latestSelectedId or fallback to last checked
  const chosenId = latestSelectedId || checked[checked.length - 1].getAttribute('data-id');
  // find the checkbox element with that data-id
  const targetCb = checked.find(cb => cb.getAttribute('data-id') === chosenId) || checked[checked.length - 1];
  const row = (targetCb && targetCb.dataset && targetCb.dataset.row) ? JSON.parse(targetCb.dataset.row || "{}") : {};
  const oid = targetCb.getAttribute('data-oid') || (row._id ? row._id : null);
  openEditModal(row, oid);
});

    // Simple auth check (kept)
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        // keep but don't aggressively block in case of testing
        // alert('You must login first!');
        // window.location.href = '/login.html';
    }

    // ---------- helpers ----------
// ----------------- replace the old formatCellValue with this -----------------
function formatCellValue(value) {
    if (value === null || value === undefined) return "";

    // helper: try convert to number (allow strings with commas)
    function toNumber(v) {
        if (typeof v === "number" && isFinite(v)) return v;
        if (typeof v === "string") {
            const t = v.trim();
            if (t === "") return null;
            const n = Number(t.replace(/,/g, ""));
            return (!Number.isNaN(n) && isFinite(n)) ? n : null;
        }
        return null;
    }

    const n = toNumber(value);
    if (n !== null) {
        // integer -> show no decimals
        if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
        // otherwise show up to 2 decimals but trim trailing zeros (e.g. 3.5 -> 3.5 ; 3.50 -> 3.5)
        const rounded = Math.round(n * 100) / 100;
        return rounded.toFixed(2).replace(/\.?0+$/, '');
    }

    // fallback for non-numeric strings / objects
    if (typeof value === 'string') return value;
    try { return JSON.stringify(value); } catch(e) { return String(value); }
}


    // ---------- fetch and render ----------
let cachedData = [];

// fetchData caches the rows and applies current search filter
function fetchData() {
    fetch("./fetch-data")
        .then(r => r.json())
        .then(data => {
            cachedData = Array.isArray(data) ? data : [];
            // if search box has a value, apply it, otherwise display all
            const q = (document.getElementById('searchInput') ? document.getElementById('searchInput').value : '') || '';
            applySearchAndDisplay(q);
        })
        .catch(err => console.error("fetch error", err));
}

// Search/filter logic: exact -> startsWith -> contains
function applySearchAndDisplay(rawQuery) {
    const q = (rawQuery || '').trim().toLowerCase();
    if (!q) {
        return displayTable(cachedData);
    }

    // attempt exact full name match (coal or name)
    const exact = cachedData.filter(r => {
        const name = ((r.coal || r.name || r['Coal'] || '') + '').toLowerCase();
        return name === q;
    });
    if (exact.length) return displayTable(exact);

    const starts = [];
    const contains = [];

    cachedData.forEach(r => {
        const name = ((r.coal || r.name || r['Coal'] || '') + '').toLowerCase();
        if (!name) return;
        if (name.startsWith(q)) starts.push(r);
        else if (name.includes(q)) contains.push(r);
    });

    displayTable(starts.concat(contains));
}

    // prefer explicit coalId field for the first column (Coal ID)
    function getCoalIdFromRow(r) {
        if (!r) return '';
        if (r.coalId !== undefined && r.coalId !== null && String(r.coalId).trim() !== '') return String(r.coalId);
        if (r['Coal ID'] !== undefined && r['Coal ID'] !== null && String(r['Coal ID']).trim() !== '') return String(r['Coal ID']);
        // fallback only if absolutely necessary
        if (r._id) return String(r._id);
        return '';
    }

function displayTable(data) {
    const headerRow = document.getElementById('table-header');
    const tbody = document.getElementById('table-body');
    headerRow.innerHTML = '';
    tbody.innerHTML = '';

    // redrawing destroys existing checkbox nodes, so any in-progress range pick is no longer valid
    rangeAnchorCheckbox = null;

    if (!data || data.length === 0) {
        headerRow.innerHTML = '<th>No data</th>';
        return;
    }

    // normalize subscript unicode to digits for matching
    const subToNormal = {'₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9'};
    function normalizeKey(k='') {
        if (!k) return '';
        // replace unicode subscript digits with normal digits and remove spaces
        return String(k).split('').map(ch => subToNormal[ch] || ch).join('').replace(/\s+/g,'');
    }

    // oxide set we want to render with subscripts (add any others you need)
    const oxideSet = new Set(['SiO2','Al2O3','Fe2O3','CaO','MgO','Na2O','K2O','TiO2','SO3','P2O5','Mn3O4']);

    // convert a label to HTML with <sub> for digits (safe because labels are known keys)
    function labelWithSubscripts(label) {
        if (!label) return '';
        const norm = normalizeKey(label);
        if (!oxideSet.has(norm)) return String(label);
        return String(norm).replace(/(\d)/g, '<sub>$1</sub>');
    }

    // Collect all keys present across rows (exclude __v)
    const keySet = new Set();
    data.forEach(d => Object.keys(d).forEach(k => { if (k !== '__v') keySet.add(k); }));

    // Preferred order; we'll show "Coal ID" as first visible column always
    const preferred = ['coal','name','SiO2','Al2O3','Fe2O3','CaO','MgO','Na2O','K2O','TiO2','SO3','P2O5','Mn3O4','Sulphur','GCV','cost','Transport ID','shipmentDate'];
    const keys = [];
    keys.push('Coal ID'); // visible first header

    // Add preferred keys if present (preserve original presence check)
    preferred.forEach(p => {
        if (keySet.has(p) && !keys.includes(p)) {
            keys.push(p);
            keySet.delete(p);
        }
    });

    // Add remaining keys (excluding internal and coalId/_id since we used Coal ID above)
    Array.from(keySet).filter(k => k !== 'coalId' && k !== '_id' && k !== '__v').forEach(k => keys.push(k));

    // final column is Select
    keys.push('Select');

    // ---------- BUILD HEADERS ----------
    // Keep canonical keys for lookup
    const dataKeys = keys.slice();

    // Friendly label map (lookup by normalized-lowercase key)
const headerLabelMap = {
  'sulphur': 'Sulphur (S)',
  's': 'Sulphur (S)',        // ADD THIS
  'sulphurs': 'Sulphur (S)',// ADD THIS
  'cost': 'Cost (INR/MT)',
  'coal': 'Coal Name',
  'gcv': 'GCV'
};


    // Build display labels (preserving oxide subscripts)
    const displayLabels = dataKeys.map(k => {
      if (k === 'Coal ID' || k === 'Select') return k;
      const normLower = normalizeKey(k).toLowerCase().replace(/[^a-z]/g,'');
      if (oxideSet.has(normalizeKey(k))) {
        return labelWithSubscripts(k); // HTML string
      }
      return headerLabelMap[normLower] || k;
    });

    // Create header DOM nodes from displayLabels
    displayLabels.forEach(lbl => {
      const th = document.createElement('th');
      if (String(lbl).indexOf('<sub>') !== -1) th.innerHTML = lbl;
      else th.textContent = lbl;
      headerRow.appendChild(th);
    });

    // ---------- RENDER ROWS ----------
    // helper to get value for canonical key with fallbacks
    function getValueForKey(row, key) {
      if (!row) return undefined;
      // direct property
      if (Object.prototype.hasOwnProperty.call(row, key)) return row[key];

      // compact (remove spaces) e.g. "Transport ID" -> "TransportID"
      const compact = key.replace(/\s+/g, '');
      if (Object.prototype.hasOwnProperty.call(row, compact)) return row[compact];

      // normalized key forms
      const keyNorm = normalizeKey(key);
      if (Object.prototype.hasOwnProperty.call(row, keyNorm)) return row[keyNorm];
      if (Object.prototype.hasOwnProperty.call(row, keyNorm.toLowerCase())) return row[keyNorm.toLowerCase()];
      if (Object.prototype.hasOwnProperty.call(row, keyNorm.toUpperCase())) return row[keyNorm.toUpperCase()];

      // common alias fallbacks
      const keyLower = String(key).toLowerCase();

      if (keyLower === 'coal' || keyLower === 'name' || keyLower === 'coal id') {
        return row.coal || row.name || row.Coal || row['Coal'] || row.coalId || row['coalId'] || row['Coal ID'];
      }

      if (keyLower.indexOf('gcv') !== -1) {
        return row.GCV || row.gcv || row['GCV'] || row['gcv'];
      }

      if (keyLower.indexOf('sulphur') !== -1 || keyLower === 's') {
        return row['Sulphur (S)'] || row.Sulphur || row.SulphurS || row.S || row.sulphur || row.s;
      }

      if (keyLower.indexOf('cost') !== -1) {
        return row.cost || row.Cost || row.price || row.Price;
      }

      // shipment/transport variants
      if (keyLower.indexOf('transport') !== -1) {
        return row['Transport ID'] || row.TransportID || row.transportId || row.transport;
      }

      if (keyLower.indexOf('date') !== -1) {
        return row.shipmentDate || row.shipDate || row.date || row['shipmentDate'];
      }

      // fallback to undefined
      return undefined;
    }

    data.forEach(row => {
        const tr = document.createElement('tr');

        // Coal ID cell (prefer coalId or _id)
        const coalIdVal = (typeof getCoalIdFromRow === 'function') ? getCoalIdFromRow(row) : (row.coalId || row._id || '');
        const tdId = document.createElement('td');
        tdId.textContent = coalIdVal;
        tr.appendChild(tdId);

        // For each canonical data key (skip first 'Coal ID' and last 'Select')
        for (let i = 1; i < dataKeys.length - 1; i++) {
            const key = dataKeys[i];
            const raw = getValueForKey(row, key);
            const td = document.createElement('td');
            td.textContent = formatCellValue(raw);
            tr.appendChild(td);
        }

        // select checkbox column
        const cbTd = document.createElement('td');
        const cb = document.createElement('input');
        cb.type = 'checkbox';

        const primaryId = (row.coalId !== undefined && row.coalId !== null && String(row.coalId).trim() !== '') ? String(row.coalId) : (row._id ? String(row._id) : '');
        if (primaryId) cb.setAttribute('data-id', primaryId);
        else cb.setAttribute('data-id', '');

        if (row._id) cb.setAttribute('data-oid', String(row._id));
        try { cb.dataset.row = JSON.stringify(row); } catch(e) { cb.dataset.row = "{}"; }
        cb.addEventListener('change', handleCheckboxChange);
        cbTd.appendChild(cb);
        tr.appendChild(cbTd);

        tbody.appendChild(tr);
    });

    updateSelectionButtons();
}




    // ---------- file upload ----------
    document.getElementById('btn-upload').addEventListener('click', function() {
        const fi = document.getElementById('fileInput');
        if (fi) fi.click();
    });

    document.getElementById('fileInput').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const fd = new FormData();
        fd.append('file', file);

        fetch('./upload-excel', { method:'POST', body: fd })
            .then(r => r.json())
            .then(data => {
                alert(data.message || 'Upload finished');
                fetchData();
            })
            .catch(err => {
                console.error('upload err', err);
                alert('Upload failed');
            })
            .finally(() => { e.target.value = ''; });
    });

    // ---------- download template ----------
document.getElementById('btn-download-template').addEventListener('click', async function () {
  try {
    const res = await fetch('./download-template');

    if (!res.ok) {
      throw new Error('Download failed');
    }

    const blob = await res.blob();

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'Coal_Upload_Template.xlsx';

    document.body.appendChild(a);
    a.click();

    a.remove();
    window.URL.revokeObjectURL(url);

  } catch (err) {
    console.error(err);
    alert('Template download failed. Please try again.');
  }
});

    // ---------- selection / button enable logic ----------
function updateSelectionButtons() {
    // Keep current checked set
    const checked = document.querySelectorAll('input[type="checkbox"]:checked');

    const deleteBtn = document.getElementById('delete-selected-btn');
    const downloadBtn = document.getElementById('download-selected-btn');
    const editBtn = document.getElementById('edit-selected-btn');

    const any = checked.length > 0;
    if (deleteBtn) deleteBtn.disabled = !any;
    if (downloadBtn) downloadBtn.disabled = !any;
    if (editBtn) editBtn.disabled = !any;

    // If something selected but latestSelectedId is null (e.g. after a re-render), set it to last checked
    if (any && !latestSelectedId) {
        const last = checked[checked.length - 1];
        latestSelectedId = last ? last.getAttribute('data-id') : null;
    }

    // If nothing selected, clear latestSelectedId
    if (!any) latestSelectedId = null;
}


    document.getElementById('delete-selected-btn').addEventListener('click', function(){
        const checked = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'));
        if (checked.length === 0) { alert('Select rows first'); return; }
        if (!confirm('Are you sure you want to delete selected rows?')) return;
        // collect primary ids (coalId preferred)
        const ids = checked.map(cb => cb.getAttribute('data-id')).filter(Boolean);

        fetch('./delete-data', {
            method:'DELETE',
            headers: { 'Content-Type':'application/json' },
            body: JSON.stringify({ ids })
        })
        .then(r => r.json())
        .then(resp => {
            alert(resp.message || 'Deleted');
            fetchData();
        })
        .catch(err => { console.error(err); alert('Delete failed'); });
    });

    // download dropdown toggle
    function setupDownloadDropdown() {
        const downloadBtn = document.getElementById('download-selected-btn');
        const menu = document.getElementById('download-menu');
        if (!downloadBtn || !menu) return;
        downloadBtn.addEventListener('click', function(e){
            e.stopPropagation();
            menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
            menu.setAttribute('aria-hidden', menu.style.display === 'block' ? 'false' : 'true');
        });
        document.addEventListener('click', function(e){
            if (!menu.contains(e.target) && e.target !== downloadBtn) {
                menu.style.display = 'none';
            }
        });
    }

/* ===== START: Improved PDF generation using jsPDF + autoTable ===== */

async function loadImageDataUrl(src) {
  return new Promise((resolve, reject) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous"; // try to avoid tainting canvas
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch (err) {
        // fallback: resolve null so generator will use text-only header
        console.warn('logo -> toDataURL failed', err);
        resolve(null);
      }
    };
    img.onerror = (e) => {
      console.warn('logo load failed', e);
      resolve(null);
    };
    img.src = src;
  });
}

/**
 * Create a clean, paginated PDF from an array of objects (rows).
 * - rows: array of plain objects (each key is column)
 * - filename: string
 */
async function generatePDFFromRows(rows, filename = 'abhitech-coal-data.pdf') {
  if (!rows || rows.length === 0) {
    alert('No rows to export');
    return;
  }

  // derive columns (keep insertion order of keys from first row, plus union of others)
  const keySet = new Set();
  rows.forEach(r => {
    Object.keys(r).forEach(k => {
      if (k === '_id' || k === '__v') return;
      keySet.add(k);
    });
  });

  const keys = Array.from(keySet);
  // If your UI expects "Coal ID" first, try to move obvious id fields to front:
  const coalIdIdx = keys.findIndex(k => /coalid|coal id|coalId|coal/i.test(k));
  if (coalIdIdx > 0) {
    const [cid] = keys.splice(coalIdIdx, 1);
    keys.unshift(cid);
  }

  // Build table body rows with formatted cell values
  const body = rows.map(r => keys.map(k => formatCellValue(r[k])));

  // Create PDF (landscape A4 for wide tables)
  const doc = new window.jspdf.jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  // Try to load logo as data URL (local path /images/abhitech-logo.png recommended)
  const logoDataUrl = await loadImageDataUrl('./images/abhitech-logo.png');

  const margin = { top: 60, left: 40, right: 40 };
  let startY = margin.top;

  // If logo exists, draw it top-left
  if (logoDataUrl) {
    // draw logo at 40pt from left, 18pt from top
    const MAX_LOGO_HEIGHT = 40;
    const img = new Image();
    img.src = logoDataUrl;
    await new Promise((res) => (img.onload = res));
    // scale to max height while keeping aspect
    const ratio = img.naturalWidth / img.naturalHeight || 1;
    const logoH = MAX_LOGO_HEIGHT;
    const logoW = logoH * ratio;
    doc.addImage(logoDataUrl, 'PNG', margin.left, 18, logoW, logoH);
  }

  // Title centered (above table)
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  const title = 'Abhitech Energycon Limited - Coal Data';
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.text(title, pageWidth / 2, 36, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');

  // Use autoTable to render the table with automatic pagination
  doc.autoTable({
    head: [keys.map(k => String(k))],
    body: body,
    startY: startY,
    margin: { left: margin.left, right: margin.right },
    styles: {
      fontSize: 9,
      cellPadding: 6,
      overflow: 'linebreak',
      valign: 'middle'
    },
    headStyles: {
      fillColor: [2, 18, 110], // dark blue header
      textColor: 255,
      halign: 'center'
    },
    didDrawPage: function (data) {
      // add page footer with page number
      const pageNumber = doc.internal.getNumberOfPages();
      const footerText = `Page ${pageNumber}`;
      const footerY = doc.internal.pageSize.getHeight() - 10;
      doc.setFontSize(9);
      doc.text(footerText, pageWidth - margin.right, footerY, { align: 'right' });
    },
    // allow autoTable to compute page breaks
    theme: 'striped'
  });

  doc.save(filename);
}

/**
 * Use the current DOM table (headers + visible columns order) to export PDF for the whole table.
 */
async function generatePDFFromTable(filename = 'abhitech-coal-data.pdf') {
  const headerRow = document.getElementById('table-header');
  const tbody = document.getElementById('table-body');
  if (!headerRow || !tbody) {
    alert('Table not found');
    return;
  }

  // Extract header keys (skipping the final Select column)
  const headerKeys = Array.from(headerRow.children).map(th => th.textContent);
  // remove 'Select' if present as last column
  if (headerKeys[headerKeys.length - 1] && /select/i.test(headerKeys[headerKeys.length - 1])) {
    headerKeys.pop();
  }

  // Build rows in same visual order
  const rows = [];
  Array.from(tbody.children).forEach(tr => {
    const cells = Array.from(tr.children);
    // skip last cell which is checkbox column if present
    const values = [];
    for (let i = 0; i < headerKeys.length; i++) {
      const td = cells[i];
      values.push(td ? td.innerText.trim() : '');
    }
    // convert to object with header keys
    const obj = {};
    headerKeys.forEach((k, i) => obj[k] = values[i]);
    rows.push(obj);
  });

  await generatePDFFromRows(rows, filename);
}

/* ===== Re-wire your existing downloadSelected and whole-page download handlers ===== */

async function downloadSelected(format) {
  const checked = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'));
  if (checked.length === 0) { alert('Select rows first'); return; }

  const rows = checked.map(cb => {
    try { return JSON.parse(cb.dataset.row || "{}"); } catch(e) { return {}; }
  });

  if (format === 'excel') {
    // keep your existing excel logic
    const jsonData = rows.map(r => {
      const obj = {};
      Object.keys(r).forEach(k => {
        if (k === '_id') return;
        obj[k] = (r[k] === null || r[k] === undefined) ? "" : (typeof r[k] === 'number' ? r[k].toFixed(2) : r[k]);
      });
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(jsonData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Selected");
    XLSX.writeFile(wb, "selected_rows.xlsx");
  } else if (format === 'pdf') {
    try {
      await generatePDFFromRows(rows, 'selected_rows_abhitech.pdf');
    } catch (err) {
      console.error('autoTable PDF failed, falling back to image PDF', err);
      // fallback: use the image approach you had (single-column text)
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF("l", "mm", "a4");
      doc.setFontSize(10);
      let y = 10;
      rows.forEach((r, idx) => {
        const line = Object.entries(r).filter(([k])=> k !== '_id').map(([k,v]) => `${k}: ${formatCellValue(v)}`).join('  |  ');
        doc.text(`${idx+1}. ${line}`, 10, y);
        y += 6;
        if (y > doc.internal.pageSize.getHeight() - 10) { doc.addPage(); y = 10; }
      });
      doc.save('selected_rows.pdf');
    }
  }
  const menu = document.getElementById('download-menu'); if (menu) menu.style.display = 'none';
}

// Whole page/table button now uses autoTable-based table export
document.getElementById('downloadWholePDFBtn').addEventListener('click', async function(){
  try {
    await generatePDFFromTable('abhitech-coal-data.pdf');
  } catch (err) {
    console.error('generatePDFFromTable failed, falling back to html2canvas', err);
    // fallback to your html2canvas code
    const element = document.body;
    window.scrollTo(0,0);
    html2canvas(element, { scale: 2, useCORS: true, allowTaint: true }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf || window;
      const pdf = new jsPDF('p','mm','a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);

      let heightLeft = imgHeight - pageHeight;
      while (heightLeft > 0) {
        position = -heightLeft;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('Coal_Blending_Ratio.pdf');
    }).catch(e=>{
      console.error(e);
      alert('Failed to create PDF of page. Try browser Print -> Save as PDF as last resort.');
    });
  }
});
/* ===== END: Improved PDF generation ===== */



    // ---------- init ----------
document.addEventListener('DOMContentLoaded', () => {
    setupDownloadDropdown();
    fetchData();

    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            applySearchAndDisplay(e.target.value || '');
        });
    }
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const q = (document.getElementById('searchInput')?.value || '');
            applySearchAndDisplay(q);
        });
    }
});


    function logoutUser() { localStorage.setItem('isLoggedIn','false'); window.location.href='./login.html'; }


/* ---- next inline <script> block ---- */


(function(){
  const navBtns = Array.from(document.querySelectorAll('.common-navbar .nav-buttons button'))
    .filter(b => b.dataset && b.dataset.target);

  const path = (location.pathname || '').split('/').pop().toLowerCase();
  let matched = false;
  navBtns.forEach(btn => {
    const target = (btn.dataset.target || '').toLowerCase();
    btn.addEventListener('click', () => { if (target) location.href = target; });
    if ((path && path === target) || (!path && target === 'model.html')) {
      btn.classList.add('active');
      matched = true;
    } else {
      btn.classList.remove('active');
    }
  });

  if (!matched) {
    const pageHints = ['coal', 'slag', 'model'];
    for (const btn of navBtns) {
      const t = btn.dataset.target || '';
      for (const h of pageHints) {
        if (t.indexOf(h) !== -1 && document.body.innerText.toLowerCase().includes(h)) {
          btn.classList.add('active'); matched = true; break;
        }
      }
      if (matched) break;
    }
  }

  const logoutBtn = document.getElementById('common-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      try { localStorage.setItem('isLoggedIn','false'); } catch(e) {}
      window.location.href = './login.html';
    });
  }
})();

/* ======= COAL DROPDOWN (body-attached, keyboard, robust) ======= */
(function coalDropdownV3(){
  if (window.__coalDropdownV3_installed) return;
  window.__coalDropdownV3_installed = true;

  const RETRY_INTERVAL = 180;
  const MAX_RETRIES = 120;
  let tries = 0;

  let headerTh = null;
  let coalColIndex = null;
  let dropdownEl = null;
  let inputEl = null;
  let listEl = null;
  let coalNames = [];
  let activeIndex = -1;
  let isOpen = false;

  function findCoalHeader() {
    const header = document.getElementById('table-header');
    if (!header) return null;
    const ths = Array.from(header.querySelectorAll('th'));
    if (!ths.length) return null;
    // Prefer exact 'coal' (lowercase), otherwise include 'coal' but not 'coal id'
    for (let i = 0; i < ths.length; i++) {
      const t = (ths[i].innerText || ths[i].textContent || '').trim().toLowerCase();
      if (t === 'coal') return { th: ths[i], idx: i };
    }
    for (let i = 0; i < ths.length; i++) {
      const t = (ths[i].innerText || ths[i].textContent || '').trim().toLowerCase();
      if (t.includes('coal') && !t.includes('coal id')) return { th: ths[i], idx: i };
    }
    // fallback to second column if present (you indicated coal is index 1)
    if (ths.length > 1) return { th: ths[1], idx: 1 };
    return null;
  }

  function collectCoalNamesFromCachedOrDOM() {
    // prefer cachedData if available
    if (Array.isArray(window.cachedData) && window.cachedData.length) {
      const names = window.cachedData.map(r => (r.coal || r.Coal || r.name || '') + '');
      const uniq = Array.from(new Set(names.map(s => s.trim()).filter(Boolean)));
      return uniq;
    }
    // fallback: read from visible table DOM
    const tbody = document.getElementById('table-body');
    if (tbody) {
      const rows = Array.from(tbody.querySelectorAll('tr'));
      const names = rows.map(tr => {
        const cells = Array.from(tr.children);
        // coalColIndex might be offset by the 'Coal ID' sticky first column: in your table display, header shows 'Coal ID' as first column.
        // We are using coalColIndex to refer to header index; if header has 'Coal ID' at 0 and 'coal' at 1, this will match table cells ordering.
        const cell = cells[coalColIndex] || cells[coalColIndex]; // best effort
        return cell ? (cell.innerText || '').trim() : '';
      });
      return Array.from(new Set(names.filter(Boolean)));
    }
    return [];
  }

  function ensureDropdown() {
    if (dropdownEl) return;
    dropdownEl = document.createElement('div');
    dropdownEl.className = 'coal-dropdown-body';
    dropdownEl.style.display = 'none';
    dropdownEl.innerHTML = `
      <div class="cd-box">
        <input class="cd-input" type="text" autocomplete="off" placeholder="Type to filter coals..." aria-label="Coal filter">
        <ul class="cd-list" role="listbox"></ul>
      </div>
    `;
    document.body.appendChild(dropdownEl);
    inputEl = dropdownEl.querySelector('.cd-input');
    listEl = dropdownEl.querySelector('.cd-list');

    // keyboard navigation
    inputEl.addEventListener('keydown', (ev) => {
      const items = Array.from(listEl.querySelectorAll('.cd-item:not(.disabled)'));
      if (!items.length) return;
      if (ev.key === 'ArrowDown') {
        ev.preventDefault();
        setActive((activeIndex + 1) % items.length);
      } else if (ev.key === 'ArrowUp') {
        ev.preventDefault();
        setActive(activeIndex <= 0 ? items.length - 1 : activeIndex - 1);
      } else if (ev.key === 'Enter') {
        ev.preventDefault();
        if (activeIndex >= 0 && items[activeIndex]) items[activeIndex].click();
        else if (items[0]) items[0].click();
      } else if (ev.key === 'Escape') {
        ev.preventDefault();
        hideDropdown();
      }
    });

    // input filter
    inputEl.addEventListener('input', () => renderList(inputEl.value || ''));

    // click outside
    document.addEventListener('click', (e) => {
      if (!dropdownEl) return;
      if (!dropdownEl.contains(e.target) && headerTh && !headerTh.contains(e.target)) {
        hideDropdown();
      }
    });

    // reposition on scroll/resize
    window.addEventListener('scroll', () => {
      if (isOpen) positionDropdown();
    }, { passive: true });
    window.addEventListener('resize', () => {
      if (isOpen) positionDropdown();
    });
  }

  function openDropdown() {
    coalNames = collectCoalNamesFromCachedOrDOM();
    if (!coalNames.length) {
      // still no data, show a message
      coalNames = [];
    }
    ensureDropdown();
    renderList(''); // show all
    positionDropdown();
    dropdownEl.style.display = 'block';
    isOpen = true;
    inputEl.value = '';
    inputEl.focus();
  }

  function hideDropdown() {
    if (!dropdownEl) return;
    dropdownEl.style.display = 'none';
    activeIndex = -1;
    isOpen = false;
  }

  function toggleDropdown() {
    if (isOpen) hideDropdown(); else openDropdown();
  }

  function positionDropdown() {
    if (!headerTh || !dropdownEl) return;
    const rect = headerTh.getBoundingClientRect();
    const left = Math.max(6, rect.left + window.scrollX);
    const top = rect.bottom + window.scrollY + 6;
    dropdownEl.style.left = `${left}px`;
    // width - try to align with header width but allow a min width
    const width = Math.max(240, rect.width);
    dropdownEl.style.width = `${width}px`;
    dropdownEl.style.top = `${top}px`;
  }

  function renderList(filter) {
    if (!listEl) return;
    const q = (filter || '').toLowerCase().trim();
    listEl.innerHTML = '';
    activeIndex = -1;

    if (!coalNames.length) {
      const li = document.createElement('li');
      li.className = 'cd-item disabled';
      li.textContent = 'No coal names available';
      listEl.appendChild(li);
      return;
    }

    // startsWith first then contains
    const starts = coalNames.filter(n => n.toLowerCase().startsWith(q));
    const contains = coalNames.filter(n => !n.toLowerCase().startsWith(q) && n.toLowerCase().includes(q));
    const items = q ? starts.concat(contains) : coalNames.slice();

    if (!items.length) {
      const li = document.createElement('li');
      li.className = 'cd-item disabled';
      li.textContent = 'No matches';
      listEl.appendChild(li);
      return;
    }

    items.forEach((name, i) => {
      const li = document.createElement('li');
      li.className = 'cd-item';
      li.setAttribute('role','option');
      li.textContent = name;
      li.tabIndex = -1;

      li.addEventListener('click', (ev) => {
        ev.stopPropagation();
        applySelection(name);
      });

      li.addEventListener('mouseenter', () => setActive(i));
      listEl.appendChild(li);
    });
  }

  function setActive(i) {
    const items = Array.from(listEl.querySelectorAll('.cd-item'));
    items.forEach(it => it.classList.remove('active'));
    if (i >= 0 && items[i]) {
      items[i].classList.add('active');
      items[i].scrollIntoView({ block: 'nearest' });
      activeIndex = i;
    }
  }

  function applySelection(name) {
    // set the search input and apply the same filter
    const search = document.getElementById('searchInput');
    if (search) search.value = name;
    if (typeof window.applySearchAndDisplay === 'function') {
      try {
        applySearchAndDisplay(name);
      } catch (err) {
        console.error('applySearchAndDisplay failed', err);
      }
    }
    hideDropdown();
  }

  function attachHeaderListener() {
    if (!headerTh) return;
    // ensure we don't add duplicates
    if (headerTh.dataset.__coalDropdownClickAttached) return;
    headerTh.dataset.__coalDropdownClickAttached = '1';

    // Clicking header toggles dropdown. If the click lands on the input inside dropdown, ignore.
    headerTh.addEventListener('click', (e) => {
      // If the click occurs inside the dropdown already (rare), let it through
      if (dropdownEl && dropdownEl.contains(e.target)) return;
      toggleDropdown();
    });
  }

  function initOnceReady() {
    const found = findCoalHeader();
    if (!found) {
      if (++tries > MAX_RETRIES) {
        console.error('coal dropdown init: header not found');
        return;
      }
      return setTimeout(initOnceReady, RETRY_INTERVAL);
    }
    headerTh = found.th;
    coalColIndex = found.idx;
    ensureDropdown();
    attachHeaderListener();

    // update coalNames when cachedData updates - monkey patch fetchData callback if possible
    // Easiest approach: poll cachedData occasionally to refresh names while dropdown is closed
    let prevLen = (Array.isArray(window.cachedData) ? window.cachedData.length : 0);
    setInterval(() => {
      const curLen = (Array.isArray(window.cachedData) ? window.cachedData.length : 0);
      if (curLen !== prevLen) {
        prevLen = curLen;
        coalNames = collectCoalNamesFromCachedOrDOM();
        // If dropdown is open, re-render
        if (isOpen) renderList(inputEl.value || '');
      }
    }, 800);

    console.log('coal dropdown ready, header text:', (headerTh.innerText || headerTh.textContent).trim());
  }

  // run
  // ---- Observe header changes and reattach ----

let headerObserver = null;

function observeHeader() {

  const header = document.getElementById('table-header');
  if (!header) {
    setTimeout(observeHeader, 300);
    return;
  }

  if (headerObserver) return;

  headerObserver = new MutationObserver(() => {
    tries = 0;
    headerTh = null;
    coalColIndex = null;
    initOnceReady();
  });

  headerObserver.observe(header, {
    childList: true,
    subtree: true
  });
}

// start
observeHeader();
initOnceReady();


})();


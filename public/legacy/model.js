
  // --------- key normalization helpers (paste once, top of script) ----------
const aliasMap = {
  // ascii -> canonical keys (choose canonical style you use across code)
  'SiO2': 'SiO2', 'SiO₂': 'SiO2', 'sio2': 'SiO2',
  'Al2O3': 'Al2O3', 'Al₂O₃': 'Al2O3', 'al2o3': 'Al2O3',
  'Fe2O3': 'Fe2O3', 'Fe₂O₃': 'Fe2O3', 'fe2o3': 'Fe2O3',
  'CaO': 'CaO', 'MgO': 'MgO',
  'Na2O': 'Na2O', 'K2O': 'K2O',
  'TiO2': 'TiO2', 'TiO₂': 'TiO2',
  'SO3': 'SO3', 'SO₃': 'SO3',
  'P2O5': 'P2O5', 'P₂O₅': 'P2O5',
  'Mn3O4': 'Mn3O4', 'Mn₃O₄': 'Mn3O4',
  'S': 'S', 'Sulphur': 'S', 'Sulphur (S)': 'S', 'SulphurS': 'S',
  'GCV': 'GCV', 'gcv': 'GCV', 'Gcv': 'GCV'
};

// convert unicode subscripts to digits and digits to plain (helper)
function unicodeSubscriptToDigits(str) {
  if (!str) return str;
  const rev = { '₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9' };
  return str.replace(/[\u2080-\u2089]/g, ch => rev[ch] || ch);
}

function digitsToSubscript(str) {
  if (!str) return str;
  const map = { '0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉' };
  return str.replace(/\d/g, d => map[d] || d);
}

// Try a list of possible key variants, return the first existing property value
function getPropValue(coalInfo, key) {
  if (!coalInfo || !coalInfo.properties) return 0;
  const props = coalInfo.properties;

  // 1) exact
  if (props.hasOwnProperty(key)) {
    const v = parseFloat(props[key]);
    return Number.isFinite(v) ? v : 0;
  }

  // 2) aliasMap mapping (case-insensitive check)
  const keyLower = key.toString().trim().toLowerCase();
  for (const k in props) {
    if (k && k.toString().trim().toLowerCase() === keyLower) {
      const v = parseFloat(props[k]); return Number.isFinite(v) ? v : 0;
    }
  }

  // 3) try aliasMap canonicalization
  if (aliasMap[key]) {
    const mapped = aliasMap[key];
    if (props.hasOwnProperty(mapped)) {
      const v = parseFloat(props[mapped]); return Number.isFinite(v) ? v : 0;
    }
  }

  // 4) try unicode/ASCII conversions
  const keySubToDigits = unicodeSubscriptToDigits(key);
  if (props.hasOwnProperty(keySubToDigits)) {
    const v = parseFloat(props[keySubToDigits]); return Number.isFinite(v) ? v : 0;
  }
  // try digits -> subscript
  const keyDigitsToSub = digitsToSubscript(key);
  if (props.hasOwnProperty(keyDigitsToSub)) {
    const v = parseFloat(props[keyDigitsToSub]); return Number.isFinite(v) ? v : 0;
  }

  // 5) remove spaces / parentheses and try again
  const compact = key.replace(/\s+/g, '').replace(/[()]/g, '').toLowerCase();
  for (const k in props) {
    if (k && k.toString().replace(/\s+/g,'').replace(/[()]/g,'').toLowerCase() === compact) {
      const v = parseFloat(props[k]); return Number.isFinite(v) ? v : 0;
    }
  }

  // fallback 0
  return 0;
}

// Normalize all property keys for a coal object to canonical keys (SiO2, Al2O3, etc.)
function normalizeCoalProperties(coal) {
  if (!coal || !coal.properties) return coal;
  const newProps = {};
  for (const [k, v] of Object.entries(coal.properties || {})) {
    // canonical key guess: map aliases or convert to ascii form
    let canon = aliasMap[k] || aliasMap[k.trim()] || null;
    if (!canon) {
      // convert unicode subscripts to digits and then remove weird chars
      const simple = unicodeSubscriptToDigits(k).replace(/\s+/g, '');
      // prefer forms like SiO2, Al2O3, GCV...
      canon = aliasMap[simple] || simple;
    }
    newProps[canon] = v;
  }
  coal.properties = newProps;
  return coal;
}

  // Robust multi-coal support: up to 10 coals
  // Replaces fragile index-based DOM lookups with per-row queries
  let blendCounter = 0;
  const MAX_COALS = 10; // <-- increased to 10

  function populateDropdown(selectElement) {
    selectElement.innerHTML = '<option value="">Select Coal Type</option>';
    if (window.coalData && Array.isArray(window.coalData)) {
      window.coalData.forEach(coal => {
        const opt = document.createElement('option');
        opt.value = coal.id;
        opt.textContent = coal.transportId ? `${coal.coalType} – ${coal.transportId}` : coal.coalType;
        selectElement.appendChild(opt);
      });
    }
  }

  function prefillValues(selectElement) {
    // Operate on the select element passed; find the row and prefill its inputs
    const coalId = selectElement.value;
    const coalInfo = (window.coalData || []).find(c => c.id === coalId);
    if (!coalInfo) return;

    const row = selectElement.closest('.blend');
    if (!row) return;

    const currentRangeInput = row.querySelector('input[data-field="currentrange"]');
    const minRangeInput = row.querySelector('input[data-field="minrange"]');
    const maxRangeInput = row.querySelector('input[data-field="maxrange"]');
    const costInput = row.querySelector('input[data-field="cost"]');

    if (currentRangeInput) currentRangeInput.placeholder = "Current Range (%)";
    if (minRangeInput) minRangeInput.placeholder = "Min Range (%)";
    if (maxRangeInput) maxRangeInput.placeholder = "Max Range (%)";
    if (costInput) costInput.placeholder = "Cost (Rs.)";

    if (currentRangeInput) currentRangeInput.value = coalInfo.defaultCurrentRange || "";
    if (minRangeInput) minRangeInput.value = coalInfo.defaultMinRange || "";
    if (maxRangeInput) maxRangeInput.value = coalInfo.defaultMaxRange || "";
    if (costInput) costInput.value = coalInfo.defaultCost || "";
    updateTotalRange();
  }

  function addBlend() {
    const currentCoals = document.querySelectorAll('.blend').length;
    if (currentCoals >= MAX_COALS) {
      alert(`You can only add up to ${MAX_COALS} coal types.`);
      return;
    }

    const idSuffix = 'b' + (blendCounter++);

    const blendDiv = document.createElement('div');
    blendDiv.className = 'blend';
    blendDiv.dataset.blendid = idSuffix;

    blendDiv.innerHTML = `
      <label for="coal-${idSuffix}">Coal:</label>
      <select id="coal-${idSuffix}" name="coal-${idSuffix}" onchange="prefillValues(this)">
        <option value="">Select Coal Type</option>
      </select>

      <input type="number" id="currentrange-${idSuffix}" data-field="currentrange" placeholder="Current Range (%)" min="0" max="100">
      <input type="number" id="minrange-${idSuffix}" data-field="minrange" placeholder="Min Range (%)" min="0" max="100">
      <input type="number" id="maxrange-${idSuffix}" data-field="maxrange" placeholder="Max Range (%)" min="0" max="100">
      <input type="number" id="cost-${idSuffix}" data-field="cost" placeholder="Cost" min="0">
      <input type="text" id="currency-${idSuffix}" data-field="currency" class="currency-select" pattern="INR|USD|DIR" title="Allowed currencies: INR, USD, DIR"/>

      <button type="button" class="remove-blend-btn" onclick="removeBlend(this)">X</button>
      <button type="button" class="properties-btn" onclick="fetchCoalProperties(this)">Properties</button>
      <div id="properties-${idSuffix}"></div>
    `;

    // Attach event on currentrange input to update global total
    const currentRangeInput = blendDiv.querySelector('input[data-field="currentrange"]');
    if (currentRangeInput) {
      currentRangeInput.addEventListener('input', updateTotalRange);
    }

    const blendRow = document.querySelector('.blend-row');
    blendRow.appendChild(blendDiv);

    // populate the dropdown we just created
    populateDropdown(blendDiv.querySelector('select'));
    updateTotalRange();
  }

  function updateTotalRange() {
    const totalRangeElement = document.getElementById('totalRange');
    if (!totalRangeElement) {
      console.error("Element with ID 'totalRange' not found.");
      return;
    }

    let totalCurrentRange = 0;
    const ranges = document.querySelectorAll('input[data-field="currentrange"]');
    ranges.forEach(input => {
      const v = parseFloat(input.value);
      if (!isNaN(v)) totalCurrentRange += v;
    });

    totalRangeElement.textContent = totalCurrentRange;
  }

  function removeBlend(button) {
    const row = button.closest('.blend');
    if (!row) return;
    row.remove();
    updateTotalRange();
  }

  document.addEventListener('DOMContentLoaded', () => {
fetch('./get_coal_types')
  .then(response => response.json())
  .then(data => {
    // normalize keys for each coal entry so the rest of the app sees consistent keys
    window.coalData = (data.coal_data || []).map(coal => normalizeCoalProperties(coal));
    addBlend(); // existing initialization
  })
  .catch(error => {
    console.error('Error fetching coal types:', error);
    window.coalData = [];
    addBlend();
  });
  });
function fetchCoalProperties(button) {
  // Accept button element; find the select in same row
  const row = button.closest('.blend');
  if (!row) return;

  const select = row.querySelector('select');
  const selectedCoal = select ? select.value : null;
  if (!selectedCoal) {
    alert('Please select a coal type first.');
    return;
  }

  const coalInfoRaw = (window.coalData || []).find(c => c.id === selectedCoal);
  if (!coalInfoRaw) {
    alert('Properties not found.');
    return;
  }

  // Use the global normalizer (do not re-declare alias maps locally)
  // clone the coal object to avoid mutating global state for display
  const coalInfo = JSON.parse(JSON.stringify(coalInfoRaw));
  // ensure properties are normalized for display
  if (!coalInfo.properties || Object.keys(coalInfo.properties).length === 0) {
    // if incoming coal was not normalized earlier, normalize now
    normalizeCoalProperties(coalInfo);
  } else {
    // still run normalization to produce canonical keys for display
    coalInfo.properties = normalizeCoalProperties({ properties: coalInfo.properties }).properties;
  }

  // Build HTML table with normalized keys (pretty-print numeric values)
  let propertiesHTML = `
    <table border="1" style="width:100%; border-collapse: collapse;">
      <thead>
        <tr>
          <th style="padding:8px;border:1px solid lightgray;">Property</th>
          <th style="padding:8px;border:1px solid lightgray;">Value</th>
        </tr>
      </thead>
      <tbody>
  `;

  // show keys sorted (SiO2, Al2O3, Fe2O3, ... then rest) for readability
  const preferredOrder = ['SiO2','Al2O3','Fe2O3','CaO','MgO','Na2O','K2O','TiO2','SO3','P2O5','Mn3O4','S','GCV','Gcv','gcv'];
  const seen = new Set();
  preferredOrder.forEach(k => {
    if (coalInfo.properties && coalInfo.properties[k] !== undefined) {
      const val = coalInfo.properties[k];
      propertiesHTML += `<tr><td style="padding:8px;border:1px solid lightgray;">${k}</td><td style="padding:8px;border:1px solid lightgray;">${Number.isFinite(parseFloat(val)) ? parseFloat(val) : val}</td></tr>`;
      seen.add(k);
    }
  });

  // then list any remaining keys
  for (const [key, value] of Object.entries(coalInfo.properties || {})) {
    if (seen.has(key)) continue;
    propertiesHTML += `
      <tr>
        <td style="padding:8px;border:1px solid lightgray;">${key}</td>
        <td style="padding:8px;border:1px solid lightgray;">${Number.isFinite(parseFloat(value)) ? parseFloat(value) : value}</td>
      </tr>`;
  }

  propertiesHTML += `</tbody></table>`;

  // Inject into modal
  document.getElementById('coalPropertiesContent').innerHTML = propertiesHTML;
  document.getElementById('coalPropertiesModal').style.display = 'block';
}

  function closeModal() {
    document.getElementById('coalPropertiesModal').style.display = 'none';
  }

  window.onclick = function (event) {
    const modal = document.getElementById('coalPropertiesModal');
    if (event.target === modal) modal.style.display = 'none';
  };

//   function optimizeBlend() {
//     const blends = [];

//     // Validate total is 100
//     let totalCurrentRange = 0;
//     document.querySelectorAll('input[data-field="currentrange"]').forEach(inp => {
//       const v = parseFloat(inp.value);
//       if (!isNaN(v)) totalCurrentRange += v;
//     });

//     if (Math.round(totalCurrentRange) !== 100) { // allow minor float imprecision
//       alert('Total percentage must be exactly 100 to proceed!');
//       return;
//     }

//     // Build blends array by inspecting each .blend row
//     const blendRows = Array.from(document.querySelectorAll('.blend'));
//     blendRows.forEach(row => {
//       const selectedId = row.querySelector('select')?.value || '';
//       const min = parseFloat(row.querySelector('input[data-field="minrange"]')?.value) || 0;
//       const max = parseFloat(row.querySelector('input[data-field="maxrange"]')?.value) || 0;
//       const cost = parseFloat(row.querySelector('input[data-field="cost"]')?.value) || 0;
//       const current = parseFloat(row.querySelector('input[data-field="currentrange"]')?.value) || 0;
//       const currency = row.querySelector('input[data-field="currency"]')?.value || 'INR';

//       const coalInfo = (window.coalData || []).find(c => c.id === selectedId);
//       if (!coalInfo) return; // skip rows without a selected coal
//       const resolvedGcv = getPropValue(coalInfo, 'GCV') || getPropValue(coalInfo, 'Gcv') || getPropValue(coalInfo, 'gcv') || null;
//       blends.push({
//         id: selectedId,
//         coal: coalInfo.coalType,
//         current,
//         min,
//         max,
//         cost,
//         currency,

// properties: {
//   SiO2: getPropValue(coalInfo, 'SiO2'),
//   Al2O3: getPropValue(coalInfo, 'Al2O3'),
//   Fe2O3: getPropValue(coalInfo, 'Fe2O3'),
//   CaO: getPropValue(coalInfo, 'CaO'),
//   MgO: getPropValue(coalInfo, 'MgO'),
//   Na2O: getPropValue(coalInfo, 'Na2O'),
//   K2O: getPropValue(coalInfo, 'K2O'),
//   SO3: getPropValue(coalInfo, 'SO3'),
//   TiO2: getPropValue(coalInfo, 'TiO2'),
//   // canonical + server-friendly keys
//   GCV: resolvedGcv,
//   Gcv: resolvedGcv,   // <<--- add this exactly (server reads this)
//   gcv: resolvedGcv
// }



//       });
//     });

//     if (blends.length === 0) {
//       alert('No valid blends found to optimize.');
//       return;
//     }

//     // Hide form & show result container
//     document.getElementById('coalForm').style.display = 'none';
//     document.getElementById('optimization-result').style.display = 'block';

//     fetch('/optimize', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ blends })
//     })
//       .then(res => res.json())
//       .then(data => {
//         displayOptimizationResult(data, blends);
//       })
//       .catch(err => {
//         console.error('Error optimizing blend:', err);
//         alert('Optimization request failed — check console.');
//       });
//   }
function optimizeBlend() {
  // helper: returns Number or null (does NOT coerce blank -> 0 here)
  function parseNumberOrNull(inputEl) {
    if (!inputEl) return null;
    const raw = inputEl.value;
    if (raw === '' || raw === null || raw === undefined) return null;
    const n = parseFloat(String(raw).replace(/,/g, '').trim());
    return Number.isFinite(n) ? n : null;
  }

  const blends = [];

  // Validate total is 100
  let totalCurrentRange = 0;
  document.querySelectorAll('input[data-field="currentrange"]').forEach(inp => {
    const v = parseFloat(inp.value);
    if (!isNaN(v)) totalCurrentRange += v;
  });

  if (Math.round(totalCurrentRange) !== 100) { // allow minor float imprecision
    alert('Total percentage must be exactly 100 to proceed!');
    return;
  }

  // Build blends array by inspecting each .blend row
  const blendRows = Array.from(document.querySelectorAll('.blend'));
  blendRows.forEach(row => {
    const selectedId = row.querySelector('select')?.value || '';
    // robust parsing: return null for blank/invalid, then default to 0 only for numeric fields we want 0
    const min = parseNumberOrNull(row.querySelector('input[data-field="minrange"]')) ?? 0;
    const max = parseNumberOrNull(row.querySelector('input[data-field="maxrange"]')) ?? 0;
    // cost: if user left blank we want cost = 0 for arithmetic, but detect blank explicitly
    const costParsed = parseNumberOrNull(row.querySelector('input[data-field="cost"]'));
    const cost = costParsed ?? 0;
    const current = parseNumberOrNull(row.querySelector('input[data-field="currentrange"]')) ?? 0;
    const currency = row.querySelector('input[data-field="currency"]')?.value || 'INR';

    const coalInfo = (window.coalData || []).find(c => c.id === selectedId);
    if (!coalInfo) return; // skip rows without a selected coal

    // normalize GCV lookup - prefer provided canonical keys if present
    const resolvedGcv = getPropValue(coalInfo, 'GCV') ?? getPropValue(coalInfo, 'Gcv') ?? getPropValue(coalInfo, 'gcv') ?? null;

    blends.push({
      id: selectedId,
      coal: coalInfo.coalType,
      current,
      min,
      max,
      cost,
      currency,
      properties: {
        SiO2: getPropValue(coalInfo, 'SiO2'),
        Al2O3: getPropValue(coalInfo, 'Al2O3'),
        Fe2O3: getPropValue(coalInfo, 'Fe2O3'),
        CaO: getPropValue(coalInfo, 'CaO'),
        MgO: getPropValue(coalInfo, 'MgO'),
        Na2O: getPropValue(coalInfo, 'Na2O'),
        K2O: getPropValue(coalInfo, 'K2O'),
        SO3: getPropValue(coalInfo, 'SO3'),
        TiO2: getPropValue(coalInfo, 'TiO2'),
        // needed so the server can return blended_properties for the
        // slagging/fouling calculator (same properties Combustion Analyzer uses)
        P2O5: getPropValue(coalInfo, 'P2O5'),
        Mn3O4: getPropValue(coalInfo, 'Mn3O4'),
        S: getPropValue(coalInfo, 'S'),
        // canonical + server-friendly keys (server reads Gcv)
        GCV: resolvedGcv,
        Gcv: resolvedGcv,
        gcv: resolvedGcv
      }
    });
  });

  if (blends.length === 0) {
    alert('No valid blends found to optimize.');
    return;
  }

  // Hide form & show result container (keeping your original UI flow)
  const formEl = document.getElementById('coalForm');
  if (formEl) formEl.style.display = 'none';
  const resultEl = document.getElementById('optimization-result');
  if (resultEl) resultEl.style.display = 'block';
  // Free up vertical space: hide the page title block and tighten the
  // content wrapper so the results fit with as little scrolling as possible
  const pageHeaderEl = document.getElementById('pageHeader');
  if (pageHeaderEl) pageHeaderEl.style.display = 'none';
  const contentEl = document.querySelector('.content');
  if (contentEl) contentEl.classList.add('results-active');

  // Show loading overlay while the (potentially slow) optimization runs
  const loadingOverlay = document.getElementById('optimizeLoadingOverlay');
  if (loadingOverlay) loadingOverlay.classList.add('active');
  const calculateBtn = document.getElementById('calculateBtn');
  if (calculateBtn) calculateBtn.disabled = true;

  // Send to server - blends already have numeric cost as 0 if blank
  fetch('./optimize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blends })
  })
    .then(res => res.json())
    .then(data => {
      displayOptimizationResult(data, blends);
    })
    .catch(err => {
      console.error('Error optimizing blend:', err);
      alert('Optimization request failed — check console.');
    })
    .finally(() => {
      if (loadingOverlay) loadingOverlay.classList.remove('active');
      if (calculateBtn) calculateBtn.disabled = false;
    });
}
  function displayOptimizationResult(data, blends) {
    // Data expected: best_aft_blend, cheapest_blend, balanced_blend, current_blend, individual_coal_afts
    const bestAftBlend = data.best_aft_blend || { blend: [], predicted_aft: 0, gcv:0, cost:0 };
    const cheapestBlend = data.cheapest_blend || { blend: [], predicted_aft:0, gcv:0, cost:0 };
    const balancedBlend = data.balanced_blend || { blend: [], predicted_aft:0, gcv:0, cost:0 };
    const currentBlend = data.current_blend || { blend: [], predicted_aft:0, gcv:0, cost:0 };

    // Renders a cost cell showing the value plus a colored (+/-) diff vs the
    // current blend's cost: red + up-arrow when higher, green + down-arrow
    // when lower.
    function renderCostCell(cost, baselineCost) {
      const c = Number(cost) || 0;
      const base = Number(baselineCost) || 0;
      const diff = c - base;
      if (Math.abs(diff) < 0.005) {
        return `<td>${c.toFixed(2)}</td>`;
      }
      const isHigher = diff > 0;
      const color = isHigher ? 'var(--danger)' : 'var(--success)';
      const arrow = isHigher ? '\u25B2' : '\u25BC';
      return `<td>${c.toFixed(2)} <span style="color:${color}; font-weight:700; white-space:nowrap;">(${arrow} ${Math.abs(diff).toFixed(2)})</span></td>`;
    }

    // Build table rows based on the blends array order (client-side blends)
    const headerRow = `
      <div class="table-scroll-wrapper">
      <table>
        <tr>
          <th>Coal type</th>
          <th>Current Blend</th>
          <th>Best Blend</th>
          <th>Best Price Blend</th>
          <th>Balanced Blend</th>
          <th>UoM</th>
        </tr>
        ${blends.map((blend, i) => {
          const bestPct = (bestAftBlend.blend && bestAftBlend.blend[i]) ? bestAftBlend.blend[i] : 0;
          const cheapestPct = (cheapestBlend.blend && cheapestBlend.blend[i]) ? cheapestBlend.blend[i] : 0;
          const balancedPct = (balancedBlend.blend && balancedBlend.blend[i]) ? balancedBlend.blend[i] : 0;
          const currentPct = (currentBlend.blend && currentBlend.blend[i]) ? currentBlend.blend[i] : blend.current;
          return `
            <tr>
              <td>${blend.coal}</td>
              <td>${currentPct}%</td>
              <td>${bestPct}%</td>
              <td>${cheapestPct}%</td>
              <td>${balancedPct}%</td>
              <td>%</td>
            </tr>
          `;
        }).join('')}
        <tr>
          <td>AFT (°C)</td>
          <td>${(currentBlend.predicted_aft || 0).toFixed(2)}</td>
          <td>${(bestAftBlend.predicted_aft || 0).toFixed(2)}</td>
          <td>${(cheapestBlend.predicted_aft || 0).toFixed(2)}</td>
          <td>${(balancedBlend.predicted_aft || 0).toFixed(2)}</td>
          <td>°C</td>
        </tr>
        <tr>
          <td>GCV</td>
          <td>${(currentBlend.gcv || 0).toFixed(2)}</td>
          <td>${(bestAftBlend.gcv || 0).toFixed(2)}</td>
          <td>${(cheapestBlend.gcv || 0).toFixed(2)}</td>
          <td>${(balancedBlend.gcv || 0).toFixed(2)}</td>
          <td>kcal/kg</td>
        </tr>
        <tr>
          <td>Cost</td>
          <td>${(currentBlend.cost || 0).toFixed(2)}</td>
          ${renderCostCell(bestAftBlend.cost, currentBlend.cost)}
          ${renderCostCell(cheapestBlend.cost, currentBlend.cost)}
          ${renderCostCell(balancedBlend.cost, currentBlend.cost)}
          <td>${(blends[0] && blends[0].currency) ? blends[0].currency : 'INR'}</td>
        </tr>
      </table>
      </div>
    `;

    const individualTable = `
      <h3>Individual Coal AFTs</h3>
      <div class="table-scroll-wrapper individual-scroll-wrapper">
      <table class="individual-aft-table">
        <tr><th>Coal Type</th><th>Predicted AFT (°C)</th></tr>
        ${(Array.isArray(data.individual_coal_afts) ? data.individual_coal_afts : []).map(c => `
          <tr><td>${c.coal}</td><td>${(c.predicted_aft || 0).toFixed(2)}</td></tr>
        `).join('')}
      </table>
      </div>
    `;

    document.getElementById('optimization-result').innerHTML = `
      <div class="results-summary">
        <h2 class="results-title">Optimization Summary</h2>
        ${headerRow}
      </div>
      <div class="results-grid">
        <div class="results-card">
          <h3 class="results-card-title">Fusion Temperature Distribution</h3>
          <div id="ternary-plot"></div>
        </div>
        <div class="results-card">
          ${individualTable}
        </div>
      </div>
      <div class="results-actions"><button type="button" class="back-btn" onclick="window.location.reload()">← Back to Blend Setup</button></div>
    `;

    displayScaleBars(data);
    const blendsWithAFT = [
      { label: "Best AFT", blend: bestAftBlend.blend, predicted_aft: bestAftBlend.predicted_aft, coals: blends },
      { label: "Cheapest", blend: cheapestBlend.blend, predicted_aft: cheapestBlend.predicted_aft, coals: blends },
      { label: "Balanced", blend: balancedBlend.blend, predicted_aft: balancedBlend.predicted_aft, coals: blends }
    ];
    updatePlot(blendsWithAFT);
  }

  // Slagging & fouling calculation.
  // This uses EXACTLY the same formulas, thresholds, and scoring logic as
  // slagging_coal_page.html (Combustion Analyzer), minus the operational
  // checkbox score adjustment (which only applies on that page). It consumes
  // the `blended_properties` object returned by /optimize (SiO2, Al2O3,
  // Fe2O3, CaO, MgO, Na2O, K2O, TiO2, SO3, P2O5, Mn3O4, S) plus predicted_aft.
  function calculateSlaggingAndFouling(blend, otherBlends = []) {
    const empty = { slaggingPotential: 0, foulingPotential: 0, finalScore: 0, FSP: 0, FSPD: '-', FFFTS: 0, FFFD: '-' };
    if (!blend) return empty;

    let props = blend.blended_properties;
    if (!props || Object.keys(props).length === 0) {
      // attempt to compute mean of other blends' blended_properties if available
      const valid = (Array.isArray(otherBlends) ? otherBlends : []).filter(ob => ob && ob.blended_properties);
      if (valid.length > 0) {
        const sum = {};
        valid.forEach(ob => {
          Object.entries(ob.blended_properties).forEach(([k, v]) => {
            sum[k] = (sum[k] || 0) + (Number(v) || 0);
          });
        });
        props = {};
        Object.keys(sum).forEach(k => { props[k] = sum[k] / valid.length; });
      } else {
        props = {};
      }
    }

    // Same variable names as slagging_coal_page.html for easy comparison
    const SIO = Number(props.SiO2) || 0;
    const ALO = Number(props.Al2O3) || 0;
    const FEO = Number(props.Fe2O3) || 0;
    const CAO = Number(props.CaO) || 0;
    const MGO = Number(props.MgO) || 0;
    const NAO = Number(props.Na2O) || 0;
    const KO = Number(props.K2O) || 0;
    const TIO = Number(props.TiO2) || 0;
    const SO = Number(props.SO3) || 0;
    const PO = Number(props.P2O5) || 0;
    const MNO = Number(props.Mn3O4) || 0;
    const S = Number(props.S) || 0;
    // predicted AFT (no operational checkbox adjustment on this page)
    const predictedAFT = Number(blend.predicted_aft) || 0;

    // ---- SLAGGING ----

    // T250 test value
    const T250 = Math.sqrt(
      ((((0.00835 * SIO) + (0.00601 * ALO) - 0.109) * 10 ** 7) /
        (2.398 - ((0.0415 * SIO) + (0.0192 * ALO) +
          (0.027 * FEO) + (0.016 * CAO) - 3.92)))) + 150;

    let T250S;
    if (T250 > 1275) T250S = 0;
    else if (T250 < 1200) T250S = 1;
    else T250S = 0.5;

    // Base/Acid Ratio test value
    const BART = (FEO + CAO + MGO + NAO + KO) / (SIO + ALO + TIO);

    // Base/Acid Ratio score
    let BARS;
    if (BART < 0.5) BARS = 0;
    else if (BART > 1) BARS = 1;
    else BARS = 0.5;

    // Hemispherical Temp / Initial Deformation Temp
    const HT = predictedAFT - 78;
    const IDT = predictedAFT - 103;

    // Slagging Factor test value (uses elemental Sulphur S, not SO3)
    const SF = BART * S;

    // Slagging Factor score
    let SFS;
    if (SF < 0.6) SFS = 0;
    else if (SF > 1) SFS = 1;
    else SFS = 0.5;

    // Slagging Index test value
    const SIT = (HT + 4 * IDT) / 5;

    // Slagging Index score
    let SIS;
    if (SIT > 1343) SIS = 0;
    else if (SIT < 1149) SIS = 1;
    else SIS = 0.5;

    // Silica % test value
    const SPT = SIO * 100 / (SIO + FEO + CAO + MGO);

    // Silica % score
    let SPS;
    if (SPT > 82) SPS = 0;
    else if (SPT < 30) SPS = 1;
    else SPS = 0.5;

    // Iron/Calcium ratio test value
    const ICRT = FEO / CAO;

    // Iron/Calcium ratio score
    let ICRS;
    if (ICRT < 0.31) ICRS = 0;
    else if (ICRT > 3) ICRS = 1;
    else ICRS = 0.5;

    // Iron + Calcium test value / score
    const IPCT = FEO + CAO;
    const IPCS = IPCT < 12 ? 0 : 1;

    // Fuel Slagging Potential
    const FSP = Number(T250S) + Number(BARS) + Number(SFS) + Number(SIS) + Number(SPS) + Number(ICRS) + Number(IPCS);
    let FSPD;
    if (FSP < 2) FSPD = "Low";
    else if (FSP > 4) FSPD = "High";
    else FSPD = "Moderate";

    // ---- FOULING ----

    // Sodium in Ash test value / score
    const SIAT = NAO * (46 / 62);
    let SIAS;
    if (SIAT < 1) SIAS = 0;
    else if (SIAT > 5) SIAS = 1;
    else SIAS = 0.5;

    // Total Alkali test value / score
    const TAT = (FEO + CAO + MGO + NAO + KO + MNO + SO + PO);
    const TAS = TAT < 2 ? 0 : 1;

    // Fouling Factor test value / score
    const FFT = BART * SIAT;
    let FFS;
    if (FFT < 0.1) FFS = 0;
    else if (FFT > 0.5) FFS = 1;
    else FFS = 0.5;

    // Fuel Fouling Factor Total Score
    const FFFTS = Number(SIAS) + Number(TAS) + Number(FFS);
    let FFFD;
    if (FFFTS < 1) FFFD = "Low";
    else if (FFFTS > 2) FFFD = "High";
    else FFFD = "Moderate";

    const finalScore = FSP + FFFTS;

    return {
      // kept for backward-compat with the bar-rendering code below (0-10 scale:
      // FSP max = 7, FFFTS max = 3, so FSP + FFFTS naturally fits 0-10)
      slaggingPotential: FSP,
      foulingPotential: FFFTS,
      finalScore,
      FSP, FSPD, FFFTS, FFFD
    };
  }

  function displayScaleBars(data) {
    const tableElement = document.querySelector('#optimization-result table');
    if (!tableElement) return;

    // IMPORTANT: this order must match every other row in the table
    // (Coal type | Current Blend | Best Blend | Best Price Blend | Balanced Blend | UoM).
    // Previously this was [best_aft, cheapest, balanced, current] with no UoM cell,
    // which silently shifted every score one column to the left — e.g. the "Current
    // Blend" column showed the Best AFT blend's slagging/fouling instead of the
    // actual current blend's, making same-coal/same-% comparisons against
    // slagging_coal_page.html look wrong even though the underlying formulas match.
    const blends = [
      data.current_blend,
      data.best_aft_blend,
      data.cheapest_blend,
      data.balanced_blend
    ];

    const row = tableElement.insertRow(-1);
    const labelCell = row.insertCell(0);
    labelCell.textContent = 'Slagging & Fouling';
    labelCell.style.fontWeight = 'bold';
    labelCell.style.textAlign = 'center';

    // For each blend, compute slagging/fouling and render a bar
    blends.forEach((blendObj, idx) => {
      const cell = row.insertCell(-1);
      if (!blendObj) {
        cell.textContent = '-';
        return;
      }
      const { slaggingPotential = 0, foulingPotential = 0, FSPD = '-', FFFD = '-' } = calculateSlaggingAndFouling(blendObj, [data.best_aft_blend, data.cheapest_blend, data.balanced_blend].filter(Boolean));
      const totalScore = slaggingPotential + foulingPotential;

      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.alignItems = 'center';

      const barWrapper = document.createElement('div');
      barWrapper.style.width = '100%';
      barWrapper.style.height = '32px';
      barWrapper.style.border = '1px solid black';
      barWrapper.style.borderRadius = '12px';
      barWrapper.style.position = 'relative';
      barWrapper.style.display = 'flex';
      barWrapper.style.alignItems = 'center';

      const bar = document.createElement('div');
      bar.style.height = '100%';
      const percent = Math.min((totalScore / 10) * 100, 100);
      bar.style.width = percent + '%';
      bar.style.borderRadius = '12px';
      bar.style.backgroundColor = getScaleColor(totalScore);

      const valueDisplay = document.createElement('span');
      valueDisplay.textContent = totalScore.toFixed(2);
      valueDisplay.style.position = 'absolute';
      valueDisplay.style.left = '50%';
      valueDisplay.style.transform = 'translateX(-50%)';
      valueDisplay.style.zIndex = '10';
      valueDisplay.style.backgroundColor = 'rgba(255,255,255,0.7)';
      valueDisplay.style.fontWeight = 'bold';
      valueDisplay.style.userSelect = 'none';

      barWrapper.appendChild(bar);
      barWrapper.appendChild(valueDisplay);
      wrapper.appendChild(barWrapper);

      const caption = document.createElement('span');
      caption.textContent = `Slagging: ${FSPD} · Fouling: ${FFFD}`;
      caption.style.fontSize = '11px';
      caption.style.marginTop = '4px';
      caption.style.color = '#333';
      wrapper.appendChild(caption);

      // Add hover scale
      const scaleContainer = document.createElement('div');
      scaleContainer.style.position = 'relative';
      scaleContainer.style.width = '100%';
      scaleContainer.style.height = '30px';
      scaleContainer.style.marginTop = '8px';
      scaleContainer.style.borderTop = '1px solid black';
      scaleContainer.style.opacity = '0';
      scaleContainer.style.pointerEvents = 'none';
      scaleContainer.style.transition = 'opacity 0.3s ease';

      [0,3,6.5,10].forEach(v => {
        const pos = (v/10)*100;
        const tick = document.createElement('div');
        tick.style.position = 'absolute';
        tick.style.left = pos + '%';
        tick.style.top = '0';
        tick.style.width = '2px';
        tick.style.height = '10px';
        tick.style.backgroundColor = 'black';
        tick.style.transform = 'translateX(-50%)';
        scaleContainer.appendChild(tick);
        const label = document.createElement('span');
        label.textContent = v;
        label.style.position = 'absolute';
        label.style.left = pos + '%';
        label.style.top = '12px';
        label.style.transform = 'translateX(-50%)';
        label.style.fontSize = '12px';
        scaleContainer.appendChild(label);
      });

      wrapper.appendChild(scaleContainer);
      wrapper.addEventListener('mouseenter', () => { scaleContainer.style.opacity = '1'; scaleContainer.style.pointerEvents = 'auto'; });
      wrapper.addEventListener('mouseleave', () => { scaleContainer.style.opacity = '0'; scaleContainer.style.pointerEvents = 'none'; });

      cell.appendChild(wrapper);
    });

    // Trailing UoM cell to match every other row's 6-column layout
    // (Coal type | Current | Best | Best Price | Balanced | UoM).
    const uomCell = row.insertCell(-1);
    uomCell.textContent = 'Score';
    uomCell.style.textAlign = 'center';
  }

  function getScaleColor(value) {
    // Same thresholds/colors as slagging_coal_page.html's getCheckboxBaseColor
    // (pure score-based color, on the same 0-10 total scale)
    if (value < 3) return '#5de65d';
    if (value < 6.5) return '#fddf05';
    return '#e24242';
  }

  function updatePlot(blendsWithAFT) {
    const ternaryPlotElement = document.getElementById('ternary-plot');
    if (!ternaryPlotElement) return;

    const a = [], b = [], c = [], colors = [], labels = [];

    blendsWithAFT.forEach(blend => {
      let acidic = 0, basic = 0, other = 0;
      let totalPercentage = 0;
      if (!Array.isArray(blend.blend)) return;

      blend.blend.forEach((pct, i) => {
        const coal = blend.coals && blend.coals[i];
        const props = coal && coal.properties;
        const weight = Number(pct) || 0;
        totalPercentage += weight;
        if (props) {
          acidic += weight * ((props.SiO2 || 0) + (props.Al2O3 || 0) + (props.TiO2 || 0));
          basic += weight * ((props.CaO || 0) + (props.MgO || 0) + (props.Na2O || 0) + (props.K2O || 0));
          other += weight * ((props.Fe2O3 || 0) + (props.SO3 || 0));
        }
      });

      // Avoid division by zero
      if (totalPercentage === 0) totalPercentage = 1;
      a.push(acidic / totalPercentage);
      b.push(basic / totalPercentage);
      c.push(other / totalPercentage);
      colors.push(blend.predicted_aft || 0);
      labels.push(`${blend.label} - AFT: ${(blend.predicted_aft || 0).toFixed(2)}°C`);
    });

    const data = [{
      type: 'scatterternary',
      mode: 'markers',
      a, b, c,
      marker: { size: 14, color: colors, colorscale: 'Jet', colorbar: { title: "Fusion Temp (°C)" } },
      text: labels,
      hoverinfo: 'text'
    }];

    const layout = {
      autosize: true,
      width: Math.max(ternaryPlotElement.getBoundingClientRect().width || 0, 260),
      height: ternaryPlotElement.getBoundingClientRect().height || 400,
      margin: { l: 40, r: 40, t: 60, b: 50 },
      ternary: {
        sum: 100,
        aaxis: { title: { text: "Thermal Stability", font: { size: 14 } } },
        baxis: { title: { text: "Fusion Accelerator", font: { size: 14 } } },
        caxis: { title: { text: "Hardening Index", font: { size: 14 } } }
      }
    };

    Plotly.newPlot(ternaryPlotElement, data, layout, { responsive: true, displaylogo: false });

    // Ensure the chart re-fits its container on any resize (window resize,
    // orientation change, or the flex/grid container changing size)
    if (!window.__ternaryResizeBound) {
      window.__ternaryResizeBound = true;
      window.addEventListener('resize', () => {
        const el = document.getElementById('ternary-plot');
        if (el) Plotly.Plots.resize(el);
      });
    }
    if (window.ResizeObserver) {
      if (window.__ternaryResizeObserver) {
        window.__ternaryResizeObserver.disconnect();
      }
      window.__ternaryResizeObserver = new ResizeObserver(() => {
        Plotly.Plots.resize(ternaryPlotElement);
      });
      window.__ternaryResizeObserver.observe(ternaryPlotElement);
    }

    // Extra safety: re-fit shortly after render in case the grid/flex
    // container was still settling (e.g. web font swap) when we first
    // measured it above.
    setTimeout(() => { Plotly.Plots.resize(ternaryPlotElement); }, 150);
    setTimeout(() => { Plotly.Plots.resize(ternaryPlotElement); }, 600);
  }

document.getElementById("downloadPDF").addEventListener("click", function () {
  const { jsPDF } = window.jspdf;
  const element = document.body; // capture whole page including navbar

  html2canvas(element, {
    scale: 2,
    useCORS: true,
    onclone: (clonedDoc) => {
      // Helper to get computed style from the cloned document's window if available
      const getCS = el => {
        try {
          return (clonedDoc.defaultView || window).getComputedStyle(el);
        } catch (e) {
          return window.getComputedStyle(el);
        }
      };

      // Replace form controls by visually identical spans so html2canvas renders their values
      const replaceElementWithSpan = (el, displayText) => {
        const cs = getCS(el);
        const rect = el.getBoundingClientRect();

        const span = clonedDoc.createElement('span');
        span.textContent = displayText || '';

        // Preserve box model and text styling to keep layout stable
        span.style.display = (cs.display === 'inline' ? 'inline-block' : cs.display) || 'inline-block';
        span.style.boxSizing = cs.boxSizing || 'border-box';
        // width/height fallback to bounding rect if computed style gives 'auto'
        span.style.width = (cs.width && cs.width !== 'auto') ? cs.width : Math.round(rect.width) + 'px';
        span.style.height = (cs.height && cs.height !== 'auto') ? cs.height : Math.round(rect.height) + 'px';
        span.style.padding = cs.padding;
        span.style.margin = cs.margin;
        span.style.border = cs.border;
        span.style.font = cs.font || (cs.fontSize + ' ' + cs.fontFamily);
        span.style.lineHeight = cs.lineHeight || span.style.height;
        span.style.color = cs.color;
        span.style.background = cs.background;
        span.style.textAlign = cs.textAlign;
        span.style.verticalAlign = cs.verticalAlign;
        span.style.overflow = 'hidden';
        span.style.whiteSpace = 'nowrap';
        span.style.textOverflow = 'ellipsis';

        // Preserve any classes (optional) if styles are in CSS
        // span.className = el.className;

        el.replaceWith(span);
      };

      // Handle inputs and textareas
      const inputs = clonedDoc.querySelectorAll('input, textarea');
      inputs.forEach(clonedEl => {
        // If it's checkbox or radio - show a visible box with a tick when checked
        if (clonedEl.type === 'checkbox' || clonedEl.type === 'radio') {
          const cs = getCS(clonedEl);
          const rect = clonedEl.getBoundingClientRect();
          const box = clonedDoc.createElement('span');

          // size from computed style or bounding rect
          const w = (cs.width && cs.width !== 'auto') ? cs.width : Math.round(rect.width) + 'px';
          const h = (cs.height && cs.height !== 'auto') ? cs.height : Math.round(rect.height) + 'px';

          box.style.display = 'inline-block';
          box.style.width = w;
          box.style.height = h;
          box.style.boxSizing = 'border-box';
          // visual checkbox styling
          box.style.border = cs.border || '1px solid #666';
          box.style.borderRadius = cs.borderRadius || '3px';
          box.style.background = cs.background || 'transparent';
          box.style.verticalAlign = 'middle';
          box.style.textAlign = 'center';
          box.style.lineHeight = h; // center the checkmark
          box.style.fontSize = (parseFloat(cs.fontSize) || Math.round(rect.height * 0.6)) + 'px';
          box.style.color = cs.color || '#000';

          // put a checkmark if checked
          if (clonedEl.checked) {
            box.textContent = '✔'; // you can change to '✓' or custom symbol
          } else {
            box.textContent = '';
          }

          clonedEl.replaceWith(box);
        } else {
          // Regular text inputs and textareas: replace with span showing value
          const value = clonedEl.value || '';
          replaceElementWithSpan(clonedEl, value);
        }
      });

      // Handle select dropdowns
      const selects = clonedDoc.querySelectorAll('select');
      selects.forEach(clonedEl => {
        const sel = clonedEl.options[clonedEl.selectedIndex];
        const selectedText = sel ? sel.text : '';
        replaceElementWithSpan(clonedEl, selectedText);
      });

      // (Optional) hide any UI elements you do not want in PDF in clonedDoc
      // Example: hide the download button inside the cloned document
      const downloadBtn = clonedDoc.querySelector('#downloadPDF');
      if (downloadBtn) downloadBtn.style.display = 'none';
    }
  }).then(canvas => {
    const imgData = canvas.toDataURL("image/png");

    // create a landscape A4 pdf
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save("Slagging_coal_page.pdf");
  }).catch(err => {
    console.error('Error generating PDF:', err);
  });
});


/* ---- next inline <script> block ---- */


/**
 * callConsumeTrial()
 * - Call this when you want to consume a single trial (e.g. on button click).
 * - Requires that the user is logged in (session cookie present).
 * - Expects server to return { trialsLeft, lockedUntil }.
 */
async function callConsumeTrial() {
  try {
    // call the new endpoint - include credentials so server can read session cookie
    const resp = await fetch('./consume-trial', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      // 401 -> not authenticated, 403 -> locked or forbidden
      if (resp.status === 401) {
        alert(data.error || 'Not authenticated. Please login.');
        window.location.href = '/slagging';
        return null;
      }
      if (resp.status === 403 && data.lockedUntil) {
        // account locked
        const lockedUntil = new Date(data.lockedUntil);
        const msLeft = lockedUntil - new Date();
        const hoursLeft = Math.ceil(msLeft / (1000 * 60 * 60));
        alert(`Account locked. Try after ${hoursLeft} hour(s) (until ${lockedUntil.toLocaleString()}).`);
        // Optionally redirect to login page
        window.location.href = '/slagging';
        return data;
      }
      // other errors:
      console.warn('consume-trial error:', data);
      alert(data.error || 'Could not consume trial. See console.');
      return null;
    }

    // Success - update UI if an element exists
    if (typeof data.trialsLeft !== 'undefined') {
      const el = document.getElementById('trialsLeft');
      if (el) el.textContent = String(data.trialsLeft);
    }

    if (data.lockedUntil) {
      // The server locked the account in this response (trials reached zero)
      const lockedUntil = new Date(data.lockedUntil);
      alert('Trials exhausted. Account locked until ' + lockedUntil.toLocaleString());
      // Session destroyed server-side; redirect to login
      window.location.href = '/slagging';
      return data;
    }

    // Return server response for further handling if caller needs it
    return data;
  } catch (err) {
    console.error('callConsumeTrial failed', err);
    alert('Network error while consuming trial.');
    return null;
  }
}


/* ---- next inline <script> block ---- */


/* Common navbar script: sets active button and wiring
   Paste this JS as-is into each page (kept inline for simplicity).
*/
(function(){
  // find nav buttons and add click behavior
  const navBtns = Array.from(document.querySelectorAll('.common-navbar .nav-buttons button'))
    .filter(b => b.dataset && b.dataset.target); // keep element buttons only

  // mark active based on current path or filename
  const path = (location.pathname || '').split('/').pop().toLowerCase();

  let matched = false;
  navBtns.forEach(btn => {
    const target = (btn.dataset.target || '').toLowerCase();
    // button click navigates (keeps behavior same)
    btn.addEventListener('click', () => { if (target) location.href = target; });
    // choose active when filenames match, or if path is empty, match model.html as default
    if ((path && path === target) || (!path && target === 'model.html')) {
      btn.classList.add('active');
      matched = true;
    } else {
      btn.classList.remove('active');
    }
  });

  // If no match found (e.g. URL rewrite), try to match by presence of page-specific id in body
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

  // logout behavior (matches earlier logout functions)
  const logoutBtn = document.getElementById('common-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      try { localStorage.setItem('isLoggedIn','false'); } catch(e) {}
      // preserve existing logout pattern: redirect to login.html
      window.location.href = './login.html';
    });
  }
})();


/* ---- next inline <script> block ---- */


if(localStorage.getItem('isLoggedIn') !== 'true') {
    alert('You must login first!');
    window.location.href = './login.html'; 
} else {
    document.body.style.display = 'block';
}
              function logoutUser() {
  localStorage.setItem('isLoggedIn', 'false'); 
  window.location.href = 'login.html'; 
} 

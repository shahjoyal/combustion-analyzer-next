// src/lib/coalUtils.js
// Ported verbatim from app.js helper functions.

import * as xlsx from 'xlsx';

export function excelSerialToDate(serial) {
  const excelEpoch = new Date(Date.UTC(1900, 0, 1));
  const daysOffset = serial - 1;
  const date = new Date(excelEpoch.getTime() + daysOffset * 24 * 60 * 60 * 1000);
  return date.toISOString().split('T')[0];
}

/**
 * normalizeCoalDoc: converts a DB document (various field-naming variants)
 * into a canonical object expected by frontends.
 */
export function normalizeCoalDoc(raw) {
  if (!raw) return null;
  const o = raw.toObject ? raw.toObject() : Object.assign({}, raw);
  const id = String(o._id || o.id || '');

  const coalName = o.coal || o.name || o['Coal source name'] || o['Coal Source Name'] || '';
  const transportId = o['Transport ID'] || o.transportId || o.transport_id || null;

  const canonicalKeys = [
    'SiO2', 'Al2O3', 'Fe2O3', 'CaO', 'MgO', 'Na2O', 'K2O', 'TiO2', 'SO3', 'P2O5', 'Mn3O4', 'Sulphur (S)', 'GCV',
  ];

  const aliasMap = {
    SiO2: 'SiO2', 'SiO₂': 'SiO2',
    Al2O3: 'Al2O3', 'Al₂O₃': 'Al2O3',
    Fe2O3: 'Fe2O3', 'Fe₂O₃': 'Fe2O3',
    CaO: 'CaO',
    MgO: 'MgO',
    Na2O: 'Na2O',
    K2O: 'K2O',
    TiO2: 'TiO2', 'TiO₂': 'TiO2',
    SO3: 'SO3', 'SO₃': 'SO3',
    P2O5: 'P2O5', 'P₂O₅': 'P2O5',
    Mn3O4: 'Mn3O4', 'Mn₃O₄': 'Mn3O4',
    'Sulphur (S)': 'Sulphur (S)',
    SulphurS: 'Sulphur (S)', Sulphur: 'Sulphur (S)', S: 'Sulphur (S)',
    GCV: 'GCV', Gcv: 'GCV', gcv: 'GCV',
  };

  const properties = {};
  canonicalKeys.forEach((k) => (properties[k] = null));

  function collectFrom(obj) {
    if (!obj) return;
    Object.keys(obj).forEach((k) => {
      const trimmed = String(k).trim();
      let mapped = aliasMap[trimmed] || null;
      if (!mapped) {
        const normalizedKey = trimmed.replace(/₂/g, '2').replace(/₃/g, '3').replace(/₄/g, '4');
        mapped = aliasMap[normalizedKey] || null;
      }
      if (mapped) {
        const val = obj[k];
        properties[mapped] = val === '' || val === null || val === undefined ? null : isNaN(Number(val)) ? val : Number(val);
      }
    });
  }

  collectFrom(o);
  if (o.properties && typeof o.properties === 'object') collectFrom(o.properties);

  if ((properties['GCV'] === null || properties['GCV'] === undefined) && (o.gcv || o.GCV || o.Gcv)) {
    properties['GCV'] = o.gcv || o.GCV || o.Gcv;
  }

  Object.keys(properties).forEach((k) => {
    const v = properties[k];
    if (v !== null && v !== undefined && !isNaN(Number(v))) properties[k] = Number(v);
  });

  const gcvVal = properties['GCV'];

  return {
    _id: o._id,
    id,
    coal: coalName,
    coalType: coalName,
    transportId,
    gcv: gcvVal,
    properties,
  };
}

// IP helper (works with X-Forwarded-For)
export function getClientIp(req) {
  const xff = req.headers.get ? req.headers.get('x-forwarded-for') : req.headers['x-forwarded-for'];
  if (xff) return xff.split(',')[0].trim();
  return null;
}

export function convertExcelToCSV(buffer) {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('No sheets found in Excel workbook');
  }
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const csv = xlsx.utils.sheet_to_csv(sheet);
  const normalized = csv.replace(/\r\n/g, '\n').split('\n').map((r) => r.trimEnd()).join('\n').trim() + '\n';
  return normalized;
}

export function removeCoalNameColumn(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  const coalIndex = headers.findIndex((h) => h.trim().toLowerCase() === 'coalname');
  if (coalIndex === -1) return csvText;

  const newHeaders = headers.filter((_, i) => i !== coalIndex);
  const newLines = [newHeaders.join(',')];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const filtered = cols.filter((_, j) => j !== coalIndex);
    newLines.push(filtered.join(','));
  }
  return newLines.join('\n');
}

export function csvEscape(value) {
  const s = value === undefined || value === null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') {
        out.push(cur);
        cur = '';
      } else cur += ch;
    }
  }
  out.push(cur);
  return out;
}

export function buildTestCsv(testSet) {
  if (!Array.isArray(testSet) || !testSet.length) return '';

  const modelKeys = [...new Set(testSet.flatMap((r) => Object.keys((r && r.predictions) || {})))];

  const headers = ['rowIndex', 'coalName', 'SiO2', 'Al2O3', 'Fe2O3', 'CaO', 'MgO', 'Na2O', 'K2O', 'SO3', 'TiO2', 'actualAFT'];
  modelKeys.forEach((k) => headers.push(`${k}_pred`, `${k}_absErr`));

  let csv = headers.map(csvEscape).join(',') + '\n';

  testSet.forEach((row, idx) => {
    const base = [
      row.rowIndex !== undefined ? row.rowIndex : idx + 1,
      row.coalName || '',
      row.SiO2 ?? '',
      row.Al2O3 ?? '',
      row.Fe2O3 ?? '',
      row.CaO ?? '',
      row.MgO ?? '',
      row.Na2O ?? '',
      row.K2O ?? '',
      row.SO3 ?? '',
      row.TiO2 ?? '',
      row.actualAFT ?? '',
    ];
    modelKeys.forEach((k) => {
      const pred = row.predictions ? row.predictions[k] : undefined;
      if (pred !== undefined && pred !== null && row.actualAFT !== undefined && row.actualAFT !== null) {
        const pn = Number(pred);
        const a = Number(row.actualAFT);
        base.push(Number.isFinite(pn) ? pn.toFixed(2) : '');
        base.push(Number.isFinite(pn) && Number.isFinite(a) ? Math.abs(pn - a).toFixed(2) : '');
      } else {
        base.push('', '');
      }
    });
    csv += base.map(csvEscape).join(',') + '\n';
  });

  return csv;
}

export function parseTestCsv(csvText) {
  const text = String(csvText || '').trim();
  if (!text) return { headers: [], rows: [] };

  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return { headers: [], rows: [] };

  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCsvLine(lines[i]);
    const row = {};
    headers.forEach((h, j) => (row[h] = vals[j] !== undefined ? vals[j] : ''));
    rows.push(row);
  }
  return { headers, rows };
}

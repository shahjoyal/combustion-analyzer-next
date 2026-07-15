import { NextResponse } from 'next/server';
import * as xlsx from 'xlsx';
import { connectToDatabase } from '@/lib/mongodb';
import { getCoalModel } from '@/lib/models';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    await connectToDatabase();
    const Coal = getCoalModel();

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = xlsx.read(buffer, { type: 'buffer' });
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return NextResponse.json({ error: 'No sheets found in workbook' }, { status: 400 });
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

    const allowedCanonicalKeys = [
      'coalId', 'coal',
      'SiO2', 'Al2O3', 'Fe2O3', 'CaO', 'MgO', 'Na2O', 'K2O', 'TiO2',
      'SO3', 'P2O5', 'Mn3O4',
      'Sulphur', 'GCV', 'cost',
    ];

    const headerMap = {
      coal: 'coal',
      coalid: 'coalId', 'coal id': 'coalId', coal_id: 'coalId',
      sio2: 'SiO2', 'si o2': 'SiO2', si02: 'SiO2', 'si o₂': 'SiO2',
      al2o3: 'Al2O3', 'al₂o₃': 'Al2O3',
      fe2o3: 'Fe2O3', 'fe₂o₃': 'Fe2O3',
      cao: 'CaO', mgo: 'MgO',
      na2o: 'Na2O', k2o: 'K2O',
      tio2: 'TiO2', 'tio₂': 'TiO2',
      so3: 'SO3', 'so₃': 'SO3',
      p2o5: 'P2O5', 'p₂o₅': 'P2O5',
      mn3o4: 'Mn3O4', 'mn₃o₄': 'Mn3O4',
      sulphur: 'Sulphur', sulphurs: 'Sulphur', s: 'Sulphur',
      gcv: 'GCV', 'g c v': 'GCV', 'g.c.v.': 'GCV',
      cost: 'cost', price: 'cost', rate: 'cost',
    };

    function normalizeHeaderString(s) {
      if (s === null || s === undefined) return '';
      let t = String(s).trim();
      t = t.replace(/₂/g, '2').replace(/₃/g, '3').replace(/₄/g, '4');
      t = t.toLowerCase().replace(/[()\[\].,/\\\-_]/g, ' ').replace(/\s+/g, ' ').trim();
      return t;
    }

    function canonicalHeader(raw) {
      if (!raw && raw !== 0) return '';
      const normed = normalizeHeaderString(raw);

      if (headerMap.hasOwnProperty(normed)) {
        const mapped = headerMap[normed];
        if (allowedCanonicalKeys.includes(mapped)) return mapped;
        return '';
      }

      const compact = normed.replace(/\s+/g, '');
      const foundKey = Object.keys(headerMap).find((k) => k.replace(/\s+/g, '') === compact);
      if (foundKey) {
        const mapped = headerMap[foundKey];
        if (allowedCanonicalKeys.includes(mapped)) return mapped;
      }

      const directAllowed = allowedCanonicalKeys.find((k) => k.toLowerCase() === String(raw).trim().toLowerCase());
      if (directAllowed) return directAllowed;
      return '';
    }

    let headerRowIndex = -1;
    let rawHeaders = [];

    const testCandidate = (idx) => {
      if (idx < 0 || idx >= rows.length) return false;
      const candidateRow = rows[idx];
      if (!Array.isArray(candidateRow)) return false;
      const canonicalCandidates = candidateRow.map((h) => canonicalHeader(h));
      return canonicalCandidates.includes('coal');
    };

    if (testCandidate(0)) {
      headerRowIndex = 0;
      rawHeaders = rows[0].map((h) => (h === null || h === undefined ? '' : String(h).trim()));
    } else if (testCandidate(1)) {
      headerRowIndex = 1;
      rawHeaders = rows[1].map((h) => (h === null || h === undefined ? '' : String(h).trim()));
    } else {
      return NextResponse.json(
        { error: "Could not find header row in first two rows. Ensure the file's headers are on the 1st or 2nd row and that a 'Coal' column exists." },
        { status: 400 }
      );
    }

    const dataRows = rows.slice(headerRowIndex + 1);
    const canonicalHeaders = rawHeaders.map((h) => canonicalHeader(h));

    const parsed = dataRows
      .map((row) => {
        if (!Array.isArray(row) || row.every((c) => c === null || (typeof c === 'string' && c.trim() === ''))) return null;
        const out = {};
        for (let i = 0; i < canonicalHeaders.length; i++) {
          const key = canonicalHeaders[i];
          if (!key) continue;
          let val = row[i] === undefined ? null : row[i];

          if (val !== null && typeof val !== 'number') {
            const maybeNum = Number(String(val).replace(/,/g, '').trim());
            if (!Number.isNaN(maybeNum)) val = Math.round(maybeNum * 100) / 100;
          }

          if (val === '') val = null;
          out[key] = val;
        }
        if (!out.coal || String(out.coal).trim() === '') return null;
        return out;
      })
      .filter(Boolean);

    if (!parsed.length) {
      return NextResponse.json({ error: 'No valid data rows found after header (check your Excel rows)' }, { status: 400 });
    }

    const docs = parsed.slice();
    if (docs.length) {
      const existingMaxDoc = await Coal.find({ coalId: { $exists: true } }).sort({ coalId: -1 }).limit(1).lean().exec();
      let nextCoalId = 1;
      if (existingMaxDoc && existingMaxDoc.length) {
        const candidate = Number(existingMaxDoc[0].coalId);
        if (Number.isFinite(candidate)) nextCoalId = Math.max(1, Math.floor(candidate) + 1);
      }
      docs.forEach((r) => {
        if (r.coalId === undefined || r.coalId === null || String(r.coalId).trim() === '') {
          r.coalId = String(nextCoalId);
          nextCoalId++;
        } else {
          r.coalId = String(r.coalId).trim();
        }
      });
    }

    const sanitized = docs.map((r) => {
      const o = {};
      Object.keys(r).forEach((k) => {
        if (allowedCanonicalKeys.includes(k)) o[k] = r[k];
      });
      return o;
    });

    const dbFieldMap = {};
    const sampleDoc = await Coal.findOne().lean();
    if (sampleDoc) {
      Object.keys(sampleDoc).forEach((fieldName) => {
        const can = canonicalHeader(fieldName);
        if (can && allowedCanonicalKeys.includes(can)) {
          dbFieldMap[can] = fieldName;
        }
      });
    }

    if (!dbFieldMap['Sulphur']) dbFieldMap['Sulphur'] = 'SulphurS';
    if (!dbFieldMap['GCV']) dbFieldMap['GCV'] = 'gcv';

    allowedCanonicalKeys.forEach((k) => {
      if (!dbFieldMap[k]) dbFieldMap[k] = k;
    });

    const finalDocs = sanitized.map((rowCanonical) => {
      const obj = {};
      Object.keys(rowCanonical).forEach((canKey) => {
        const targetField = dbFieldMap[canKey] || canKey;
        obj[targetField] = rowCanonical[canKey];
      });
      return obj;
    });

    const inserted = await Coal.insertMany(finalDocs, { ordered: false });

    return NextResponse.json({
      message: 'Data uploaded successfully',
      rowsParsed: finalDocs.length,
      rowsInserted: inserted.length,
      fieldMappingPreview: dbFieldMap,
      sampleInserted: inserted.slice(0, 5),
    });
  } catch (err) {
    console.error('Error in upload-excel (strict header handler + DB-mapping):', err);
    return NextResponse.json({ error: 'Failed to process file', details: String(err) }, { status: 500 });
  }
}

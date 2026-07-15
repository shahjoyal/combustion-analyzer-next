import { NextResponse } from 'next/server';
import { calculateAFT, activeModel } from '@/lib/aftEngine';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    const payload = body && (body.values !== undefined ? body.values : body);
    if (!payload) {
      return NextResponse.json(
        { error: 'No input found. Send either an array in `values` or an object with oxide keys.' },
        { status: 400 }
      );
    }

    // canonical training feature order (11 features)
    const featureOrder = ['SiO2', 'Al2O3', 'Fe2O3', 'CaO', 'MgO', 'Na2O', 'K2O', 'SO3', 'TiO2', 'P2O5', 'S'];

    const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

    const buildArrayFromObject = (obj) => {
      const normMap = {};
      Object.keys(obj).forEach((k) => {
        normMap[norm(k)] = obj[k];
      });

      const arr = [];
      const missing = [];
      featureOrder.forEach((f) => {
        const n = norm(f);
        let val = normMap[n];
        if (val === undefined) {
          if (f === 'S') val = normMap['sulphur'] ?? normMap['sulphurs'] ?? normMap['s'];
          if (f === 'P2O5') val = val ?? normMap['p205'];
        }
        if (val === undefined) missing.push(f);
        arr.push(val);
      });

      return { arr, missing };
    };

    let featureArray = null;
    if (Array.isArray(payload)) {
      if (payload.length !== featureOrder.length) {
        return NextResponse.json(
          { error: `Array input must have ${featureOrder.length} values in this order: ${featureOrder.join(', ')}` },
          { status: 400 }
        );
      }
      featureArray = payload.map((v) => Number(v));
    } else if (typeof payload === 'object') {
      const { arr, missing } = buildArrayFromObject(payload);
      if (missing.length) {
        return NextResponse.json(
          {
            error: `Missing features: ${missing.join(', ')}. Acceptable keys include exact names or aliases like 'Sulphur(s)' or 'S' and 'P2O5' or 'p205'.`,
          },
          { status: 400 }
        );
      }
      featureArray = arr.map((v) => Number(v));
    } else {
      return NextResponse.json({ error: 'Unsupported payload format. Send JSON array or object.' }, { status: 400 });
    }

    const notNumber = featureArray.map((v, i) => (isFinite(v) ? null : featureOrder[i])).filter(Boolean);
    if (notNumber.length) {
      return NextResponse.json({ error: `These features are not numeric: ${notNumber.join(', ')}` }, { status: 400 });
    }

    const trainingObj = {};
    featureOrder.forEach((k, i) => (trainingObj[k] = featureArray[i]));

    const storageObj = { ...trainingObj };
    storageObj['Sulphur(s)'] = storageObj['S'];

    const predicted = await calculateAFT(featureArray);
    const method = activeModel && activeModel.type ? activeModel.type : 'base_formula';

    return NextResponse.json(
      {
        prediction: predicted,
        method,
        trainingFeatures: trainingObj,
        coalPropertiesToStore: storageObj,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('/calculate-aft error:', err);
    return NextResponse.json({ error: 'Internal error calculating AFT', details: String(err) }, { status: 500 });
  }
}

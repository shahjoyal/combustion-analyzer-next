import { NextResponse } from 'next/server';
import { calculateAFT } from '@/lib/aftEngine';

export async function POST(req) {
  try {
    const { blends } = await req.json();
    if (!blends || !Array.isArray(blends) || blends.length === 0) {
      return NextResponse.json({ error: 'Invalid blend data' }, { status: 400 });
    }

    // oxide columns order used by calculateAFT (must match the 11-feature
    // training order: SiO2,Al2O3,Fe2O3,CaO,MgO,Na2O,K2O,SO3,TiO2,P2O5,S)
    const oxideCols = ['SiO2', 'Al2O3', 'Fe2O3', 'CaO', 'MgO', 'Na2O', 'K2O', 'SO3', 'TiO2', 'P2O5', 'S'];

    // extra columns needed for slagging/fouling scoring but NOT fed into the AFT model
    const extraPropCols = ['Mn3O4'];
    const allPropCols = oxideCols.concat(extraPropCols);

    const coalNames = blends.map((b) => b.coal || '');
    const oxideValues = blends.map((b) =>
      allPropCols.map((col) => {
        const v = (b.properties && (b.properties[col] ?? b.properties[col.toUpperCase()] ?? b.properties[col.toLowerCase()])) ?? 0;
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      })
    );

    function buildBlendedProperties(weightedVals) {
      const props = {};
      allPropCols.forEach((col, i) => {
        props[col] = weightedVals[i];
      });
      return props;
    }

    const minMaxBounds = blends.map((b) => {
      const min = Number.isFinite(Number(b.min)) ? Number(b.min) : 0;
      const max = Number.isFinite(Number(b.max)) ? Number(b.max) : 100;
      const mm = Math.max(0, Math.min(100, min));
      const mx = Math.max(mm, Math.min(100, max));
      return [Math.round(mm), Math.round(mx)];
    });

    const costsPerTon = blends.map((b) => {
      if (b.cost === null || b.cost === undefined || b.cost === '') return 0;
      const n = Number(String(b.cost).replace(/,/g, '').trim());
      return Number.isFinite(n) ? n : 0;
    });

    const gcvValue = blends.map((b) => {
      const gRaw = b.properties && (b.properties.GCV ?? b.properties.Gcv ?? b.properties.gcv);
      const n = Number(gRaw);
      return Number.isFinite(n) ? n : 0;
    });

    const step = 1;

    function* generateCombinations(bounds, idx = 0, acc = []) {
      if (idx === bounds.length - 1) {
        const sumSoFar = acc.reduce((s, v) => s + v, 0);
        const lastVal = 100 - sumSoFar;
        const [minLast, maxLast] = bounds[idx];
        if (lastVal >= minLast && lastVal <= maxLast) {
          yield [...acc, lastVal];
        }
        return;
      }
      const [min, max] = bounds[idx];
      for (let v = min; v <= max; v += step) {
        const sumSoFar = acc.reduce((s, vv) => s + vv, 0) + v;
        if (sumSoFar > 100) break;
        const remainingMin = bounds.slice(idx + 1).reduce((s, b) => s + b[0], 0);
        const remainingMax = bounds.slice(idx + 1).reduce((s, b) => s + b[1], 0);
        if (sumSoFar + remainingMax < 100) continue;
        if (sumSoFar + remainingMin > 100) continue;
        yield* generateCombinations(bounds, idx + 1, [...acc, v]);
      }
    }

    const candidates = [];
    for (const blend of generateCombinations(minMaxBounds)) {
      const weights = blend.map((x) => x / 100);
      const blendedAll = allPropCols.map((_, oi) => oxideValues.reduce((sum, val, idx) => sum + val[oi] * weights[idx], 0));
      const blendedOxides = blendedAll.slice(0, oxideCols.length);
      const blendedProperties = buildBlendedProperties(blendedAll);
      const totalGcv = blend.reduce((sum, pct, i) => sum + pct * (gcvValue[i] || 0), 0) / 100;
      const totalCost = blend.reduce((sum, pct, i) => sum + pct * (costsPerTon[i] || 0), 0) / 100;

      candidates.push({ blend, blendedOxides, blendedProperties, totalGcv, totalCost });
    }

    // run AFT predictions concurrently in capped batches
    const OPTIMIZE_CONCURRENCY = 20;
    const validBlends = [];
    for (let i = 0; i < candidates.length; i += OPTIMIZE_CONCURRENCY) {
      const batch = candidates.slice(i, i + OPTIMIZE_CONCURRENCY);
      const preds = await Promise.all(batch.map((c) => calculateAFT(c.blendedOxides)));
      batch.forEach((c, j) => {
        validBlends.push({
          blend: c.blend,
          predicted_aft: preds[j],
          cost: c.totalCost,
          gcv: c.totalGcv,
          blended_oxides: c.blendedOxides,
          blended_properties: c.blendedProperties,
        });
      });
    }

    let bestAftBlend = null,
      cheapestBlend = null,
      balancedBlend = null;
    let optimizerWarning = null;

    if (validBlends.length === 0) {
      optimizerWarning = 'No valid optimized blends found within the given min/max ranges — showing current blend only.';
    } else {
      const aftVals = validBlends.map((b) => b.predicted_aft);
      const costVals = validBlends.map((b) => b.cost);

      const aftMin = Math.min(...aftVals);
      const aftMax = Math.max(...aftVals);
      const costMin = Math.min(...costVals);
      const costMax = Math.max(...costVals);

      const blendScores = validBlends.map((b) => {
        const aftNorm = aftMax === aftMin ? 0.5 : (b.predicted_aft - aftMin) / (aftMax - aftMin);
        const costNorm = costMax === costMin ? 0.5 : (costMax - b.cost) / (costMax - costMin);
        return aftNorm + costNorm;
      });

      const indexOfBestAft = aftVals.indexOf(Math.max(...aftVals));
      const indexOfCheapest = costVals.indexOf(Math.min(...costVals));
      const indexOfBalanced = blendScores.indexOf(Math.max(...blendScores));

      bestAftBlend = validBlends[indexOfBestAft];
      cheapestBlend = validBlends[indexOfCheapest];
      balancedBlend = validBlends[indexOfBalanced];
    }

    const currentWeights = blends.map((b) => {
      const n = Number(b.current);
      return Number.isFinite(n) ? n / 100 : 0;
    });

    const currentBlendedAll = allPropCols.map((_, oi) => oxideValues.reduce((sum, val, idx) => sum + val[oi] * (currentWeights[idx] || 0), 0));
    const currentBlendedOxides = currentBlendedAll.slice(0, oxideCols.length);
    const currentBlendedProperties = buildBlendedProperties(currentBlendedAll);
    const currentAFT = await calculateAFT(currentBlendedOxides);
    const currentGCV = blends.reduce((sum, b, i) => sum + (Number(b.current) || 0) * (gcvValue[i] || 0), 0) / 100;
    const currentCost = blends.reduce((sum, b, i) => sum + (Number(b.current) || 0) * (costsPerTon[i] || 0), 0) / 100;
    const currentBlend = {
      blend: blends.map((b) => Number(b.current) || 0),
      predicted_aft: currentAFT,
      gcv: currentGCV,
      cost: currentCost,
      blended_oxides: currentBlendedOxides,
      blended_properties: currentBlendedProperties,
    };

    const individualCoalAFTs = await Promise.all(
      oxideValues.map(async (vals, i) => ({
        coal: coalNames[i] || `coal-${i}`,
        predicted_aft: await calculateAFT(vals),
      }))
    );

    return NextResponse.json({
      best_aft_blend: bestAftBlend,
      cheapest_blend: cheapestBlend,
      balanced_blend: balancedBlend,
      current_blend: currentBlend,
      individual_coal_afts: individualCoalAFTs,
      warning: optimizerWarning,
    });
  } catch (err) {
    console.error('/optimize error', err);
    return NextResponse.json({ error: 'Optimization failed', details: String(err) }, { status: 500 });
  }
}

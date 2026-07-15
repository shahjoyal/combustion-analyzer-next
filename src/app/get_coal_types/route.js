import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getCoalModel } from '@/lib/models';

export async function GET() {
  try {
    await connectToDatabase();
    const Coal = getCoalModel();
    const docs = await Coal.find({}).lean().exec();
    const requiredProps = ['SiO2', 'Al2O3', 'Fe2O3', 'CaO', 'MgO', 'Na2O', 'K2O', 'TiO2', 'SO3', 'P2O5', 'Mn3O4', 'Sulphur (S)', 'GCV'];
    const coalData = docs.map((row) => {
      const id = String(row._id || row.id || '');
      const coalType = row.coal || row.name || row['Coal source name'] || '';
      const coalId = row.coalId || row['Coal ID'] || row['coalId'] || null;
      const transportId = row['Transport ID'] || row.transportId || null;
      const properties = {};
      requiredProps.forEach((prop) => {
        properties[prop] = row[prop] !== undefined ? row[prop] : row[prop.replace('2', '₂')] !== undefined ? row[prop.replace('2', '₂')] : null;
      });
      if (properties['GCV'] === null || properties['GCV'] === undefined) {
        if (row.gcv || row.GCV || row.Gcv) properties['GCV'] = row.gcv || row.GCV || row.Gcv;
      }
      if (properties['Sulphur (S)'] === null || properties['Sulphur (S)'] === undefined) {
        properties['Sulphur (S)'] = row['Sulphur (S)'] || row['SulphurS'] || row['Sulphur'] || row.S || null;
      }
      return { id, coalId, coalType, transportId, properties };
    });
    return NextResponse.json({ coal_data: coalData });
  } catch (error) {
    console.error('/get_coal_types error:', error);
    return NextResponse.json({ error: 'Failed to fetch coal types' }, { status: 500 });
  }
}

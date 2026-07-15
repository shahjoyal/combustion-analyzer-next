import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getCoalModel } from '@/lib/models';

export async function DELETE(req) {
  try {
    await connectToDatabase();
    const Coal = getCoalModel();
    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });

    const objectIds = ids.filter((id) => /^[0-9a-fA-F]{24}$/.test(String(id)));
    const coalIdValues = ids.filter((id) => !/^[0-9a-fA-F]{24}$/.test(String(id)));

    let totalDeleted = 0;
    if (objectIds.length) {
      const r1 = await Coal.deleteMany({ _id: { $in: objectIds } });
      totalDeleted += r1 && r1.deletedCount ? r1.deletedCount : 0;
    }
    if (coalIdValues.length) {
      const r2 = await Coal.deleteMany({ coalId: { $in: coalIdValues } });
      totalDeleted += r2 && r2.deletedCount ? r2.deletedCount : 0;
    }

    if (totalDeleted === 0) return NextResponse.json({ error: 'No data found' }, { status: 404 });
    return NextResponse.json({ message: `${totalDeleted} data deleted successfully` });
  } catch (error) {
    console.error('Error deleting data:', error);
    return NextResponse.json({ error: 'Failed to delete data' }, { status: 500 });
  }
}

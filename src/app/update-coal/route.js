import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { getCoalModel } from '@/lib/models';

export async function PATCH(req) {
  try {
    await connectToDatabase();
    const Coal = getCoalModel();
    const { idType, idValue, updates } = await req.json();
    if (!idType || !idValue || !updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'idType, idValue and updates object required' }, { status: 400 });
    }

    let query = {};
    if (idType === '_id') {
      if (!mongoose.Types.ObjectId.isValid(idValue)) {
        return NextResponse.json({ error: 'Invalid _id' }, { status: 400 });
      }
      query = { _id: new mongoose.Types.ObjectId(idValue) };
    }

    const target = await Coal.findOne(query).lean();
    if (!target) return NextResponse.json({ error: 'Coal not found' }, { status: 404 });

    if (updates.coalId !== undefined && updates.coalId !== null) {
      const newCoalId = String(updates.coalId);
      if (newCoalId !== String(target.coalId)) {
        const conflict = await Coal.findOne({ coalId: newCoalId }).lean();
        if (conflict && String(conflict._id) !== String(target._id)) {
          return NextResponse.json({ error: 'coalId already in use by another document' }, { status: 409 });
        }
      }
    }

    delete updates._id;
    delete updates.__v;

    const setObj = {};
    Object.keys(updates).forEach((k) => {
      setObj[k] = updates[k];
    });

    const updated = await Coal.findOneAndUpdate(query, { $set: setObj }, { new: true }).lean();
    if (!updated) return NextResponse.json({ error: 'Update failed' }, { status: 500 });

    return NextResponse.json({ message: 'updated', updated });
  } catch (err) {
    console.error('/update-coal error', err);
    return NextResponse.json({ error: 'Internal server error', details: String(err) }, { status: 500 });
  }
}

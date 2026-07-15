import { NextResponse } from 'next/server';
import { activeModel } from '@/lib/aftEngine';

export async function GET() {
  return NextResponse.json({
    success: true,
    model: activeModel && activeModel.type ? activeModel.type : 'base_formula',
  });
}

import { withAlerts } from '@/lib/withAlerts';
import { NextResponse } from 'next/server';
import { activeModel } from '@/lib/aftEngine';

async function handleGET() {
  return NextResponse.json({
    success: true,
    model: activeModel && activeModel.type ? activeModel.type : 'base_formula',
  });
}

export const GET = withAlerts('GET /api/get-active-model', handleGET);

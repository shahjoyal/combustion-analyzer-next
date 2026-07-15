import { NextResponse } from 'next/server';
import { compareModelsJobs } from '@/lib/compareJobs';

export async function GET(req, { params }) {
  const { jobId } = await params;
  const job = compareModelsJobs.get(jobId);
  if (!job) return NextResponse.json({ status: 'not_found', message: 'Unknown or expired job id' }, { status: 404 });

  if (job.status === 'running') {
    return NextResponse.json({ status: 'running', progressLog: job.progressLog });
  }
  if (job.status === 'error') {
    return NextResponse.json({ status: 'error', message: job.message, progressLog: job.progressLog });
  }
  return NextResponse.json({ status: 'done', data: job.data });
}

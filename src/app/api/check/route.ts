import { NextResponse } from 'next/server';
import { runMonitoringCycle, getDhakaTime } from '@/worker/scheduler';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dhakaTime = getDhakaTime();
    const result = await runMonitoringCycle();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      dhakaTime,
      result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error executing check';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}

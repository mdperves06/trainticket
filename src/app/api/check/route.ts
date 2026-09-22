import { NextRequest, NextResponse } from 'next/server';
import { executeAlertScan } from '@/worker/pollingWorker';
import { getDhakaTime } from '@/worker/scheduler';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const alertId = searchParams.get('alertId') || undefined;
    const simulateDrop = searchParams.get('simulateDrop') === 'true';

    const dhakaTime = getDhakaTime();
    const result = await executeAlertScan(alertId, { forceDrop: simulateDrop });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      dhakaTime,
      simulateDrop,
      result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error executing check';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}

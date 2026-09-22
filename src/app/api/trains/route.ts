import { NextRequest, NextResponse } from 'next/server';
import { railwayService } from '@/providers/railwayService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const date = searchParams.get('date');

    if (!from || !to || !date) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: from, to, date' },
        { status: 400 }
      );
    }

    const trains = await railwayService.searchTrains(from, to, date);
    return NextResponse.json({ success: true, trains });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to search trains';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

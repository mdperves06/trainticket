import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const alerts = await prisma.alert.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, alerts });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      fromStation,
      toStation,
      journeyDate,
      trainName,
      trainCode,
      seatClass,
      passengerCount,
      preferredCoach,
      requireAdjacent,
      preferWindow,
      avoidSeats,
      telegramChatId,
    } = body;

    if (!fromStation || !toStation || !journeyDate || !seatClass) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: fromStation, toStation, journeyDate, seatClass',
        },
        { status: 400 }
      );
    }

    const alert = await prisma.alert.create({
      data: {
        fromStation: fromStation.trim(),
        toStation: toStation.trim(),
        journeyDate,
        trainName: trainName ? trainName.trim() : null,
        trainCode: trainCode ? trainCode.trim() : null,
        seatClass: seatClass.trim().toUpperCase(),
        passengerCount: Number(passengerCount) || 1,
        preferredCoach: preferredCoach ? preferredCoach.trim().toUpperCase() : null,
        requireAdjacent: Boolean(requireAdjacent),
        preferWindow: Boolean(preferWindow),
        avoidSeats: avoidSeats ? avoidSeats.trim().toUpperCase() : null,
        telegramChatId: telegramChatId ? telegramChatId.trim() : null,
        status: 'SCHEDULED',
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, alert }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create alert';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Alert ID is required' }, { status: 400 });
    }

    await prisma.alert.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Alert deleted' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete alert';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, isActive, status } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Alert ID is required' }, { status: 400 });
    }

    const dataToUpdate: Record<string, unknown> = {};
    if (typeof isActive === 'boolean') dataToUpdate.isActive = isActive;
    if (typeof status === 'string') dataToUpdate.status = status;

    const updated = await prisma.alert.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, alert: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update alert';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

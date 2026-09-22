import prisma from '../lib/db';
import { railwayService, RailwayAvailability } from '../providers/railwayService';
import { evaluateSeatMatch } from '../lib/seatMatcher';
import { sendTelegramNotification } from '../lib/telegramNotifier';

export interface ScanHistoryEntry {
  timestamp: string;
  result: string;
  isSeatFound: boolean;
  score?: number;
}

/**
 * Executes a targeted scan for a specific alert or across all active MONITORING alerts.
 */
export async function executeAlertScan(
  alertId?: string,
  options?: { forceDrop?: boolean }
): Promise<{
  scanned: number;
  seatsFound: number;
  results: { alertId: string; status: string; historyEntry: ScanHistoryEntry }[];
}> {
  const whereClause = alertId
    ? { id: alertId }
    : {
        isActive: true,
        status: 'MONITORING',
      };

  const alertsToScan = await prisma.alert.findMany({ where: whereClause });
  const results: { alertId: string; status: string; historyEntry: ScanHistoryEntry }[] = [];
  let seatsFoundCount = 0;

  for (const alert of alertsToScan) {
    // If alert is paused, skip
    if (alert.status === 'PAUSED' && !alertId) {
      continue;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Dhaka',
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    try {
      const availability = await railwayService.checkAvailability({
        from: alert.fromStation,
        to: alert.toStation,
        date: alert.journeyDate,
        trainName: alert.trainName || undefined,
        trainNumber: alert.trainCode || undefined,
        seatClass: alert.seatClass,
        passengers: alert.passengerCount,
        forceDrop: options?.forceDrop,
      });

      const match = evaluateSeatMatch(
        {
          id: alert.id,
          fromStation: alert.fromStation,
          toStation: alert.toStation,
          journeyDate: alert.journeyDate,
          trainName: alert.trainName,
          trainCode: alert.trainCode,
          seatClass: alert.seatClass,
          passengerCount: alert.passengerCount,
          monitorAllTrains: alert.monitorAllTrains,
          preferredCoach: alert.preferredCoach,
          preferWindow: alert.preferWindow,
          requireAdjacent: alert.requireAdjacent,
          avoidSeats: alert.avoidSeats,
        },
        availability
      );

      // Parse existing scan history (last 5)
      let history: ScanHistoryEntry[] = [];
      try {
        if (alert.scanHistory) {
          history = JSON.parse(alert.scanHistory);
        }
      } catch {
        history = [];
      }

      if (match.isMatch && match.availability) {
        seatsFoundCount++;
        const seatsDesc = (match.availability.seatNumbers || []).join(', ') || `${match.availability.availableSeats} seats`;
        const historyText = `${timeStr} BST — ⚡ SEAT FOUND (${match.availability.availableSeats} seats in ${alert.seatClass}, ${match.availability.coach || 'Coach'}: ${seatsDesc})`;

        const newEntry: ScanHistoryEntry = {
          timestamp: timeStr,
          result: historyText,
          isSeatFound: true,
          score: match.score,
        };

        history = [newEntry, ...history.slice(0, 4)];

        // Update alert to SEAT_FOUND and store match details
        await prisma.alert.update({
          where: { id: alert.id },
          data: {
            status: 'SEAT_FOUND',
            lastCheckedAt: now,
            scanHistory: JSON.stringify(history),
            matchDetails: JSON.stringify(match.availability),
          },
        });

        // Trigger telegram if enabled
        if (alert.enableTelegram && alert.telegramChatId) {
          const candidateSeats = (match.availability.seatNumbers || []).map((sn, idx) => ({
            coach: match.availability!.coach || 'KHA',
            seatNumber: sn,
            isWindow: idx % 2 === 0,
          }));

          await sendTelegramNotification({
            trainName: match.availability.trainName,
            trainCode: match.availability.trainNumber,
            fromStation: alert.fromStation,
            toStation: alert.toStation,
            journeyDate: alert.journeyDate,
            seatClass: alert.seatClass,
            seats: candidateSeats,
            score: match.score,
            telegramChatId: alert.telegramChatId,
          });
        }

        results.push({ alertId: alert.id, status: 'SEAT_FOUND', historyEntry: newEntry });
      } else {
        const historyText = `${timeStr} BST — ✕ No exact matching seat available`;
        const newEntry: ScanHistoryEntry = {
          timestamp: timeStr,
          result: historyText,
          isSeatFound: false,
        };

        history = [newEntry, ...history.slice(0, 4)];

        await prisma.alert.update({
          where: { id: alert.id },
          data: {
            lastCheckedAt: now,
            scanHistory: JSON.stringify(history),
          },
        });

        results.push({ alertId: alert.id, status: alert.status, historyEntry: newEntry });
      }
    } catch (err) {
      console.error(`Error scanning alert ${alert.id}:`, err);
    }
  }

  return {
    scanned: alertsToScan.length,
    seatsFound: seatsFoundCount,
    results,
  };
}

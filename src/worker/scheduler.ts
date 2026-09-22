import prisma from '../lib/db';
import { defaultRailwayProvider } from '../providers/mockRailwayProvider';
import { findBestSeatCombination, CandidateSeat } from '../lib/seatScorer';
import { sendTelegramNotification } from '../lib/telegramNotifier';

/**
 * Checks current time in Asia/Dhaka.
 */
export function getDhakaTime(): { hour: number; minute: number; second: number; isBurstWindow: boolean } {
  const now = new Date();
  const dhakaStr = now.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Dhaka',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const [hour, minute, second] = dhakaStr.split(':').map(Number);

  // Burst window is 07:59:50 BST to 08:05:00 BST
  const isBurstWindow =
    (hour === 7 && minute === 59 && second >= 50) ||
    (hour === 8 && minute < 5);

  return { hour, minute, second, isBurstWindow };
}

/**
 * Executes a single scan cycle across all active alerts.
 */
export async function runMonitoringCycle(): Promise<{
  scanned: number;
  seatsFound: number;
  errors: number;
}> {
  let seatsFoundCount = 0;
  let errorCount = 0;

  try {
    const activeAlerts = await prisma.alert.findMany({
      where: {
        isActive: true,
        status: { in: ['SCHEDULED', 'MONITORING'] },
      },
    });

    if (activeAlerts.length === 0) {
      console.log(`[Scheduler ${new Date().toISOString()}] No active alerts to scan.`);
      return { scanned: 0, seatsFound: 0, errors: 0 };
    }

    console.log(`[Scheduler] Scanning ${activeAlerts.length} active alerts...`);

    for (const alert of activeAlerts) {
      try {
        // Fetch provider availability
        const trains = await defaultRailwayProvider.fetchAvailability(
          alert.fromStation,
          alert.toStation,
          alert.journeyDate
        );

        // Filter train if trainName or trainCode is specified
        const matchingTrains = trains.filter((t) => {
          if (alert.trainName && !t.trainName.toLowerCase().includes(alert.trainName.toLowerCase())) {
            return false;
          }
          if (alert.trainCode && t.trainCode !== alert.trainCode) {
            return false;
          }
          return true;
        });

        let bestMatch: {
          trainName: string;
          trainCode: string;
          seats: CandidateSeat[];
          score: number;
        } | null = null;

        for (const train of matchingTrains) {
          const targetClass = train.classes.find(
            (c) => c.className.toUpperCase() === alert.seatClass.toUpperCase()
          );

          if (!targetClass || targetClass.candidateSeats.length < alert.passengerCount) {
            continue;
          }

          const evaluated = findBestSeatCombination(targetClass.candidateSeats, {
            preferredCoach: alert.preferredCoach,
            preferWindow: alert.preferWindow,
            requireAdjacent: alert.requireAdjacent,
            avoidSeats: alert.avoidSeats,
            passengerCount: alert.passengerCount,
          });

          if (evaluated && (!bestMatch || evaluated.score > bestMatch.score)) {
            bestMatch = {
              trainName: train.trainName,
              trainCode: train.trainCode,
              seats: evaluated.seats,
              score: evaluated.score,
            };
          }
        }

        const now = new Date();

        if (bestMatch) {
          console.log(
            `[Scheduler] 🎯 SEAT FOUND for Alert ${alert.id} (${alert.fromStation}->${alert.toStation})! Train: ${bestMatch.trainName}, Score: ${bestMatch.score}`
          );

          // Update alert status to SEAT_FOUND
          await prisma.alert.update({
            where: { id: alert.id },
            data: {
              status: 'SEAT_FOUND',
              lastCheckedAt: now,
            },
          });

          // Dispatch Telegram alert
          await sendTelegramNotification({
            trainName: bestMatch.trainName,
            trainCode: bestMatch.trainCode,
            fromStation: alert.fromStation,
            toStation: alert.toStation,
            journeyDate: alert.journeyDate,
            seatClass: alert.seatClass,
            seats: bestMatch.seats,
            score: bestMatch.score,
            telegramChatId: alert.telegramChatId,
          });

          seatsFoundCount++;
        } else {
          // Update status to MONITORING if it was SCHEDULED
          await prisma.alert.update({
            where: { id: alert.id },
            data: {
              status: 'MONITORING',
              lastCheckedAt: now,
            },
          });
        }
      } catch (alertErr) {
        console.error(`[Scheduler] Error processing alert ${alert.id}:`, alertErr);
        errorCount++;
      }
    }

    return { scanned: activeAlerts.length, seatsFound: seatsFoundCount, errors: errorCount };
  } catch (err) {
    console.error('[Scheduler] Critical loop error:', err);
    return { scanned: 0, seatsFound: 0, errors: 1 };
  }
}

/**
 * Continuous worker loop with dynamic interval adjustment.
 */
async function startWorker() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🚄 Railway Smart Booking Assistant - Background Worker');
  console.log('  Timezone: Asia/Dhaka (UTC+6)');
  console.log('  8:00 AM BST Burst Polling: 3s interval');
  console.log('  Daytime Cancellation Polling: 60s interval');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  while (true) {
    const { isBurstWindow, hour, minute, second } = getDhakaTime();
    const intervalMs = isBurstWindow ? 3000 : 60000;

    console.log(
      `[Dhaka BST ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(
        second
      ).padStart(2, '0')}] Window: ${isBurstWindow ? '⚡ 8:00 AM BURST' : '⏳ STANDARD'} | Next scan in ${intervalMs / 1000}s`
    );

    await runMonitoringCycle();
    await new Promise((res) => setTimeout(res, intervalMs));
  }
}

if (require.main === module) {
  startWorker().catch((err) => {
    console.error('Fatal worker crash:', err);
    process.exit(1);
  });
}

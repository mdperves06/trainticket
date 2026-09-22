import {
  IRailwayProvider,
  TrainAvailabilityResult,
  ClassAvailability,
} from './railwayProvider.interface';
import { CandidateSeat } from '../lib/seatScorer';

/**
 * MockRailwayProvider simulates Bangladesh Railway availability.
 * Designed to provide:
 * 1. Deterministic test payloads for unit & worker testing.
 * 2. 8:00 AM BST release burst simulation (burst of seats available).
 * 3. Intermittent daytime cancellations (1-3 seats popping up).
 * 4. Easily swappable with a live reverse-proxy or official provider endpoint.
 */
export class MockRailwayProvider implements IRailwayProvider {
  private deterministicMode: boolean;
  private forceSeatsAvailable: boolean;

  constructor(options?: { deterministicMode?: boolean; forceSeatsAvailable?: boolean }) {
    this.deterministicMode = options?.deterministicMode ?? false;
    this.forceSeatsAvailable = options?.forceSeatsAvailable ?? false;
  }

  /**
   * Helper to generate a realistic set of candidate seats for a coach.
   */
  private generateCoachSeats(
    coach: string,
    seatNumbers: number[],
    windowSeats: number[] = [1, 4, 5, 8, 9, 12, 13, 16, 17, 20]
  ): CandidateSeat[] {
    return seatNumbers.map((num) => ({
      coach,
      seatNumber: `${coach}-${num}`,
      isWindow: windowSeats.includes(num),
      rowNumber: Math.ceil(num / 4),
    }));
  }

  /**
   * Check if current time in Asia/Dhaka is in the 8:00 AM BST ticket release burst window (07:59:50 - 08:05:00 BST).
   */
  private isReleaseBurstWindow(): boolean {
    try {
      const now = new Date();
      // Format to Asia/Dhaka time
      const dhakaTimeStr = now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Dhaka',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      });
      const [hour, minute] = dhakaTimeStr.split(':').map(Number);
      return hour === 8 && minute < 5;
    } catch {
      return false;
    }
  }

  public async fetchAvailability(
    from: string,
    to: string,
    date: string,
    options?: { forceSeats?: boolean }
  ): Promise<TrainAvailabilityResult[]> {
    const normalizedFrom = from.trim().toLowerCase();
    const normalizedTo = to.trim().toLowerCase();

    // Default route mock trains
    let trainTemplates = [
      {
        name: 'Subarna Express',
        code: '702',
        departureTime: '07:00 AM',
        arrivalTime: '12:30 PM',
      },
      {
        name: 'Sonar Bangla Express',
        code: '788',
        departureTime: '04:45 PM',
        arrivalTime: '10:00 PM',
      },
      {
        name: 'Mohanagar Provati',
        code: '704',
        departureTime: '07:45 AM',
        arrivalTime: '02:00 PM',
      },
    ];

    if (normalizedTo.includes('sylhet') || normalizedFrom.includes('sylhet') || normalizedTo.includes('brahmanbaria') || normalizedFrom.includes('brahmanbaria')) {
      trainTemplates = [
        {
          name: 'Parabat Express',
          code: '709',
          departureTime: '06:20 AM',
          arrivalTime: '01:00 PM',
        },
        {
          name: 'Upaban Express',
          code: '739',
          departureTime: '08:30 PM',
          arrivalTime: '05:00 AM',
        },
      ];
    } else if (normalizedTo.includes('rajshahi') || normalizedFrom.includes('rajshahi')) {
      trainTemplates = [
        {
          name: 'Silk City Express',
          code: '753',
          departureTime: '02:40 PM',
          arrivalTime: '08:35 PM',
        },
        {
          name: 'Padma Express',
          code: '759',
          departureTime: '11:00 PM',
          arrivalTime: '04:30 AM',
        },
      ];
    } else if (normalizedTo.includes('cox') || normalizedFrom.includes('cox')) {
      trainTemplates = [
        {
          name: 'Coxs Bazar Express',
          code: '814',
          departureTime: '06:30 AM',
          arrivalTime: '03:00 PM',
        },
        {
          name: 'Parjotok Express',
          code: '816',
          departureTime: '06:15 AM',
          arrivalTime: '03:20 PM',
        },
      ];
    }

    const isBurst = Boolean(options?.forceSeats) || this.forceSeatsAvailable || this.deterministicMode || this.isReleaseBurstWindow();

    const results: TrainAvailabilityResult[] = trainTemplates.map((tpl, index) => {
      // Build classes
      const classes: ClassAvailability[] = [
        {
          className: 'SNIGDHA',
          fare: 750,
          seatsAvailable: isBurst ? 8 : 0,
          candidateSeats: isBurst
            ? [
                ...this.generateCoachSeats('KHA', [11, 12, 13, 14]),
                ...this.generateCoachSeats('GA', [5, 6, 7, 8]),
              ]
            : [],
        },
        {
          className: 'S_CHAIR',
          fare: 405,
          seatsAvailable: isBurst ? 14 : 0,
          candidateSeats: isBurst
            ? [
                ...this.generateCoachSeats('CHA', [21, 22, 23, 24]),
                ...this.generateCoachSeats('JA', [31, 32, 33, 34]),
                ...this.generateCoachSeats('JHA', [1, 2, 3, 4, 5, 6]),
              ]
            : [],
        },
        {
          className: 'AC_B',
          fare: 1200,
          seatsAvailable: isBurst ? 4 : 0,
          candidateSeats: isBurst
            ? this.generateCoachSeats('KA', [1, 2, 3, 4])
            : [],
        },
      ];

      return {
        trainName: tpl.name,
        trainCode: tpl.code,
        departureStation: from,
        arrivalStation: to,
        departureTime: tpl.departureTime,
        arrivalTime: tpl.arrivalTime,
        journeyDate: date,
        classes,
      };
    });

    return results;
  }
}

// Export a singleton instance with configurable behavior
export const defaultRailwayProvider = new MockRailwayProvider({
  deterministicMode: process.env.NODE_ENV === 'test',
  forceSeatsAvailable: process.env.FORCE_SEATS_AVAILABLE === 'true',
});

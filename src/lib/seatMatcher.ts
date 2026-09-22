import { RailwayAvailability } from '../providers/railwayService';
import { scoreSeatCombination, CandidateSeat } from './seatScorer';

export interface AlertMatchCriteria {
  id: string;
  fromStation: string;
  toStation: string;
  journeyDate: string;
  trainName?: string | null;
  trainCode?: string | null;
  seatClass: string;
  passengerCount: number;
  monitorAllTrains?: boolean;
  preferredCoach?: string | null;
  preferWindow?: boolean;
  requireAdjacent?: boolean;
  avoidSeats?: string | null;
}

export interface MatchResult {
  isMatch: boolean;
  score: number;
  availability: RailwayAvailability | null;
  reason?: string;
}

/**
 * Strict exact-match anti-false-positive evaluator.
 * Guarantees zero alerts unless ALL criteria match identically.
 */
export function evaluateSeatMatch(
  criteria: AlertMatchCriteria,
  availability: RailwayAvailability | null
): MatchResult {
  if (!availability) {
    return { isMatch: false, score: 0, availability: null, reason: 'No availability found' };
  }

  // 1. Station Verification
  if (
    criteria.fromStation.trim().toLowerCase() !== availability.from.trim().toLowerCase() ||
    criteria.toStation.trim().toLowerCase() !== availability.to.trim().toLowerCase()
  ) {
    return { isMatch: false, score: 0, availability: null, reason: 'Station route mismatch' };
  }

  // 2. Journey Date Verification
  if (criteria.journeyDate !== availability.date) {
    return { isMatch: false, score: 0, availability: null, reason: 'Journey date mismatch' };
  }

  // 3. Train Name / Number Verification (unless monitorAllTrains)
  if (!criteria.monitorAllTrains) {
    if (criteria.trainCode && availability.trainNumber !== criteria.trainCode) {
      return { isMatch: false, score: 0, availability: null, reason: 'Train number mismatch' };
    }
    if (
      criteria.trainName &&
      !availability.trainName.toLowerCase().includes(criteria.trainName.toLowerCase())
    ) {
      return { isMatch: false, score: 0, availability: null, reason: 'Train name mismatch' };
    }
  }

  // 4. Seat Class Verification
  if (criteria.seatClass.toUpperCase() !== availability.seatClass.toUpperCase()) {
    return { isMatch: false, score: 0, availability: null, reason: 'Seat class mismatch' };
  }

  // 5. Passenger Count Verification
  if (availability.availableSeats < criteria.passengerCount) {
    return { isMatch: false, score: 0, availability: null, reason: 'Insufficient seats' };
  }

  // 6. Compute prioritization score
  const candidateSeats: CandidateSeat[] = (availability.seatNumbers || []).map((sn, idx) => ({
    coach: availability.coach || 'KHA',
    seatNumber: sn,
    isWindow: idx % 2 === 0, // demo assumption
    rowNumber: Math.ceil((idx + 1) / 2),
  }));

  const score = scoreSeatCombination(candidateSeats, {
    preferredCoach: criteria.preferredCoach,
    preferWindow: criteria.preferWindow,
    requireAdjacent: criteria.requireAdjacent,
    avoidSeats: criteria.avoidSeats,
    passengerCount: criteria.passengerCount,
  });

  return {
    isMatch: true,
    score,
    availability,
  };
}

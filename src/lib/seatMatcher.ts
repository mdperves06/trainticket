import { RailwayAvailability } from '../providers/railwayService';
import { scoreSeatCombination, CandidateSeat } from './seatScorer';
import { normalizeStation, normalizeClass } from './railwayDatabase';

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
  fingerprint?: string;
}

/**
 * Strict exact-match anti-false-positive evaluator with station & class normalization.
 * Guarantees zero alerts unless criteria matches operating train and available count.
 */
export function evaluateSeatMatch(
  criteria: AlertMatchCriteria,
  availability: RailwayAvailability | null
): MatchResult {
  if (!availability) {
    return { isMatch: false, score: 0, availability: null, reason: 'No availability found' };
  }

  // 1. Station Verification (Normalized)
  if (
    normalizeStation(criteria.fromStation) !== normalizeStation(availability.from) ||
    normalizeStation(criteria.toStation) !== normalizeStation(availability.to)
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
      !availability.trainName.toLowerCase().includes(criteria.trainName.toLowerCase().trim())
    ) {
      return { isMatch: false, score: 0, availability: null, reason: 'Train name mismatch' };
    }
  }

  // 4. Seat Class Verification (Normalized)
  if (normalizeClass(criteria.seatClass) !== normalizeClass(availability.seatClass)) {
    return { isMatch: false, score: 0, availability: null, reason: 'Seat class mismatch' };
  }

  // 5. Passenger Count Verification
  if (availability.availableSeats < criteria.passengerCount) {
    return { isMatch: false, score: 0, availability: null, reason: 'Insufficient seats' };
  }

  // 6. Compute prioritization score (Preferences do NOT reject inventory)
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

  const fingerprint = `${availability.trainNumber}_${normalizeClass(availability.seatClass)}_${
    availability.availableSeats > 0 ? 'AVAILABLE' : 'ZERO'
  }`;

  return {
    isMatch: true,
    score,
    availability,
    fingerprint,
  };
}


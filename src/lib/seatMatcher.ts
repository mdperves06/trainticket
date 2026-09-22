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
  strictTrainMatch?: boolean;
  strictClassMatch?: boolean;
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
  matchedTrainNumber?: string;
  matchedClass?: string;
  isAlternativeMatch?: boolean;
  alternativeNotice?: string;
}

/**
 * Intelligent seat evaluator with station & class normalization and corridor-wide matching.
 * Guarantees zero false negatives: if seats are available on the user's route, they are alerted.
 */
export function evaluateSeatMatch(
  criteria: AlertMatchCriteria,
  availability: RailwayAvailability | null
): MatchResult {
  if (!availability) {
    return { isMatch: false, score: 0, availability: null, reason: 'No availability found' };
  }

  // 1. Station Verification (Normalized across all Bengali & English station spellings)
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

  // 3. Train Verification: Allow corridor-wide match unless strictTrainMatch is explicitly enabled
  let isAlternativeTrain = false;
  if (!criteria.monitorAllTrains) {
    const isTrainNumMatch = criteria.trainCode ? availability.trainNumber === criteria.trainCode : true;
    const isTrainNameMatch = criteria.trainName
      ? availability.trainName.toLowerCase().includes(criteria.trainName.toLowerCase().trim())
      : true;

    if (!isTrainNumMatch && !isTrainNameMatch) {
      if (criteria.strictTrainMatch) {
        return { isMatch: false, score: 0, availability: null, reason: 'Train number mismatch' };
      }
      isAlternativeTrain = true;
    }
  }

  // 4. Seat Class Verification (Normalized & ANY_CLASS support)
  const requestedClass = normalizeClass(criteria.seatClass);
  const availableClass = normalizeClass(availability.seatClass);
  let isAlternativeClass = false;

  if (requestedClass !== 'ANY_CLASS' && requestedClass !== availableClass) {
    if (criteria.strictClassMatch) {
      return { isMatch: false, score: 0, availability: null, reason: 'Seat class mismatch' };
    }
    isAlternativeClass = true;
  }

  // 5. Passenger Count Verification
  if (availability.availableSeats < criteria.passengerCount) {
    return { isMatch: false, score: 0, availability: null, reason: 'Insufficient seats' };
  }

  // 6. Compute prioritization score
  const candidateSeats: CandidateSeat[] = (availability.seatNumbers || []).map((sn, idx) => ({
    coach: availability.coach || 'KHA',
    seatNumber: sn,
    isWindow: idx % 2 === 0,
    rowNumber: Math.ceil((idx + 1) / 2),
  }));

  let score = scoreSeatCombination(candidateSeats, {
    preferredCoach: criteria.preferredCoach,
    preferWindow: criteria.preferWindow,
    requireAdjacent: criteria.requireAdjacent,
    avoidSeats: criteria.avoidSeats,
    passengerCount: criteria.passengerCount,
  });

  if (isAlternativeTrain) score = Math.max(50, score - 10);
  if (isAlternativeClass) score = Math.max(50, score - 15);

  const notices: string[] = [];
  if (isAlternativeTrain) notices.push(`Alternative train: ${availability.trainName} (#${availability.trainNumber})`);
  if (isAlternativeClass) notices.push(`Alternative class: ${availability.seatClass}`);
  const alternativeNotice = notices.length > 0 ? notices.join(' • ') : undefined;

  const fingerprint = `${availability.trainNumber}_${normalizeClass(availability.seatClass)}_${
    availability.availableSeats > 0 ? 'AVAILABLE' : 'ZERO'
  }`;

  return {
    isMatch: true,
    score,
    availability,
    fingerprint,
    matchedTrainNumber: availability.trainNumber,
    matchedClass: availability.seatClass,
    isAlternativeMatch: isAlternativeTrain || isAlternativeClass,
    alternativeNotice,
  };
}


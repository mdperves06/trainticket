export interface CandidateSeat {
  coach: string;
  seatNumber: string;
  isWindow: boolean;
  rowNumber?: number;
}

export interface SeatPreferences {
  preferredCoach?: string | null;
  preferWindow?: boolean;
  requireAdjacent?: boolean;
  avoidSeats?: string | string[] | null;
  passengerCount?: number;
}

/**
 * Parses avoidSeats into a normalized set of strings (e.g. "KA-12", "12", etc.)
 */
function parseAvoidSeats(avoidSeats?: string | string[] | null): Set<string> {
  const set = new Set<string>();
  if (!avoidSeats) return set;

  if (Array.isArray(avoidSeats)) {
    avoidSeats.forEach((s) => set.add(s.trim().toUpperCase()));
    return set;
  }

  avoidSeats
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .forEach((s) => set.add(s));

  return set;
}

/**
 * Extracts numerical row or sequence number from seat number if rowNumber is omitted
 * e.g. "KA-12" -> 12, "B3" -> 3, "24" -> 24
 */
function extractSeatIndex(seat: CandidateSeat): number {
  if (typeof seat.rowNumber === 'number') {
    return seat.rowNumber;
  }
  const match = seat.seatNumber.match(/\d+/);
  return match ? parseInt(match[0], 10) : NaN;
}

/**
 * Determines whether the given seats are adjacent (same coach and sequential row numbers)
 */
export function areSeatsAdjacent(seats: CandidateSeat[]): boolean {
  if (seats.length <= 1) return true;

  const firstCoach = seats[0].coach.toUpperCase();
  const allSameCoach = seats.every((s) => s.coach.toUpperCase() === firstCoach);
  if (!allSameCoach) return false;

  const indices = seats.map(extractSeatIndex);
  if (indices.some(isNaN)) return false;

  const sorted = [...indices].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] !== sorted[i - 1] + 1) {
      return false;
    }
  }

  return true;
}

/**
 * Scores a combination of candidate seats against user preferences.
 * 
 * Rule matrix:
 * - All seats in same coach: +50 points
 * - Matches specified preferredCoach: +30 points
 * - Window seats: +25 points per window seat
 * - Contains any seat from avoidSeats: -100 penalty
 * - Adjacent check (same coach + sequential row sequence): +100 points
 */
export function scoreSeatCombination(
  seats: CandidateSeat[],
  preferences: SeatPreferences
): number {
  if (!seats || seats.length === 0) return 0;

  let score = 0;
  const avoidSet = parseAvoidSeats(preferences.avoidSeats);

  // 1. All seats in same coach (+50)
  const firstCoach = seats[0].coach.trim().toUpperCase();
  const allInSameCoach = seats.every(
    (s) => s.coach.trim().toUpperCase() === firstCoach
  );
  if (allInSameCoach) {
    score += 50;
  }

  // 2. Matches specified preferredCoach (+30)
  if (preferences.preferredCoach) {
    const prefCoach = preferences.preferredCoach.trim().toUpperCase();
    const matchesPreferred = seats.every(
      (s) => s.coach.trim().toUpperCase() === prefCoach
    );
    if (matchesPreferred) {
      score += 30;
    }
  }

  // 3. Window seats: +25 points per window seat
  const windowCount = seats.filter((s) => s.isWindow).length;
  score += windowCount * 25;

  // 4. Contains any seat from avoidSeats: -100 penalty
  const hasAvoidedSeat = seats.some((s) => {
    const fullKey = `${s.coach.trim()}-${s.seatNumber.trim()}`.toUpperCase();
    const seatOnly = s.seatNumber.trim().toUpperCase();
    return avoidSet.has(fullKey) || avoidSet.has(seatOnly);
  });
  if (hasAvoidedSeat) {
    score -= 100;
  }

  // 5. Adjacent check (same coach + sequential row sequence): +100 points
  if (seats.length > 1 && areSeatsAdjacent(seats)) {
    score += 100;
  } else if (seats.length === 1) {
    // Single seat is inherently adjacent to itself
    score += 100;
  }

  return score;
}

/**
 * Finds the highest-scoring combination of seats for the given passenger count.
 */
export function findBestSeatCombination(
  availableSeats: CandidateSeat[],
  preferences: SeatPreferences
): { seats: CandidateSeat[]; score: number } | null {
  const count = preferences.passengerCount || 1;
  if (availableSeats.length < count) return null;

  // If preferences strictly require adjacent, filter for combinations that satisfy adjacency
  const combinations: CandidateSeat[][] = [];

  function generateCombinations(start: number, current: CandidateSeat[]) {
    if (current.length === count) {
      combinations.push([...current]);
      return;
    }
    for (let i = start; i < availableSeats.length; i++) {
      current.push(availableSeats[i]);
      generateCombinations(i + 1, current);
      current.pop();
    }
  }

  // Group by coach first for performance if count > 1
  const coachGroups: { [coach: string]: CandidateSeat[] } = {};
  for (const seat of availableSeats) {
    if (!coachGroups[seat.coach]) coachGroups[seat.coach] = [];
    coachGroups[seat.coach].push(seat);
  }

  let candidatesToEvaluate: CandidateSeat[][] = [];

  // Prioritize evaluating seats within the same coach
  for (const coach of Object.keys(coachGroups)) {
    const seatsInCoach = coachGroups[coach];
    if (seatsInCoach.length >= count) {
      const coachCombos: CandidateSeat[][] = [];
      const genCoach = (start: number, cur: CandidateSeat[]) => {
        if (cur.length === count) {
          coachCombos.push([...cur]);
          return;
        }
        for (let i = start; i < seatsInCoach.length; i++) {
          cur.push(seatsInCoach[i]);
          genCoach(i + 1, cur);
          cur.pop();
        }
      };
      genCoach(0, []);
      candidatesToEvaluate.push(...coachCombos);
    }
  }

  // If no same-coach combinations found and adjacency is not strictly required, generate cross-coach combos
  if (candidatesToEvaluate.length === 0 && !preferences.requireAdjacent) {
    generateCombinations(0, []);
    candidatesToEvaluate = combinations;
  }

  if (candidatesToEvaluate.length === 0) return null;

  let bestSeats: CandidateSeat[] | null = null;
  let bestScore = -Infinity;

  for (const combo of candidatesToEvaluate) {
    if (preferences.requireAdjacent && !areSeatsAdjacent(combo)) {
      continue;
    }

    const score = scoreSeatCombination(combo, preferences);
    if (score > bestScore) {
      bestScore = score;
      bestSeats = combo;
    }
  }

  if (!bestSeats) return null;

  return {
    seats: bestSeats,
    score: bestScore,
  };
}

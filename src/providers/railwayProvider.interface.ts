import { CandidateSeat } from '../lib/seatScorer';

export interface ClassAvailability {
  className: string; // e.g. "AC_B", "SNIGDHA", "S_CHAIR", "SHOVAN"
  fare: number;
  seatsAvailable: number;
  candidateSeats: CandidateSeat[];
}

export interface TrainAvailabilityResult {
  trainName: string;
  trainCode: string;
  departureStation: string;
  arrivalStation: string;
  departureTime: string; // e.g. "07:00 AM"
  arrivalTime: string;   // e.g. "12:30 PM"
  journeyDate: string;   // YYYY-MM-DD
  classes: ClassAvailability[];
}

export interface IRailwayProvider {
  /**
   * Fetches real-time or simulated train availability between two stations on a given date.
   */
  fetchAvailability(
    from: string,
    to: string,
    date: string
  ): Promise<TrainAvailabilityResult[]>;
}

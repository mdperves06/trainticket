export interface RouteFare {
  from: string;
  to: string;
  shovonChair: number;
  snigdha: number;
  acBerth: number;
}

export const STATION_FARES: RouteFare[] = [
  { from: "Sylhet", to: "Dhaka", shovonChair: 405, snigdha: 777, acBerth: 1196 },
  { from: "Brahmanbaria", to: "Dhaka", shovonChair: 185, snigdha: 355, acBerth: 545 },
  { from: "Sylhet", to: "Khulna", shovonChair: 620, snigdha: 1190, acBerth: 1785 },
  { from: "Dhaka", to: "Chittagong", shovonChair: 405, snigdha: 777, acBerth: 1196 },
  { from: "Dhaka", to: "Rajshahi", shovonChair: 375, snigdha: 720, acBerth: 1080 },
  { from: "Dhaka", to: "Coxs Bazar", shovonChair: 695, snigdha: 1325, acBerth: 1985 },
  { from: "Dhaka", to: "Khulna", shovonChair: 505, snigdha: 966, acBerth: 1450 },
  { from: "Dhaka", to: "Rangpur", shovonChair: 505, snigdha: 966, acBerth: 1450 },
  { from: "Dhaka", to: "Mymensingh", shovonChair: 150, snigdha: 290, acBerth: 435 },
  { from: "Dhaka", to: "Bogra", shovonChair: 395, snigdha: 760, acBerth: 1140 },
  { from: "Dhaka", to: "Cumilla", shovonChair: 210, snigdha: 405, acBerth: 610 },
  { from: "Dhaka", to: "Sreemangal", shovonChair: 265, snigdha: 510, acBerth: 765 },
  { from: "Chittagong", to: "Sylhet", shovonChair: 420, snigdha: 805, acBerth: 1240 },
  { from: "Chittagong", to: "Coxs Bazar", shovonChair: 250, snigdha: 470, acBerth: 710 },
];

/**
 * Calculates estimated Bangladesh Railway fare based on origin, destination, and seat class.
 * Case-insensitive and bidirectional.
 */
export function getFareForRoute(from: string, to: string, seatClass: string): number {
  if (!from || !to) return 350;

  const normalizedFrom = from.trim().toLowerCase();
  const normalizedTo = to.trim().toLowerCase();

  const match = STATION_FARES.find(
    r => (r.from.toLowerCase() === normalizedFrom && r.to.toLowerCase() === normalizedTo) ||
         (r.from.toLowerCase() === normalizedTo && r.to.toLowerCase() === normalizedFrom)
  );

  const normalizedClass = seatClass.trim().toUpperCase();

  if (match) {
    if (normalizedClass === "SNIGDHA") return match.snigdha;
    if (normalizedClass === "AC_BERTH" || normalizedClass === "AC_B") return match.acBerth;
    return match.shovonChair;
  }

  // Dynamic fallback based on station string distance / default base rates
  const baseRate = 350;
  if (normalizedClass === "SNIGDHA") return Math.round(baseRate * 1.9);
  if (normalizedClass === "AC_BERTH" || normalizedClass === "AC_B") return Math.round(baseRate * 2.85);
  return baseRate;
}

export interface TrainSchedule {
  trainNumber: string;
  trainName: string;
  fromStation: string;
  toStation: string;
  departureTime: string;
  arrivalTime: string;
  offDay: string; // e.g. "Monday", "None"
  classes: string[]; // ["S_CHAIR", "SNIGDHA", "AC_B", "F_BERTH"]
  fares: Record<string, number>;
}

export interface OperatingTrain extends TrainSchedule {
  isOffDay: boolean;
  dayOfWeek: string;
  duration: string;
}

export const BANGLADESH_TRAIN_DATABASE: TrainSchedule[] = [
  // --- CHATTOGRAM -> DHAKA ---
  {
    trainNumber: '702',
    trainName: 'Subarna Express',
    fromStation: 'CHITTAGONG',
    toStation: 'DHAKA',
    departureTime: '07:00 AM',
    arrivalTime: '12:15 PM',
    offDay: 'Monday',
    classes: ['S_CHAIR', 'SNIGDHA'],
    fares: { S_CHAIR: 405, SNIGDHA: 777 },
  },
  {
    trainNumber: '704',
    trainName: 'Mahanagar Provati',
    fromStation: 'CHITTAGONG',
    toStation: 'DHAKA',
    departureTime: '12:30 PM',
    arrivalTime: '06:10 PM',
    offDay: 'None',
    classes: ['S_CHAIR', 'SNIGDHA', 'AC_B'],
    fares: { S_CHAIR: 345, SNIGDHA: 656, AC_B: 1196 },
  },
  {
    trainNumber: '722',
    trainName: 'Mahanagar Express',
    fromStation: 'CHITTAGONG',
    toStation: 'DHAKA',
    departureTime: '01:15 PM',
    arrivalTime: '07:10 PM',
    offDay: 'Sunday',
    classes: ['S_CHAIR', 'SNIGDHA'],
    fares: { S_CHAIR: 345, SNIGDHA: 656 },
  },
  {
    trainNumber: '742',
    trainName: 'Turna Express',
    fromStation: 'CHITTAGONG',
    toStation: 'DHAKA',
    departureTime: '11:30 PM',
    arrivalTime: '05:15 AM',
    offDay: 'None',
    classes: ['S_CHAIR', 'SNIGDHA', 'AC_B', 'F_BERTH'],
    fares: { S_CHAIR: 405, SNIGDHA: 777, AC_B: 1196, F_BERTH: 545 },
  },
  {
    trainNumber: '788',
    trainName: 'Sonar Bangla Express',
    fromStation: 'CHITTAGONG',
    toStation: 'DHAKA',
    departureTime: '04:45 PM',
    arrivalTime: '10:00 PM',
    offDay: 'Wednesday',
    classes: ['S_CHAIR', 'SNIGDHA', 'AC_B'],
    fares: { S_CHAIR: 405, SNIGDHA: 777, AC_B: 1196 },
  },
  {
    trainNumber: '68',
    trainName: 'Chattala Express',
    fromStation: 'CHITTAGONG',
    toStation: 'DHAKA',
    departureTime: '06:00 AM',
    arrivalTime: '12:50 PM',
    offDay: 'Friday',
    classes: ['SHOVON', 'S_CHAIR'],
    fares: { SHOVON: 210, S_CHAIR: 345 },
  },

  // --- DHAKA -> CHATTOGRAM ---
  {
    trainNumber: '701',
    trainName: 'Subarna Express',
    fromStation: 'DHAKA',
    toStation: 'CHITTAGONG',
    departureTime: '04:30 PM',
    arrivalTime: '09:50 PM',
    offDay: 'Monday',
    classes: ['S_CHAIR', 'SNIGDHA'],
    fares: { S_CHAIR: 405, SNIGDHA: 777 },
  },
  {
    trainNumber: '703',
    trainName: 'Mahanagar Provati',
    fromStation: 'DHAKA',
    toStation: 'CHITTAGONG',
    departureTime: '07:45 AM',
    arrivalTime: '02:00 PM',
    offDay: 'None',
    classes: ['S_CHAIR', 'SNIGDHA', 'AC_B'],
    fares: { S_CHAIR: 345, SNIGDHA: 656, AC_B: 1196 },
  },
  {
    trainNumber: '721',
    trainName: 'Mahanagar Express',
    fromStation: 'DHAKA',
    toStation: 'CHITTAGONG',
    departureTime: '09:10 PM',
    arrivalTime: '03:30 AM',
    offDay: 'Sunday',
    classes: ['S_CHAIR', 'SNIGDHA'],
    fares: { S_CHAIR: 345, SNIGDHA: 656 },
  },
  {
    trainNumber: '741',
    trainName: 'Turna Express',
    fromStation: 'DHAKA',
    toStation: 'CHITTAGONG',
    departureTime: '11:30 PM',
    arrivalTime: '05:15 AM',
    offDay: 'None',
    classes: ['S_CHAIR', 'SNIGDHA', 'AC_B', 'F_BERTH'],
    fares: { S_CHAIR: 405, SNIGDHA: 777, AC_B: 1196, F_BERTH: 545 },
  },
  {
    trainNumber: '787',
    trainName: 'Sonar Bangla Express',
    fromStation: 'DHAKA',
    toStation: 'CHITTAGONG',
    departureTime: '07:00 AM',
    arrivalTime: '12:15 PM',
    offDay: 'Wednesday',
    classes: ['S_CHAIR', 'SNIGDHA', 'AC_B'],
    fares: { S_CHAIR: 405, SNIGDHA: 777, AC_B: 1196 },
  },
  {
    trainNumber: '67',
    trainName: 'Chattala Express',
    fromStation: 'DHAKA',
    toStation: 'CHITTAGONG',
    departureTime: '01:45 PM',
    arrivalTime: '08:30 PM',
    offDay: 'Friday',
    classes: ['SHOVON', 'S_CHAIR'],
    fares: { SHOVON: 210, S_CHAIR: 345 },
  },

  // --- SYLHET <-> DHAKA ---
  {
    trainNumber: '709',
    trainName: 'Parabat Express',
    fromStation: 'DHAKA',
    toStation: 'SYLHET',
    departureTime: '06:20 AM',
    arrivalTime: '01:00 PM',
    offDay: 'Tuesday',
    classes: ['S_CHAIR', 'SNIGDHA', 'AC_B'],
    fares: { S_CHAIR: 395, SNIGDHA: 755, AC_B: 1162 },
  },
  {
    trainNumber: '710',
    trainName: 'Parabat Express',
    fromStation: 'SYLHET',
    toStation: 'DHAKA',
    departureTime: '03:45 PM',
    arrivalTime: '10:20 PM',
    offDay: 'Tuesday',
    classes: ['S_CHAIR', 'SNIGDHA', 'AC_B'],
    fares: { S_CHAIR: 395, SNIGDHA: 755, AC_B: 1162 },
  },
  {
    trainNumber: '717',
    trainName: 'Jayantika Express',
    fromStation: 'DHAKA',
    toStation: 'SYLHET',
    departureTime: '11:15 AM',
    arrivalTime: '06:30 PM',
    offDay: 'Thursday',
    classes: ['S_CHAIR', 'SNIGDHA'],
    fares: { S_CHAIR: 395, SNIGDHA: 755 },
  },
  {
    trainNumber: '718',
    trainName: 'Jayantika Express',
    fromStation: 'SYLHET',
    toStation: 'DHAKA',
    departureTime: '09:20 AM',
    arrivalTime: '04:30 PM',
    offDay: 'None',
    classes: ['S_CHAIR', 'SNIGDHA'],
    fares: { S_CHAIR: 395, SNIGDHA: 755 },
  },
  {
    trainNumber: '739',
    trainName: 'Upaban Express',
    fromStation: 'DHAKA',
    toStation: 'SYLHET',
    departureTime: '08:30 PM',
    arrivalTime: '04:30 AM',
    offDay: 'Wednesday',
    classes: ['S_CHAIR', 'SNIGDHA', 'AC_B'],
    fares: { S_CHAIR: 395, SNIGDHA: 755, AC_B: 1162 },
  },
  {
    trainNumber: '740',
    trainName: 'Upaban Express',
    fromStation: 'SYLHET',
    toStation: 'DHAKA',
    departureTime: '11:30 PM',
    arrivalTime: '06:45 AM',
    offDay: 'Wednesday',
    classes: ['S_CHAIR', 'SNIGDHA', 'AC_B'],
    fares: { S_CHAIR: 395, SNIGDHA: 755, AC_B: 1162 },
  },
  {
    trainNumber: '773',
    trainName: 'Kalni Express',
    fromStation: 'DHAKA',
    toStation: 'SYLHET',
    departureTime: '03:00 PM',
    arrivalTime: '09:30 PM',
    offDay: 'Friday',
    classes: ['S_CHAIR', 'SNIGDHA'],
    fares: { S_CHAIR: 395, SNIGDHA: 755 },
  },
  {
    trainNumber: '774',
    trainName: 'Kalni Express',
    fromStation: 'SYLHET',
    toStation: 'DHAKA',
    departureTime: '06:45 AM',
    arrivalTime: '01:00 PM',
    offDay: 'Friday',
    classes: ['S_CHAIR', 'SNIGDHA'],
    fares: { S_CHAIR: 395, SNIGDHA: 755 },
  },

  // --- DHAKA <-> RAJSHAHI ---
  {
    trainNumber: '753',
    trainName: 'Silk City Express',
    fromStation: 'DHAKA',
    toStation: 'RAJSHAHI',
    departureTime: '02:40 PM',
    arrivalTime: '08:35 PM',
    offDay: 'Sunday',
    classes: ['S_CHAIR', 'SNIGDHA', 'AC_B'],
    fares: { S_CHAIR: 375, SNIGDHA: 720, AC_B: 1080 },
  },
  {
    trainNumber: '754',
    trainName: 'Silk City Express',
    fromStation: 'RAJSHAHI',
    toStation: 'DHAKA',
    departureTime: '07:40 AM',
    arrivalTime: '01:30 PM',
    offDay: 'Sunday',
    classes: ['S_CHAIR', 'SNIGDHA', 'AC_B'],
    fares: { S_CHAIR: 375, SNIGDHA: 720, AC_B: 1080 },
  },
  {
    trainNumber: '759',
    trainName: 'Padma Express',
    fromStation: 'DHAKA',
    toStation: 'RAJSHAHI',
    departureTime: '11:00 PM',
    arrivalTime: '04:30 AM',
    offDay: 'Tuesday',
    classes: ['S_CHAIR', 'SNIGDHA'],
    fares: { S_CHAIR: 375, SNIGDHA: 720 },
  },
  {
    trainNumber: '760',
    trainName: 'Padma Express',
    fromStation: 'RAJSHAHI',
    toStation: 'DHAKA',
    departureTime: '04:00 PM',
    arrivalTime: '09:45 PM',
    offDay: 'Tuesday',
    classes: ['S_CHAIR', 'SNIGDHA'],
    fares: { S_CHAIR: 375, SNIGDHA: 720 },
  },
  {
    trainNumber: '769',
    trainName: 'Dhumketu Express',
    fromStation: 'DHAKA',
    toStation: 'RAJSHAHI',
    departureTime: '06:00 AM',
    arrivalTime: '11:40 AM',
    offDay: 'Thursday',
    classes: ['S_CHAIR', 'SNIGDHA', 'AC_B'],
    fares: { S_CHAIR: 375, SNIGDHA: 720, AC_B: 1080 },
  },
  {
    trainNumber: '770',
    trainName: 'Dhumketu Express',
    fromStation: 'RAJSHAHI',
    toStation: 'DHAKA',
    departureTime: '11:20 PM',
    arrivalTime: '04:55 AM',
    offDay: 'Wednesday',
    classes: ['S_CHAIR', 'SNIGDHA', 'AC_B'],
    fares: { S_CHAIR: 375, SNIGDHA: 720, AC_B: 1080 },
  },
  {
    trainNumber: '791',
    trainName: 'Banalata Express',
    fromStation: 'DHAKA',
    toStation: 'RAJSHAHI',
    departureTime: '01:30 PM',
    arrivalTime: '06:00 PM',
    offDay: 'Friday',
    classes: ['S_CHAIR', 'SNIGDHA', 'AC_B'],
    fares: { S_CHAIR: 425, SNIGDHA: 810, AC_B: 1215 },
  },
  {
    trainNumber: '792',
    trainName: 'Banalata Express',
    fromStation: 'RAJSHAHI',
    toStation: 'DHAKA',
    departureTime: '07:00 AM',
    arrivalTime: '11:30 AM',
    offDay: 'Friday',
    classes: ['S_CHAIR', 'SNIGDHA', 'AC_B'],
    fares: { S_CHAIR: 425, SNIGDHA: 810, AC_B: 1215 },
  },

  // --- DHAKA <-> COXS BAZAR ---
  {
    trainNumber: '814',
    trainName: 'Coxs Bazar Express',
    fromStation: 'DHAKA',
    toStation: 'COXS BAZAR',
    departureTime: '10:30 PM',
    arrivalTime: '06:40 AM',
    offDay: 'Monday',
    classes: ['S_CHAIR', 'SNIGDHA', 'AC_B'],
    fares: { S_CHAIR: 695, SNIGDHA: 1325, AC_B: 1985 },
  },
  {
    trainNumber: '813',
    trainName: 'Coxs Bazar Express',
    fromStation: 'COXS BAZAR',
    toStation: 'DHAKA',
    departureTime: '12:30 PM',
    arrivalTime: '09:10 PM',
    offDay: 'Monday',
    classes: ['S_CHAIR', 'SNIGDHA', 'AC_B'],
    fares: { S_CHAIR: 695, SNIGDHA: 1325, AC_B: 1985 },
  },
  {
    trainNumber: '816',
    trainName: 'Parjotok Express',
    fromStation: 'DHAKA',
    toStation: 'COXS BAZAR',
    departureTime: '06:15 AM',
    arrivalTime: '03:00 PM',
    offDay: 'Sunday',
    classes: ['S_CHAIR', 'SNIGDHA', 'AC_B'],
    fares: { S_CHAIR: 695, SNIGDHA: 1325, AC_B: 1985 },
  },
  {
    trainNumber: '815',
    trainName: 'Parjotok Express',
    fromStation: 'COXS BAZAR',
    toStation: 'DHAKA',
    departureTime: '08:00 PM',
    arrivalTime: '04:30 AM',
    offDay: 'Sunday',
    classes: ['S_CHAIR', 'SNIGDHA', 'AC_B'],
    fares: { S_CHAIR: 695, SNIGDHA: 1325, AC_B: 1985 },
  },

  // --- DHAKA <-> KHULNA ---
  {
    trainNumber: '725',
    trainName: 'Sundarban Express',
    fromStation: 'KHULNA',
    toStation: 'DHAKA',
    departureTime: '10:15 PM',
    arrivalTime: '05:10 AM',
    offDay: 'Tuesday',
    classes: ['S_CHAIR', 'SNIGDHA', 'AC_B'],
    fares: { S_CHAIR: 505, SNIGDHA: 966, AC_B: 1450 },
  },
  {
    trainNumber: '726',
    trainName: 'Sundarban Express',
    fromStation: 'DHAKA',
    toStation: 'KHULNA',
    departureTime: '08:15 AM',
    arrivalTime: '03:50 PM',
    offDay: 'Wednesday',
    classes: ['S_CHAIR', 'SNIGDHA', 'AC_B'],
    fares: { S_CHAIR: 505, SNIGDHA: 966, AC_B: 1450 },
  },
  {
    trainNumber: '763',
    trainName: 'Chitra Express',
    fromStation: 'KHULNA',
    toStation: 'DHAKA',
    departureTime: '09:00 AM',
    arrivalTime: '05:30 PM',
    offDay: 'Monday',
    classes: ['S_CHAIR', 'SNIGDHA', 'AC_B'],
    fares: { S_CHAIR: 505, SNIGDHA: 966, AC_B: 1450 },
  },
  {
    trainNumber: '764',
    trainName: 'Chitra Express',
    fromStation: 'DHAKA',
    toStation: 'KHULNA',
    departureTime: '07:00 PM',
    arrivalTime: '03:40 AM',
    offDay: 'Monday',
    classes: ['S_CHAIR', 'SNIGDHA', 'AC_B'],
    fares: { S_CHAIR: 505, SNIGDHA: 966, AC_B: 1450 },
  },
];

/**
 * Normalizes station names so Chittagong, Chattogram, Ctg all map to CHITTAGONG.
 */
export function normalizeStation(name: string): string {
  if (!name) return '';
  const clean = name.trim().toUpperCase();
  if (clean.includes('CHITTAGONG') || clean.includes('CHATTOGRAM') || clean === 'CTG') {
    return 'CHITTAGONG';
  }
  if (clean.includes('DHAKA') || clean.includes('DAKA') || clean.includes('KAMALAPUR')) {
    return 'DHAKA';
  }
  if (clean.includes('COX') || clean.includes('COXS BAZAR') || clean.includes('COXSBAZAR')) {
    return 'COXS BAZAR';
  }
  if (clean.includes('SYLHET')) return 'SYLHET';
  if (clean.includes('RAJSHAHI')) return 'RAJSHAHI';
  if (clean.includes('KHULNA')) return 'KHULNA';
  if (clean.includes('BRAHMANBARIA') || clean.includes('B.BARIA')) return 'BRAHMANBARIA';
  if (clean.includes('SREEMANGAL') || clean.includes('SRIMANGAL')) return 'SREEMANGAL';
  if (clean.includes('CUMILLA') || clean.includes('COMILLA')) return 'CUMILLA';
  return clean;
}

/**
 * Normalizes seat class codes.
 */
export function normalizeClass(cls: string): string {
  if (!cls) return 'S_CHAIR';
  const clean = cls.trim().toUpperCase().replace(/[\s-]/g, '_');
  if (clean.includes('SHOVAN') || clean.includes('S_CHAIR')) return 'S_CHAIR';
  if (clean.includes('SNIGDHA')) return 'SNIGDHA';
  if (clean.includes('BERTH') || clean.includes('CABIN') || clean.includes('AC_B')) return 'AC_B';
  if (clean.includes('F_BERTH')) return 'F_BERTH';
  return clean;
}

/**
 * Calculates day of the week in Asia/Dhaka time for a YYYY-MM-DD string.
 */
export function getDayOfWeekInDhaka(dateString: string): string {
  try {
    // Parse YYYY-MM-DD in UTC+6
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    return date.toLocaleDateString('en-US', { timeZone: 'Asia/Dhaka', weekday: 'long' });
  } catch {
    return 'Monday';
  }
}

/**
 * Calculates duration between two 12-hour times (e.g. 07:00 AM to 12:15 PM)
 */
export function calculateDuration(dep: string, arr: string): string {
  try {
    const parseTime = (t: string) => {
      const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return 0;
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const isPM = match[3].toUpperCase() === 'PM';
      if (isPM && h !== 12) h += 12;
      if (!isPM && h === 12) h = 0;
      return h * 60 + m;
    };

    let depMins = parseTime(dep);
    let arrMins = parseTime(arr);
    if (arrMins < depMins) arrMins += 24 * 60; // Next day arrival

    const diff = arrMins - depMins;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hours}h ${mins > 0 ? `${mins}m` : '00m'}`;
  } catch {
    return '5h 30m';
  }
}

/**
 * Returns EVERY SINGLE train operating on that corridor for the given date.
 */
export function getTrainsForRoute(from: string, to: string, dateString: string): OperatingTrain[] {
  const normFrom = normalizeStation(from);
  const normTo = normalizeStation(to);
  const dayOfWeek = getDayOfWeekInDhaka(dateString);

  // Exact matching direction
  let matching = BANGLADESH_TRAIN_DATABASE.filter(
    (t) => normalizeStation(t.fromStation) === normFrom && normalizeStation(t.toStation) === normTo
  );

  // Intermediate station support (e.g. Brahmanbaria or Sreemangal on Dhaka-Sylhet/Chittagong lines)
  if (matching.length === 0) {
    if (normFrom === 'BRAHMANBARIA' || normTo === 'BRAHMANBARIA') {
      const other = normFrom === 'BRAHMANBARIA' ? normTo : normFrom;
      if (other === 'DHAKA') {
        // Dhaka-Chittagong and Dhaka-Sylhet trains pass Brahmanbaria
        matching = BANGLADESH_TRAIN_DATABASE.filter(
          (t) =>
            (normalizeStation(t.fromStation) === 'CHITTAGONG' && normalizeStation(t.toStation) === 'DHAKA') ||
            (normalizeStation(t.fromStation) === 'SYLHET' && normalizeStation(t.toStation) === 'DHAKA')
        );
      }
    }
  }

  // Fallback: if user specified reversed route or generic corridor
  if (matching.length === 0) {
    matching = BANGLADESH_TRAIN_DATABASE.filter(
      (t) =>
        (normalizeStation(t.fromStation) === normFrom && normalizeStation(t.toStation) === normTo) ||
        (normalizeStation(t.fromStation) === normTo && normalizeStation(t.toStation) === normFrom)
    );
  }

  return matching.map((t) => {
    const isOffDay = t.offDay.trim().toLowerCase() === dayOfWeek.trim().toLowerCase();
    const duration = calculateDuration(t.departureTime, t.arrivalTime);
    return {
      ...t,
      isOffDay,
      dayOfWeek,
      duration,
    };
  });
}

export interface TrainInfo {
  trainName: string;
  trainNumber: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  classes: string[];
}

export interface RailwayAvailability {
  trainName: string;
  trainNumber: string;
  from: string;
  to: string;
  date: string;
  seatClass: string;
  availableSeats: number;
  coach?: string;
  seatNumbers?: string[];
  isDemoData: boolean;
}

export interface IRailwayService {
  searchTrains(from: string, to: string, date: string): Promise<TrainInfo[]>;
  checkAvailability(params: {
    from: string;
    to: string;
    date: string;
    trainName?: string;
    trainNumber?: string;
    seatClass: string;
    passengers: number;
    forceDrop?: boolean;
  }): Promise<RailwayAvailability | null>;
}

/**
 * Route-based train database for Bangladesh Railway
 */
const ROUTE_TRAINS: {
  [routeKey: string]: TrainInfo[];
} = {
  // Sylhet - Dhaka (and Brahmanbaria intermediate)
  'dhaka-sylhet': [
    {
      trainName: 'Parabat Express',
      trainNumber: '701',
      departureTime: '06:20 AM',
      arrivalTime: '01:00 PM',
      duration: '6h 40m',
      classes: ['S_CHAIR', 'SNIGDHA', 'AC_BERTH'],
    },
    {
      trainName: 'Jayantika Express',
      trainNumber: '713',
      departureTime: '11:15 AM',
      arrivalTime: '06:30 PM',
      duration: '7h 15m',
      classes: ['S_CHAIR', 'SNIGDHA', 'AC_BERTH'],
    },
    {
      trainName: 'Kalni Express',
      trainNumber: '773',
      departureTime: '03:00 PM',
      arrivalTime: '09:30 PM',
      duration: '6h 30m',
      classes: ['S_CHAIR', 'SNIGDHA'],
    },
    {
      trainName: 'Upaban Express',
      trainNumber: '739',
      departureTime: '08:30 PM',
      arrivalTime: '05:00 AM',
      duration: '8h 30m',
      classes: ['S_CHAIR', 'SNIGDHA', 'AC_BERTH'],
    },
  ],

  // Chittagong - Dhaka
  'chittagong-dhaka': [
    {
      trainName: 'Subarna Express',
      trainNumber: '702',
      departureTime: '07:00 AM',
      arrivalTime: '12:30 PM',
      duration: '5h 30m',
      classes: ['S_CHAIR', 'SNIGDHA'],
    },
    {
      trainName: 'Mohanagar Provati',
      trainNumber: '704',
      departureTime: '07:45 AM',
      arrivalTime: '02:00 PM',
      duration: '6h 15m',
      classes: ['S_CHAIR', 'SNIGDHA', 'AC_BERTH'],
    },
    {
      trainName: 'Sonar Bangla Express',
      trainNumber: '788',
      departureTime: '04:45 PM',
      arrivalTime: '10:00 PM',
      duration: '5h 15m',
      classes: ['S_CHAIR', 'SNIGDHA', 'AC_BERTH'],
    },
    {
      trainName: 'Turna Express',
      trainNumber: '742',
      departureTime: '11:00 PM',
      arrivalTime: '05:15 AM',
      duration: '6h 15m',
      classes: ['S_CHAIR', 'SNIGDHA', 'AC_BERTH'],
    },
  ],

  // Rajshahi - Dhaka
  'dhaka-rajshahi': [
    {
      trainName: 'Silk City Express',
      trainNumber: '753',
      departureTime: '02:40 PM',
      arrivalTime: '08:35 PM',
      duration: '5h 55m',
      classes: ['S_CHAIR', 'SNIGDHA', 'AC_BERTH'],
    },
    {
      trainName: 'Padma Express',
      trainNumber: '759',
      departureTime: '11:00 PM',
      arrivalTime: '04:30 AM',
      duration: '5h 30m',
      classes: ['S_CHAIR', 'SNIGDHA'],
    },
    {
      trainName: 'Dhumketu Express',
      trainNumber: '769',
      departureTime: '06:00 AM',
      arrivalTime: '11:40 AM',
      duration: '5h 40m',
      classes: ['S_CHAIR', 'SNIGDHA', 'AC_BERTH'],
    },
  ],

  // Cox's Bazar - Dhaka
  'coxs bazar-dhaka': [
    {
      trainName: 'Coxs Bazar Express',
      trainNumber: '814',
      departureTime: '06:30 AM',
      arrivalTime: '03:00 PM',
      duration: '8h 30m',
      classes: ['S_CHAIR', 'SNIGDHA', 'AC_BERTH'],
    },
    {
      trainName: 'Parjotok Express',
      trainNumber: '816',
      departureTime: '06:15 AM',
      arrivalTime: '03:20 PM',
      duration: '9h 05m',
      classes: ['S_CHAIR', 'SNIGDHA', 'AC_BERTH'],
    },
  ],

  // Khulna - Dhaka
  'dhaka-khulna': [
    {
      trainName: 'Sundarban Express',
      trainNumber: '725',
      departureTime: '08:15 AM',
      arrivalTime: '03:50 PM',
      duration: '7h 35m',
      classes: ['S_CHAIR', 'SNIGDHA', 'AC_BERTH'],
    },
    {
      trainName: 'Chitra Express',
      trainNumber: '763',
      departureTime: '07:00 PM',
      arrivalTime: '03:40 AM',
      duration: '8h 40m',
      classes: ['S_CHAIR', 'SNIGDHA', 'AC_BERTH'],
    },
  ],
};

/**
 * Standard Railway Service implementation with explicit demo data tagging
 */
export class RailwayService implements IRailwayService {
  private getRouteKey(from: string, to: string): string {
    const f = from.trim().toLowerCase();
    const t = to.trim().toLowerCase();

    // Direct match
    const key1 = `${f}-${t}`;
    const key2 = `${t}-${f}`;

    if (ROUTE_TRAINS[key1]) return key1;
    if (ROUTE_TRAINS[key2]) return key2;

    // Intermediate route matching (e.g. Brahmanbaria is on the Dhaka-Sylhet and Dhaka-Chittagong line)
    if (f.includes('brahmanbaria') || t.includes('brahmanbaria')) {
      return 'dhaka-sylhet';
    }
    if (f.includes('sreemangal') || t.includes('sreemangal')) {
      return 'dhaka-sylhet';
    }
    if (f.includes('cumilla') || t.includes('cumilla')) {
      return 'chittagong-dhaka';
    }

    return 'dhaka-sylhet'; // Default fallback route
  }

  public async searchTrains(from: string, to: string, date: string): Promise<TrainInfo[]> {
    const key = this.getRouteKey(from, to);
    const trains = ROUTE_TRAINS[key] || ROUTE_TRAINS['dhaka-sylhet'];
    return trains;
  }

  public async checkAvailability(params: {
    from: string;
    to: string;
    date: string;
    trainName?: string;
    trainNumber?: string;
    seatClass: string;
    passengers: number;
    forceDrop?: boolean;
  }): Promise<RailwayAvailability | null> {
    const trains = await this.searchTrains(params.from, params.to, params.date);

    // Target train matching
    let targetTrain: TrainInfo | undefined;
    if (params.trainNumber) {
      targetTrain = trains.find(t => t.trainNumber === params.trainNumber);
    } else if (params.trainName) {
      targetTrain = trains.find(t =>
        t.trainName.toLowerCase().includes(params.trainName!.toLowerCase())
      );
    } else {
      // Monitor all trains: pick first available train that supports requested class
      targetTrain = trains.find(t => t.classes.includes(params.seatClass.toUpperCase()));
    }

    if (!targetTrain) {
      return null;
    }

    // Strict Class Verification
    if (!targetTrain.classes.includes(params.seatClass.toUpperCase())) {
      return null;
    }

    // Check if 8:00 AM BST ticket release burst or forced drop
    const now = new Date();
    const dhakaStr = now.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Dhaka',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const [hour, minute, second] = dhakaStr.split(':').map(Number);
    const isBurstWindow = (hour === 7 && minute === 59 && second >= 50) || (hour === 8 && minute < 5);

    if (params.forceDrop || isBurstWindow) {
      return {
        trainName: targetTrain.trainName,
        trainNumber: targetTrain.trainNumber,
        from: params.from,
        to: params.to,
        date: params.date,
        seatClass: params.seatClass.toUpperCase(),
        availableSeats: Math.max(params.passengers, 4),
        coach: 'KHA',
        seatNumbers: ['KHA-12', 'KHA-13', 'KHA-14'].slice(0, params.passengers),
        isDemoData: true,
      };
    }

    // Outside release window without forceDrop: 0 seats available
    return null;
  }
}

export const railwayService = new RailwayService();

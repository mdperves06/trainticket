import {
  getTrainsForRoute,
  normalizeStation,
  normalizeClass,
  calculateDuration,
  getDayOfWeekInDhaka,
} from '../src/lib/railwayDatabase';
import { railwayService } from '../src/providers/railwayService';
import { evaluateSeatMatch } from '../src/lib/seatMatcher';
import {
  generateDeepSearchUrl,
  generateAutoFillBookmarklet,
} from '../src/lib/bookmarkletGenerator';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n=== RUNNING RAILASSISTANT V2.2 & V2.3 SUITE TESTS ===\n');

  // Test 1: Day of week calculation in Asia/Dhaka time
  console.log('[Test 1] Asia/Dhaka Timezone & Day of Week Calculation:');
  const day1 = getDayOfWeekInDhaka('2026-10-02'); // 2026-10-02 is a Friday
  assert(day1 === 'Friday', `2026-10-02 correctly resolves to Friday in Dhaka (got: ${day1})`);

  // Test 2: Station Normalization (Chittagong, Chattogram, Ctg -> CHITTAGONG, Cox's Bazar with apostrophe)
  console.log('\n[Test 2] Station Normalization:');
  assert(normalizeStation('chittagong') === 'CHITTAGONG', 'normalizeStation("chittagong") -> CHITTAGONG');
  assert(normalizeStation('Chattogram') === 'CHITTAGONG', 'normalizeStation("Chattogram") -> CHITTAGONG');
  assert(normalizeStation('CTG') === 'CHITTAGONG', 'normalizeStation("CTG") -> CHITTAGONG');
  assert(normalizeStation('Dhaka Kamalapur') === 'DHAKA', 'normalizeStation("Dhaka Kamalapur") -> DHAKA');
  assert(normalizeStation('Coxs Bazar') === "Cox's Bazar", 'normalizeStation("Coxs Bazar") -> Cox\'s Bazar');
  assert(normalizeStation("Cox's Bazar") === "Cox's Bazar", 'normalizeStation("Cox\'s Bazar") -> Cox\'s Bazar');
  assert(normalizeStation('Brahmanbaria') === 'BRAHMANBARIA', 'normalizeStation("Brahmanbaria") -> BRAHMANBARIA');

  // Test 3: Class Normalization
  console.log('\n[Test 3] Seat Class Normalization:');
  assert(normalizeClass('shovan chair') === 'S_CHAIR', 'normalizeClass("shovan chair") -> S_CHAIR');
  assert(normalizeClass('s-chair') === 'S_CHAIR', 'normalizeClass("s-chair") -> S_CHAIR');
  assert(normalizeClass('snigdha') === 'SNIGDHA', 'normalizeClass("snigdha") -> SNIGDHA');
  assert(normalizeClass('AC_BERTH') === 'AC_B', 'normalizeClass("AC_BERTH") -> AC_B');
  assert(normalizeClass('ANY_CLASS') === 'ANY_CLASS', 'normalizeClass("ANY_CLASS") -> ANY_CLASS');
  assert(normalizeClass('any') === 'ANY_CLASS', 'normalizeClass("any") -> ANY_CLASS');

  // Test 4: Full Train Inventory on Chattogram -> Dhaka Corridor
  console.log('\n[Test 4] Full Train Inventory & Off-Day Detection:');
  const ctgTrains = getTrainsForRoute('Chattogram', 'Dhaka', '2026-10-02'); // Friday
  assert(ctgTrains.length === 6, `Chattogram -> Dhaka returns ALL 6 operating trains (got: ${ctgTrains.length})`);

  const trainNames = ctgTrains.map((t) => t.trainName);
  assert(trainNames.includes('Subarna Express'), 'Includes Subarna Express (702)');
  assert(trainNames.includes('Mahanagar Provati'), 'Includes Mahanagar Provati (704)');
  assert(trainNames.includes('Mahanagar Express'), 'Includes Mahanagar Express (722)');
  assert(trainNames.includes('Turna Express'), 'Includes Turna Express (742)');
  assert(trainNames.includes('Sonar Bangla Express'), 'Includes Sonar Bangla Express (788)');
  assert(trainNames.includes('Chattala Express'), 'Includes Chattala Express (68)');

  // Verify Chattala Express is flagged as OFF-DAY on Friday
  const chattala = ctgTrains.find((t) => t.trainNumber === '68');
  assert(Boolean(chattala?.isOffDay), 'Chattala Express is correctly flagged as ⛔ OFF-DAY on Friday');
  assert(chattala?.offDay === 'Friday', 'Chattala Express off-day is Friday');

  // Verify Subarna Express is NOT off-day on Friday (off-day is Monday)
  const subarna = ctgTrains.find((t) => t.trainNumber === '702');
  assert(!subarna?.isOffDay, 'Subarna Express is NOT off-day on Friday');

  // Test 5: Journey Duration Calculation
  console.log('\n[Test 5] Duration Calculation:');
  const dur = calculateDuration('07:00 AM', '12:15 PM');
  assert(dur === '5h 15m', `Duration between 07:00 AM and 12:15 PM is 5h 15m (got: ${dur})`);

  // Test 6: RailwayService checkAvailability & 115-Seat Burst Drop
  console.log('\n[Test 6] 115-Seat Drop & RailwayService Availability:');
  const avail = await railwayService.checkAvailability({
    from: 'Chattogram',
    to: 'Dhaka',
    date: '2026-10-02',
    trainNumber: '702', // Subarna Express
    seatClass: 'S_CHAIR',
    passengers: 2,
    forceDrop: true,
  });

  assert(avail !== null, 'Availability returned for Subarna Express on forced drop');
  assert(avail?.availableSeats === 115, `Returns 115 available seats in burst drop (got: ${avail?.availableSeats})`);
  assert(avail?.isDemoData === true, 'Explicitly marked as isDemoData: true');

  // Test 7: Anti-False-Negative Match Evaluator (Chittagong <-> Chattogram inter-operability)
  console.log('\n[Test 7] Anti-False-Negative Seat Match Evaluator:');
  const matchResult = evaluateSeatMatch(
    {
      id: 'test-alert-1',
      fromStation: 'Chittagong', // user entered Chittagong
      toStation: 'Dhaka',
      journeyDate: '2026-10-02',
      trainCode: '702',
      seatClass: 's-chair', // user entered s-chair
      passengerCount: 2,
    },
    avail
  );

  assert(matchResult.isMatch === true, 'Criteria with Chittagong and s-chair matches availability for Chattogram and S_CHAIR');
  assert(matchResult.score >= 0, `Computed score is valid (got: ${matchResult.score})`);
  assert(Boolean(matchResult.fingerprint), `Generated deduplication fingerprint: ${matchResult.fingerprint}`);

  // Test 8: Speed-Booking & Deep Search URL Generator
  console.log('\n[Test 8] Speed-Booking & Deep Link Suite:');
  const deepUrl = generateDeepSearchUrl('Chattogram', 'Dhaka', '2026-10-02', 'S_CHAIR');
  assert(
    deepUrl.includes('doj=02-Oct-2026'),
    `Deep search URL correctly formats date as 02-Oct-2026 (got: ${deepUrl})`
  );

  const bookmarklet = generateAutoFillBookmarklet('Chattogram', 'Dhaka', '2026-10-02', 'S_CHAIR');
  assert(bookmarklet.startsWith('javascript:(function()'), 'Bookmarklet starts with javascript:(function()');
  assert(bookmarklet.includes('Chattogram') && bookmarklet.includes('Dhaka'), 'Bookmarklet contains target stations');

  // Test 9: All 9 Bangladesh Railway Seat Classes
  console.log('\n[Test 9] Comprehensive 9-Class Normalization:');
  assert(normalizeClass('S_CHAIR') === 'S_CHAIR', 'S_CHAIR normalized');
  assert(normalizeClass('SNIGDHA') === 'SNIGDHA', 'SNIGDHA normalized');
  assert(normalizeClass('AC_B') === 'AC_B', 'AC_B normalized');
  assert(normalizeClass('AC_S') === 'AC_S', 'AC_S normalized');
  assert(normalizeClass('F_BERTH') === 'F_BERTH', 'F_BERTH normalized');
  assert(normalizeClass('F_SEAT') === 'F_SEAT', 'F_SEAT normalized');
  assert(normalizeClass('F_CHAIR') === 'F_CHAIR', 'F_CHAIR normalized');
  assert(normalizeClass('SHOVON') === 'SHOVON', 'SHOVON normalized');
  assert(normalizeClass('SHULOV') === 'SHULOV', 'SHULOV normalized');

  // Test 10: Expanded Station Directory Normalization
  console.log('\n[Test 10] Expanded Station Directory Normalization:');
  assert(normalizeStation('Mymensingh') === 'MYMENSINGH', 'normalizeStation("Mymensingh") -> MYMENSINGH');
  assert(normalizeStation('Rangpur') === 'RANGPUR', 'normalizeStation("Rangpur") -> RANGPUR');
  assert(normalizeStation('Bogra') === 'BOGURA', 'normalizeStation("Bogra") -> BOGURA');
  assert(normalizeStation('Bogura') === 'BOGURA', 'normalizeStation("Bogura") -> BOGURA');
  assert(normalizeStation('Dinajpur') === 'DINAJPUR', 'normalizeStation("Dinajpur") -> DINAJPUR');
  assert(normalizeStation('Jessore') === 'JASHORE', 'normalizeStation("Jessore") -> JASHORE');
  assert(normalizeStation('Jashore') === 'JASHORE', 'normalizeStation("Jashore") -> JASHORE');

  // Test 11: Dynamic Route Fallback Coverage
  console.log('\n[Test 11] Dynamic Route Fallback Coverage:');
  const mymTrains = getTrainsForRoute('Mymensingh', 'Dhaka', '2026-10-02');
  assert(mymTrains.length > 0, `Mymensingh -> Dhaka returns operating trains (got: ${mymTrains.length})`);
  assert(Boolean(mymTrains[0].trainName), `First train has valid name: ${mymTrains[0].trainName}`);

  // Test 12: Dhaka <-> Cox's Bazar Official Trains & Fares
  console.log('\n[Test 12] Dhaka <-> Cox\'s Bazar Official Portal Alignment:');
  const coxTrains = getTrainsForRoute('Dhaka', "Cox's Bazar", '2026-10-02');
  assert(coxTrains.length >= 2, `Dhaka -> Cox's Bazar returns at least 2 trains (got: ${coxTrains.length})`);

  const parjotak = coxTrains.find((t) => t.trainNumber === '816');
  assert(Boolean(parjotak), 'Contains PARJOTAK EXPRESS (816)');
  assert(parjotak?.departureTime === '06:15 AM', 'Parjotak departs 06:15 AM');
  assert(parjotak?.arrivalTime === '02:40 PM', 'Parjotak arrives 02:40 PM');

  // Test 13: Live 5 Seats Detection on PARJOTAK EXPRESS (816)
  console.log('\n[Test 13] Live 5 Seats Detection on PARJOTAK EXPRESS (816):');
  const coxAvail = await railwayService.checkAvailability({
    from: 'Dhaka',
    to: "Cox's Bazar",
    date: '2026-10-02',
    seatClass: 'AC_S',
    passengers: 1,
  });
  assert(coxAvail !== null, 'Live availability returned for Dhaka -> Cox\'s Bazar');
  assert(coxAvail?.trainNumber === '816', 'Matches PARJOTAK EXPRESS (816)');
  assert(coxAvail?.availableSeats === 5, `Returns exactly 5 seats in AC_S (got: ${coxAvail?.availableSeats})`);
  assert(coxAvail?.seatClass === 'AC_S', 'Seat class is AC_S (৳1728)');

  // Test 14: ANY_CLASS and Corridor-Wide Fallback Matching
  console.log('\n[Test 14] Corridor-Wide & Alternative Class Match:');
  const fallbackMatch = evaluateSeatMatch(
    {
      id: 'test-cox-alert',
      fromStation: 'Dhaka',
      toStation: 'Coxs Bazar', // user entered Coxs Bazar without apostrophe
      journeyDate: '2026-10-02',
      trainCode: '814', // user selected Coxs Bazar Express (#814)
      seatClass: 'S_CHAIR', // user selected S_CHAIR
      passengerCount: 1,
    },
    coxAvail
  );
  assert(fallbackMatch.isMatch === true, 'Corridor-wide matching alerts user when AC_S seats are available on Parjotak Express');
  assert(fallbackMatch.isAlternativeMatch === true, 'Marked as alternative match');
  assert(Boolean(fallbackMatch.alternativeNotice), `Includes informative notice: ${fallbackMatch.alternativeNotice}`);

  // Test 15: ANY_CLASS Direct Matching
  console.log('\n[Test 15] ANY_CLASS Direct Matching:');
  const anyClassMatch = evaluateSeatMatch(
    {
      id: 'test-any-class',
      fromStation: 'Dhaka',
      toStation: "Cox's Bazar",
      journeyDate: '2026-10-02',
      seatClass: 'ANY_CLASS',
      passengerCount: 1,
      monitorAllTrains: true,
    },
    coxAvail
  );
  assert(anyClassMatch.isMatch === true, 'ANY_CLASS matches immediately when any seats exist');
  assert(anyClassMatch.score > 0, `ANY_CLASS produces positive score: ${anyClassMatch.score}`);

  console.log('\n=================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('=================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}


runTests().catch((err) => {
  console.error('Test runner encountered an error:', err);
  process.exit(1);
});

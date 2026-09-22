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

  // Test 2: Station Normalization (Chittagong, Chattogram, Ctg -> CHITTAGONG)
  console.log('\n[Test 2] Station Normalization:');
  assert(normalizeStation('chittagong') === 'CHITTAGONG', 'normalizeStation("chittagong") -> CHITTAGONG');
  assert(normalizeStation('Chattogram') === 'CHITTAGONG', 'normalizeStation("Chattogram") -> CHITTAGONG');
  assert(normalizeStation('CTG') === 'CHITTAGONG', 'normalizeStation("CTG") -> CHITTAGONG');
  assert(normalizeStation('Dhaka Kamalapur') === 'DHAKA', 'normalizeStation("Dhaka Kamalapur") -> DHAKA');
  assert(normalizeStation('Coxs Bazar') === 'COXS BAZAR', 'normalizeStation("Coxs Bazar") -> COXS BAZAR');
  assert(normalizeStation('Brahmanbaria') === 'BRAHMANBARIA', 'normalizeStation("Brahmanbaria") -> BRAHMANBARIA');

  // Test 3: Class Normalization
  console.log('\n[Test 3] Seat Class Normalization:');
  assert(normalizeClass('shovan chair') === 'S_CHAIR', 'normalizeClass("shovan chair") -> S_CHAIR');
  assert(normalizeClass('s-chair') === 'S_CHAIR', 'normalizeClass("s-chair") -> S_CHAIR');
  assert(normalizeClass('snigdha') === 'SNIGDHA', 'normalizeClass("snigdha") -> SNIGDHA');
  assert(normalizeClass('AC_BERTH') === 'AC_B', 'normalizeClass("AC_BERTH") -> AC_B');

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
    deepUrl === 'https://eticket.railway.gov.bd/booking/train/search?fromcity=Chattogram&tocity=Dhaka&doj=2026-10-02&class=S_CHAIR',
    `Deep search URL correctly structured (got: ${deepUrl})`
  );

  const bookmarklet = generateAutoFillBookmarklet('Chattogram', 'Dhaka', '2026-10-02', 'S_CHAIR');
  assert(bookmarklet.startsWith('javascript:(function()'), 'Bookmarklet starts with javascript:(function()');
  assert(bookmarklet.includes('Chattogram') && bookmarklet.includes('Dhaka'), 'Bookmarklet contains target stations');

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

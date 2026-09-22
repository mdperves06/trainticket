# Railway Smart Booking Assistant (PWA + Telegram Notifier)

[![Standard](https://img.shields.io/badge/Google-Antigravity%20Standard-emerald)](https://github.com/mdperves06/trainticket)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-Ready-success)](https://web.dev/progressive-web-apps/)

An end-to-end, production-grade Next.js (TypeScript) Progressive Web App (PWA) and background worker platform designed to assist Bangladesh Railway travelers. The system tracks official ticket release schedules (8:00 AM BST window) and real-time seat cancellations, executes a multi-factor seat prioritization algorithm, and triggers multi-channel audio sirens, Telegram notifications, and Web Push events with strict human-in-the-loop (HITL) handoff.

---

## 1. Safety & Compliance Constraints

> [!IMPORTANT]
> **STRICT ZERO BOT BYPASS**: This project strictly adheres to legal and ethical standards. It does NOT implement CAPTCHA/Cloudflare bypasses, headless reverse-engineering of anti-bot protections, or OTP interception.

> [!NOTE]
> **HUMAN-IN-THE-LOOP (HITL)**: The automation boundary terminates immediately when availability and scoring are computed. The user retains absolute control over OTP entry, CAPTCHA resolution, and payment on the official booking portal: `https://eticket.railway.gov.bd`.

> [!TIP]
> **TIMEZONE LOCK**: All release schedules and worker chronologies enforce `Asia/Dhaka` (UTC+6, Bangladesh Standard Time).

---

## 2. System Architecture & Features

- **Progressive Web App (PWA)**: Standalone mobile-first web app with offline manifest, service worker readiness, and Railway Green (`#059669`) aesthetic.
- **Seat Prioritization Engine (`src/lib/seatScorer.ts`)**:
  - All seats in same coach: `+50` points
  - Matches specified `preferredCoach`: `+30` points
  - Window seats: `+25` points per window seat
  - Contains any seat from `avoidSeats`: `-100` penalty
  - Adjacent check (same coach + sequential row sequence): `+100` points
- **Dual-Tone Web Audio Siren (`src/lib/alarmEngine.ts`)**:
  - Browser-native `AudioContext` synthesizer (no external MP3 dependency).
  - Alternating 960 Hz / 770 Hz square/sawtooth oscillation at 400ms intervals.
  - HTML5 `navigator.vibrate([1000, 400, 1000, 400, 1000])` for physical mobile vibration.
- **Telegram Dispatcher (`src/lib/telegramNotifier.ts`)**:
  - Direct alert payload dispatch via Telegram Bot API with formatted markdown and inline button to the official portal.
- **Dynamic Background Worker (`src/worker/scheduler.ts`)**:
  - Rapid polling (every 3 seconds) during the 07:59:50 - 08:05:00 BST release window.
  - Standard polling (every 60 seconds) during daytime for cancellations.

---

## 3. Project Structure

```
trainticket/
├── .env.example
├── .gitignore
├── README.md
├── package.json
├── tsconfig.json
├── prisma/
│   └── schema.prisma
├── public/
│   ├── manifest.json
│   └── icons/
│       └── icon-512x512.png
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── alerts/
│   │   │   │   └── route.ts
│   │   │   ├── check/
│   │   │   │   └── route.ts
│   │   │   └── telegram-webhook/
│   │   │       └── route.ts
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── create-alert/
│   │       └── page.tsx
│   ├── components/
│   │   ├── AlertCard.tsx
│   │   ├── CountdownTimer.tsx
│   │   ├── Navbar.tsx
│   │   └── SirenBanner.tsx
│   ├── lib/
│   │   ├── alarmEngine.ts
│   │   ├── db.ts
│   │   ├── seatScorer.ts
│   │   └── telegramNotifier.ts
│   ├── providers/
│   │   ├── railwayProvider.interface.ts
│   │   └── mockRailwayProvider.ts
│   └── worker/
│       └── scheduler.ts
```

---

## 4. Getting Started

### Prerequisites
- Node.js LTS (v20+ or v24+)
- npm / npx

### Installation
```bash
# 1. Clone repository
git clone https://github.com/mdperves06/trainticket.git
cd trainticket

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env

# 4. Generate Prisma client & sync SQLite database
npx prisma db push
```

### Running the Application

```bash
# Start Next.js Development Server
npm run dev

# Start Background Monitoring Worker
npm run worker
```

Open `http://localhost:3000` in your browser.

---

## 5. Verification & Testing

- **Trigger Test Availability Scan**:
  Visit or curl `GET http://localhost:3000/api/check` to execute an immediate scan cycle against mock provider payloads.
- **Telegram Bot Integration**:
  Add your bot token in `.env` (`TELEGRAM_BOT_TOKEN`), start a chat with your bot, send `/start` to retrieve your Chat ID, and add it to your alert.


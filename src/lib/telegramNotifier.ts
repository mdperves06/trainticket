import axios from 'axios';
import { CandidateSeat } from './seatScorer';
import { generateDeepSearchUrl } from './bookmarkletGenerator';

export interface TelegramAlertPayload {
  trainName: string;
  trainCode?: string | null;
  fromStation: string;
  toStation: string;
  journeyDate: string;
  seatClass: string;
  seats: CandidateSeat[];
  score: number;
  telegramChatId?: string | null;
}

// In-memory deduplication cache: fingerprint -> timestamp
const sentFingerprints = new Map<string, number>();
const DEDUPLICATION_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Dispatches an urgent Telegram alert with an inline link to Bangladesh Railway booking portal.
 */
export async function sendTelegramNotification(
  payload: TelegramAlertPayload
): Promise<{ success: boolean; messageId?: number; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = payload.telegramChatId || process.env.DEFAULT_TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn(
      '[TelegramNotifier] Token or Chat ID not configured. Skipping Telegram dispatch.'
    );
    return {
      success: false,
      error: 'Telegram bot token or Chat ID is missing.',
    };
  }

  // Deduplication check
  const fingerprint = `${chatId}_${payload.trainCode || payload.trainName}_${payload.seatClass}_${payload.journeyDate}`;
  const now = Date.now();
  const lastSent = sentFingerprints.get(fingerprint);
  if (lastSent && now - lastSent < DEDUPLICATION_WINDOW_MS) {
    console.log(`[TelegramNotifier] Suppressing duplicate notification for ${fingerprint}`);
    return { success: true };
  }

  const seatsList = payload.seats
    .map((s) => `• Coach *${s.coach}*, Seat *${s.seatNumber}* ${s.isWindow ? '🪟 (Window)' : ''}`)
    .join('\n');

  const portalSearchUrl = generateDeepSearchUrl(
    payload.fromStation,
    payload.toStation,
    payload.journeyDate,
    payload.seatClass
  );

  const text = `🚨 *RAILWAY SEAT FOUND!* 🚨
━━━━━━━━━━━━━━━━━━━━
🚂 *Train:* ${payload.trainName} ${payload.trainCode ? `(#${payload.trainCode})` : ''}
📍 *Route:* ${payload.fromStation} ➔ ${payload.toStation}
📅 *Date:* ${payload.journeyDate}
🎟 *Class:* ${payload.seatClass}
⭐ *Prioritization Score:* *+${payload.score} pts*

💺 *Matched Seats:*
${seatsList}

⚠️ *HUMAN-IN-THE-LOOP REQUIRED:*
Automation has secured availability monitoring. Complete your OTP verification, CAPTCHA, and payment now on the official portal!
━━━━━━━━━━━━━━━━━━━━`;

  const inlineKeyboard = {
    inline_keyboard: [
      [
        {
          text: '⚡ Open Railway Booking Portal',
          url: portalSearchUrl,
        },
      ],
    ],
  };

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await axios.post(url, {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      reply_markup: inlineKeyboard,
    });

    if (res.data?.ok) {
      sentFingerprints.set(fingerprint, now);
      console.log(`[TelegramNotifier] Notification dispatched to chat ${chatId}`);
      return { success: true, messageId: res.data.result?.message_id };
    } else {
      return { success: false, error: res.data?.description || 'Unknown Telegram error' };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[TelegramNotifier] Failed to send telegram message:', message);
    return { success: false, error: message };
  }
}


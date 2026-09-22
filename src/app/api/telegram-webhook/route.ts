import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import prisma from '@/lib/db';
import { getDhakaTime } from '@/worker/scheduler';

export async function POST(req: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'Telegram Bot Token not configured' }, { status: 200 });
  }

  try {
    const update = await req.json();
    const message = update.message;

    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();

    let replyText = '';

    if (text.startsWith('/start')) {
      replyText = `🚆 *Welcome to Railway Smart Booking Assistant!*

Your Telegram Chat ID is: \`${chatId}\`

Use this Chat ID when creating alerts on the web dashboard to receive instant high-priority seat drop notifications!

*Available Commands:*
• /status - Check current monitoring status & BST time
• /alerts - List all active seat alerts
• /help - Display instructions`;
    } else if (text.startsWith('/status')) {
      const activeCount = await prisma.alert.count({ where: { isActive: true } });
      const dhaka = getDhakaTime();
      replyText = `📊 *Railway Assistant Status*
━━━━━━━━━━━━━━━━━━━━
🕒 *BST Time:* ${String(dhaka.hour).padStart(2, '0')}:${String(dhaka.minute).padStart(2, '0')}:${String(dhaka.second).padStart(2, '0')}
⚡ *Release Burst Window:* ${dhaka.isBurstWindow ? 'ACTIVE NOW (8:00 AM BST)' : 'INACTIVE'}
🔔 *Active Alerts:* ${activeCount}

Portal: [Bangladesh Railway e-Ticket](https://eticket.railway.gov.bd)`;
    } else if (text.startsWith('/alerts')) {
      const alerts = await prisma.alert.findMany({
        where: { isActive: true },
        take: 5,
        orderBy: { createdAt: 'desc' },
      });

      if (alerts.length === 0) {
        replyText = 'ℹ️ You have no active alerts configured.';
      } else {
        replyText = `📋 *Active Alerts (${alerts.length}):*\n\n` +
          alerts
            .map(
              (a, idx) =>
                `${idx + 1}. *${a.fromStation} ➔ ${a.toStation}*\n   📅 ${a.journeyDate} | 🎟 ${a.seatClass} | 🚦 ${a.status}`
            )
            .join('\n\n');
      }
    } else if (text.startsWith('/help')) {
      replyText = `💡 *Railway Smart Booking Assistant Help*
━━━━━━━━━━━━━━━━━━━━
1. Create alerts on the web app with your preferred route, date, and seat priorities.
2. Enter your Chat ID (\`${chatId}\`) in the alert form.
3. The system scans at 8:00 AM BST ticket drops and throughout the day for cancellations.
4. When a match is scored, you will receive an immediate siren alert here with a direct booking portal link!`;
    }

    if (replyText) {
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: chatId,
        text: replyText,
        parse_mode: 'Markdown',
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Telegram webhook error:', errorMsg);
    return NextResponse.json({ ok: true, error: errorMsg });
  }
}

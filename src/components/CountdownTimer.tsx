'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Zap, ShieldAlert } from 'lucide-react';

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isBurstActive: boolean;
  }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isBurstActive: false,
  });

  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date();

      // Convert current time to Asia/Dhaka time
      const dhakaDateStr = now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });
      const dhakaDate = new Date(dhakaDateStr);

      const year = dhakaDate.getFullYear();
      const month = dhakaDate.getMonth();
      const day = dhakaDate.getDate();

      // Today's 8:00 AM BST
      const todayRelease = new Date(year, month, day, 8, 0, 0, 0);
      const todayReleaseEnd = new Date(year, month, day, 8, 5, 0, 0);

      let targetRelease: Date;
      let isBurst = false;

      if (dhakaDate >= todayRelease && dhakaDate <= todayReleaseEnd) {
        // We are currently in the 8:00 AM release burst window!
        isBurst = true;
        targetRelease = todayReleaseEnd;
      } else if (dhakaDate < todayRelease) {
        // Next release is today at 8:00 AM
        targetRelease = todayRelease;
      } else {
        // Next release is tomorrow at 8:00 AM
        targetRelease = new Date(year, month, day + 1, 8, 0, 0, 0);
      }

      const diffMs = Math.max(0, targetRelease.getTime() - dhakaDate.getTime());
      const totalSeconds = Math.floor(diffMs / 1000);

      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft({ hours, minutes, seconds, isBurstActive: isBurst });
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div
      className="glass-card"
      style={{
        padding: '1.25rem 1.5rem',
        marginBottom: '1.75rem',
        border: timeLeft.isBurstActive
          ? '1px solid #10b981'
          : '1px solid rgba(255, 255, 255, 0.08)',
        background: timeLeft.isBurstActive
          ? 'linear-gradient(135deg, rgba(5, 150, 105, 0.15) 0%, rgba(13, 21, 39, 0.9) 100%)'
          : 'var(--bg-card)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: timeLeft.isBurstActive
                ? 'rgba(16, 185, 129, 0.2)'
                : 'rgba(255, 255, 255, 0.05)',
              color: timeLeft.isBurstActive ? '#10b981' : 'var(--text-muted)',
            }}
          >
            {timeLeft.isBurstActive ? (
              <Zap size={24} className="animate-pulse" />
            ) : (
              <Clock size={24} />
            )}
          </div>
          <div>
            <div
              style={{
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 600,
                color: timeLeft.isBurstActive ? '#34d399' : 'var(--text-muted)',
              }}
            >
              {timeLeft.isBurstActive
                ? '⚡ 8:00 AM BST TICKET RELEASE WINDOW ACTIVE'
                : 'Next Official Release Window (08:00 AM BST)'}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
              Bangladesh Railway 10-day advance booking quota drops at 8:00 AM BST daily.
            </div>
          </div>
        </div>

        {/* Countdown Numbers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {timeLeft.isBurstActive ? (
            <div
              className="badge badge-seat-found"
              style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
            >
              <Zap size={16} /> FAST POLLING (3s)
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <div
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    fontVariantNumeric: 'tabular-nums',
                    color: '#f8fafc',
                  }}
                >
                  {pad(timeLeft.hours)}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  Hours
                </div>
              </div>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-dim)' }}>:</span>
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <div
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    fontVariantNumeric: 'tabular-nums',
                    color: '#f8fafc',
                  }}
                >
                  {pad(timeLeft.minutes)}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  Mins
                </div>
              </div>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-dim)' }}>:</span>
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <div
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    fontVariantNumeric: 'tabular-nums',
                    color: '#10b981',
                  }}
                >
                  {pad(timeLeft.seconds)}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  Secs
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

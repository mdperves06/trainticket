'use client';

import React, { useEffect, useState } from 'react';
import { VolumeX, ExternalLink, Zap, Ban, CheckCircle2, Copy } from 'lucide-react';
import alarmEngine from '@/lib/alarmEngine';
import { AlertData } from './AlertCard';
import { generateDeepSearchUrl, copyToClipboard } from '@/lib/bookmarkletGenerator';

interface SirenModalProps {
  alert: AlertData;
  onSilenceOnly: () => void;
  onStopAndDismiss: () => void;
}

export default function SirenModal({
  alert,
  onSilenceOnly,
  onStopAndDismiss,
}: SirenModalProps) {
  const [isSilenced, setIsSilenced] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  useEffect(() => {
    // Only start siren if alert has enableSiren true
    if (alert.enableSiren !== false) {
      alarmEngine.start();
    }

    return () => {
      alarmEngine.stop();
    };
  }, [alert.enableSiren]);

  const handleSilence = () => {
    alarmEngine.stop();
    setIsSilenced(true);
    onSilenceOnly();
  };

  const handleStopAndDismiss = () => {
    alarmEngine.stop();
    onStopAndDismiss();
  };

  const handleOpenPortal = async () => {
    alarmEngine.stop();
    setIsSilenced(true);

    // Auto-copy passenger & booking details to clipboard
    const copyText = `ROUTE: ${alert.fromStation} -> ${alert.toStation} | DATE: ${alert.journeyDate} | CLASS: ${alert.seatClass} | PASSENGERS: ${alert.passengerCount}${alert.preferredCoach ? ` | COACH: ${alert.preferredCoach}` : ''}`;
    await copyToClipboard(copyText);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 4000);

    // Deep link with search parameters
    const portalUrl = generateDeepSearchUrl(
      alert.fromStation,
      alert.toStation,
      alert.journeyDate,
      alert.seatClass
    );
    window.open(portalUrl, '_blank', 'noopener,noreferrer');
  };


  // Parse match details if available
  let matchInfo: {
    trainName?: string;
    trainNumber?: string;
    availableSeats?: number;
    coach?: string;
    seatNumbers?: string[];
    isDemoData?: boolean;
  } = {};

  try {
    if (alert.matchDetails) {
      matchInfo = JSON.parse(alert.matchDetails);
    }
  } catch {
    matchInfo = {};
  }

  const confirmedTime = alert.lastCheckedAt
    ? new Date(alert.lastCheckedAt).toLocaleTimeString('en-US', {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }) + ' BST'
    : 'Recently';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 8, 16, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
    >
      <div
        className="glass-card siren-modal"
        style={{
          maxWidth: '540px',
          width: '100%',
          padding: '2rem',
          borderRadius: '20px',
          textAlign: 'center',
          borderWidth: '2px',
        }}
      >
        {/* Animated Beacon Icon */}
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ef4444 0%, #10b981 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            color: '#ffffff',
            boxShadow: '0 0 35px rgba(239, 68, 68, 0.55)',
          }}
        >
          <Zap size={36} className="animate-bounce" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <h2
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.02em',
            }}
          >
            TARGET SEAT DETECTED!
          </h2>
        </div>

        {/* Demo Data Flag Badge */}
        <div style={{ marginBottom: '1rem' }}>
          <span
            style={{
              fontSize: '0.7rem',
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: '#fcd34d',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              fontWeight: 700,
              letterSpacing: '0.05em',
            }}
          >
            [DEMO DATA — SIMULATED TICKET DROP]
          </span>
        </div>

        {/* Zero-Click Auto-Redirect Notification Banner */}
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid #10b981',
            borderRadius: '10px',
            padding: '0.65rem 0.85rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            color: '#6ee7b7',
            fontSize: '0.825rem',
            fontWeight: 700,
          }}
        >
          <CheckCircle2 size={16} color="#10b981" />
          <span>🚀 Auto-Opened Official Railway Portal & Copied Details to Clipboard!</span>
        </div>

        <p style={{ color: '#cbd5e1', fontSize: '0.875rem', marginBottom: '1.25rem', lineHeight: 1.4 }}>
          Exact matching seats confirmed. Polling has been automatically stopped to avoid redundant queries. Complete your booking on the official portal immediately.
        </p>


        {/* Detailed Match Information Box */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '14px',
            padding: '1.1rem',
            marginBottom: '1.25rem',
            textAlign: 'left',
            fontSize: '0.85rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.65rem',
          }}
        >
          <div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Monitored Train</div>
            <div style={{ fontWeight: 700, color: '#f8fafc' }}>
              {matchInfo.trainName || alert.trainName || 'All Trains'} {matchInfo.trainNumber || alert.trainCode ? `(#${matchInfo.trainNumber || alert.trainCode})` : ''}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Route</div>
            <div style={{ fontWeight: 700, color: '#f8fafc' }}>
              {alert.fromStation} ➔ {alert.toStation}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Journey Date</div>
            <div style={{ fontWeight: 600, color: '#f8fafc' }}>{alert.journeyDate}</div>
          </div>

          <div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Seat Class</div>
            <div style={{ fontWeight: 700, color: '#10b981' }}>{alert.seatClass}</div>
          </div>

          <div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Available Count</div>
            <div style={{ fontWeight: 700, color: '#f8fafc' }}>
              {matchInfo.availableSeats || alert.passengerCount} seat(s)
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Coach / Seats</div>
            <div style={{ fontWeight: 600, color: '#cbd5e1' }}>
              {matchInfo.coach ? `Coach ${matchInfo.coach}: ` : ''}
              {matchInfo.seatNumbers?.join(', ') || 'Assigned on Booking'}
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Confirmation Timestamp:</span>
            <span style={{ color: '#93c5fd', fontWeight: 600, fontSize: '0.75rem' }}>{confirmedTime}</span>
          </div>
        </div>

        {/* HITL Notice */}
        <div
          style={{
            fontSize: '0.775rem',
            color: '#fbbf24',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '8px',
            padding: '0.65rem 0.85rem',
            marginBottom: '1.25rem',
            lineHeight: 1.4,
            textAlign: 'left',
          }}
        >
          🔒 <strong>Human-in-the-Loop Standard:</strong> RailAssistant does not solve CAPTCHAs or handle payment. Complete your OTP verification and payment directly on the official portal.
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {copiedToast && (
            <div
              style={{
                fontSize: '0.85rem',
                color: '#6ee7b7',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid #10b981',
                padding: '0.6rem 1rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={16} color="#10b981" />
              <span>Copied! Paste on ticket page</span>
            </div>
          )}

          <button
            onClick={handleOpenPortal}
            className="btn btn-primary"
            style={{
              padding: '0.9rem 1.25rem',
              fontSize: '1rem',
              fontWeight: 700,
              width: '100%',
              minHeight: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 0 25px rgba(16, 185, 129, 0.5)',
            }}
          >
            <ExternalLink size={18} />
            <span>↗ Open Railway Portal</span>
          </button>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.65rem',
            }}
          >
            <button
              onClick={handleStopAndDismiss}
              className="btn btn-danger"
              style={{
                fontSize: '0.875rem',
                padding: '0.75rem 1rem',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                fontWeight: 700,
              }}
            >
              <Ban size={16} />
              <span>🛑 Stop & Silence</span>
            </button>

            <button
              onClick={handleSilence}
              className="btn btn-secondary"
              style={{
                fontSize: '0.85rem',
                padding: '0.75rem 1rem',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
              disabled={isSilenced}
            >
              <VolumeX size={16} />
              <span>{isSilenced ? 'Siren Silenced' : '🔇 Silence Siren Only'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

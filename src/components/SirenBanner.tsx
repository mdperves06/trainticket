'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, Volume2, VolumeX, ExternalLink, Zap } from 'lucide-react';
import alarmEngine from '@/lib/alarmEngine';
import { AlertData } from './AlertCard';

interface SirenBannerProps {
  alert: AlertData;
  onDismiss: () => void;
}

export default function SirenBanner({ alert, onDismiss }: SirenBannerProps) {
  useEffect(() => {
    // Automatically start dual-tone siren and vibration
    alarmEngine.start();

    return () => {
      alarmEngine.stop();
    };
  }, []);

  const handleMuteAndRedirect = () => {
    alarmEngine.stop();
    onDismiss();
    window.open('https://eticket.railway.gov.bd', '_blank', 'noopener,noreferrer');
  };

  const handleOnlyMute = () => {
    alarmEngine.stop();
    onDismiss();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 8, 16, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        className="glass-card siren-modal"
        style={{
          maxWidth: '520px',
          width: '100%',
          padding: '2rem',
          borderRadius: '20px',
          textAlign: 'center',
          borderWidth: '2px',
        }}
      >
        {/* Animated Siren Icon */}
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ef4444 0%, #10b981 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            color: '#ffffff',
            boxShadow: '0 0 35px rgba(239, 68, 68, 0.5)',
          }}
        >
          <Zap size={38} className="animate-bounce" />
        </div>

        <h2
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#ffffff',
            marginBottom: '0.5rem',
            letterSpacing: '-0.02em',
          }}
        >
          SEATS FOUND & SCORED!
        </h2>

        <p style={{ color: '#cbd5e1', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
          Available seats matching your route and preferences have been detected. The audio alarm is active.
        </p>

        {/* Route Details Box */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.45)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
            textAlign: 'left',
            fontSize: '0.9rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ color: 'var(--text-dim)' }}>Route:</span>
            <span style={{ fontWeight: 700, color: '#f8fafc' }}>
              {alert.fromStation} ➔ {alert.toStation}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ color: 'var(--text-dim)' }}>Date:</span>
            <span style={{ fontWeight: 600, color: '#f8fafc' }}>{alert.journeyDate}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ color: 'var(--text-dim)' }}>Class:</span>
            <span style={{ fontWeight: 600, color: '#10b981' }}>{alert.seatClass}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-dim)' }}>Passengers:</span>
            <span style={{ fontWeight: 600, color: '#f8fafc' }}>{alert.passengerCount}</span>
          </div>
        </div>

        {/* HITL Notice */}
        <div
          style={{
            fontSize: '0.8rem',
            color: '#fbbf24',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '8px',
            padding: '0.65rem 0.85rem',
            marginBottom: '1.5rem',
            lineHeight: 1.4,
          }}
        >
          ⚠️ <strong>Human-in-the-Loop Standard:</strong> Complete your official OTP verification, CAPTCHA, and payment directly on the Bangladesh Railway portal.
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onClick={handleMuteAndRedirect}
            className="btn btn-primary"
            style={{
              padding: '0.85rem 1.5rem',
              fontSize: '1rem',
              fontWeight: 700,
              width: '100%',
              boxShadow: '0 0 25px rgba(16, 185, 129, 0.5)',
            }}
          >
            <ExternalLink size={18} />
            <span>Mute & Open Railway Portal</span>
          </button>

          <button
            onClick={handleOnlyMute}
            className="btn btn-secondary"
            style={{ width: '100%', fontSize: '0.85rem' }}
          >
            <VolumeX size={16} />
            <span>Silence Siren Only</span>
          </button>
        </div>
      </div>
    </div>
  );
}

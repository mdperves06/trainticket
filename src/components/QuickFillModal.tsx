'use client';

import React, { useState } from 'react';
import {
  Zap,
  Copy,
  CheckCircle2,
  ExternalLink,
  Clock,
  Bookmark,
  X,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import {
  generateAutoFillBookmarklet,
  generateDeepSearchUrl,
  copyToClipboard,
} from '@/lib/bookmarkletGenerator';

interface QuickFillModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFrom?: string;
  defaultTo?: string;
  defaultDate?: string;
  defaultClass?: string;
}

export default function QuickFillModal({
  isOpen,
  onClose,
  defaultFrom = 'Chattogram',
  defaultTo = 'Dhaka',
  defaultDate,
  defaultClass = 'S_CHAIR',
}: QuickFillModalProps) {
  const [fromStation, setFromStation] = useState(defaultFrom);
  const [toStation, setToStation] = useState(defaultTo);
  const [journeyDate, setJourneyDate] = useState(() => {
    if (defaultDate) return defaultDate;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [seatClass, setSeatClass] = useState(defaultClass);
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!isOpen) return null;

  const bookmarkletCode = generateAutoFillBookmarklet(
    fromStation,
    toStation,
    journeyDate,
    seatClass
  );

  const deepSearchUrl = generateDeepSearchUrl(
    fromStation,
    toStation,
    journeyDate,
    seatClass
  );

  const handleCopyBookmarklet = async () => {
    const success = await copyToClipboard(bookmarkletCode);
    if (success) {
      setCopiedBookmarklet(true);
      setTimeout(() => setCopiedBookmarklet(false), 2500);
    }
  };

  const handleCopyUrl = async () => {
    const success = await copyToClipboard(deepSearchUrl);
    if (success) {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    }
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
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        className="glass-card"
        style={{
          maxWidth: '560px',
          width: '100%',
          padding: '1.75rem',
          borderRadius: '18px',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '1px solid rgba(16, 185, 129, 0.3)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <Zap size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                Speed-Booking & Auto-Fill Suite
              </h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                1-Tap mobile bookmarklet & official portal deep search
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.4rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 8:00 AM BST Login Reminder Alert */}
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem',
          }}
        >
          <Clock size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.8rem', color: '#fcd34d', lineHeight: 1.45 }}>
            <strong>⏰ 8:00 AM BST Session Reminder:</strong> Bangladesh Railway requires active session authentication. Log in to{' '}
            <a
              href="https://eticket.railway.gov.bd/login"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#6ee7b7', textDecoration: 'underline' }}
            >
              eticket.railway.gov.bd
            </a>{' '}
            at <strong>07:55 AM BST</strong> (5 minutes before ticket release) so your session is already verified when seats drop!
          </div>
        </div>

        {/* Route Preview Selectors */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.25rem',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.65rem' }}>
            Configure Target Route for Auto-Fill:
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '0.65rem' }}>
            <div>
              <label style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>From</label>
              <input
                type="text"
                className="form-control"
                value={fromStation}
                onChange={(e) => setFromStation(e.target.value)}
                style={{ fontSize: '0.85rem', padding: '0.45rem 0.65rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>To</label>
              <input
                type="text"
                className="form-control"
                value={toStation}
                onChange={(e) => setToStation(e.target.value)}
                style={{ fontSize: '0.85rem', padding: '0.45rem 0.65rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            <div>
              <label style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Date</label>
              <input
                type="date"
                className="form-control"
                value={journeyDate}
                onChange={(e) => setJourneyDate(e.target.value)}
                style={{ fontSize: '0.85rem', padding: '0.45rem 0.65rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Class</label>
              <select
                className="form-control"
                value={seatClass}
                onChange={(e) => setSeatClass(e.target.value)}
                style={{ fontSize: '0.85rem', padding: '0.45rem 0.65rem' }}
              >
                <option value="S_CHAIR">Shovon Chair (S_CHAIR)</option>
                <option value="SNIGDHA">Snigdha (SNIGDHA)</option>
                <option value="AC_B">AC Berth (AC_B)</option>
                <option value="F_BERTH">First Berth (F_BERTH)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Feature 1: 1-Tap Mobile Bookmarklet */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
            <Bookmark size={16} color="#10b981" />
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
              1-Tap Auto-Fill Bookmarklet
            </span>
          </div>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
            Save this JavaScript bookmarklet to your browser bookmarks bar or mobile Safari/Chrome. When viewing eticket.railway.gov.bd, tap it to instantly populate stations, date, and class!
          </p>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleCopyBookmarklet}
              className="btn btn-primary"
              style={{
                flex: 1,
                fontSize: '0.85rem',
                padding: '0.65rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
              }}
            >
              {copiedBookmarklet ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>✓ Copied Bookmarklet Code!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>📋 Copy Bookmarklet Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feature 2: Official Portal Deep Search Link */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
            <ExternalLink size={16} color="#3b82f6" />
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
              Direct Search Deep-Link
            </span>
          </div>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
            Direct URL pre-configured with query parameters for the official booking engine:
          </p>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <a
              href={deepSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{
                flex: 1,
                fontSize: '0.85rem',
                padding: '0.65rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                color: '#93c5fd',
                borderColor: 'rgba(59, 130, 246, 0.4)',
              }}
            >
              <ExternalLink size={15} />
              <span>⚡ Open Official Search</span>
            </a>

            <button
              onClick={handleCopyUrl}
              className="btn btn-secondary"
              style={{
                fontSize: '0.85rem',
                padding: '0.65rem 1rem',
              }}
              title="Copy URL"
            >
              {copiedUrl ? <CheckCircle2 size={16} color="#10b981" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        {/* Safe Compliance Badge */}
        <div
          style={{
            fontSize: '0.725rem',
            color: 'var(--text-dim)',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            paddingTop: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <ShieldCheck size={14} color="#10b981" />
          <span>Zero-Bypass Safe: Client-side assist only. You log in and verify OTP on official portal.</span>
        </div>
      </div>
    </div>
  );
}

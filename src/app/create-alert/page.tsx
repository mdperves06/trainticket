'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Train, Calendar, Users, Armchair, Shield, Send, Check } from 'lucide-react';

const STATIONS = [
  'Dhaka',
  'Chittagong',
  'Sylhet',
  'Rajshahi',
  'Khulna',
  'Coxs Bazar',
  'Rangpur',
  'Mymensingh',
  'Bogra',
  'Cumilla',
  'Brahmanbaria',
  'Sreemangal',
];

const SEAT_CLASSES = [
  { id: 'SNIGDHA', label: 'Snigdha (AC Chair)', fare: '~৳750' },
  { id: 'S_CHAIR', label: 'Shovan Chair (Non-AC)', fare: '~৳405' },
  { id: 'AC_B', label: 'AC Berth / Cabin', fare: '~৳1200' },
];

export default function CreateAlertPage() {
  const router = useRouter();

  const [fromStation, setFromStation] = useState('Dhaka');
  const [toStation, setToStation] = useState('Chittagong');
  const [journeyDate, setJourneyDate] = useState(() => {
    // Default to tomorrow in YYYY-MM-DD
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [trainName, setTrainName] = useState('');
  const [seatClass, setSeatClass] = useState('SNIGDHA');
  const [passengerCount, setPassengerCount] = useState(1);
  const [preferredCoach, setPreferredCoach] = useState('');
  const [requireAdjacent, setRequireAdjacent] = useState(false);
  const [preferWindow, setPreferWindow] = useState(true);
  const [avoidSeats, setAvoidSeats] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (fromStation === toStation) {
      setError('Departure and destination stations cannot be the same.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromStation,
          toStation,
          journeyDate,
          trainName: trainName || null,
          seatClass,
          passengerCount: Number(passengerCount),
          preferredCoach: preferredCoach || null,
          requireAdjacent,
          preferWindow,
          avoidSeats: avoidSeats || null,
          telegramChatId: telegramChatId || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/');
      } else {
        setError(data.error || 'Failed to create alert');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '1.75rem', maxWidth: '720px' }}>
      <Link
        href="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          color: 'var(--text-muted)',
          textDecoration: 'none',
          fontSize: '0.9rem',
          marginBottom: '1.5rem',
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to Dashboard</span>
      </Link>

      <div className="glass-card" style={{ padding: '2rem' }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>
          Create Smart Seat Alert
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
          Configure your route, coach preferences, and prioritization rules for the Bangladesh Railway 8:00 AM BST drop and real-time cancellations.
        </p>

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontSize: '0.85rem',
              marginBottom: '1.5rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Route Section */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginBottom: '1.25rem',
            }}
          >
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">From Station</label>
              <select
                className="form-control"
                value={fromStation}
                onChange={(e) => setFromStation(e.target.value)}
                required
              >
                {STATIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">To Station</label>
              <select
                className="form-control"
                value={toStation}
                onChange={(e) => setToStation(e.target.value)}
                required
              >
                {STATIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date and Train */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginBottom: '1.25rem',
            }}
          >
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Journey Date</label>
              <input
                type="date"
                className="form-control"
                value={journeyDate}
                onChange={(e) => setJourneyDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Specific Train (Optional)</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Subarna Express"
                value={trainName}
                onChange={(e) => setTrainName(e.target.value)}
              />
            </div>
          </div>

          {/* Seat Class Selection */}
          <div className="form-group">
            <label className="form-label">Seat Class</label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.75rem',
              }}
            >
              {SEAT_CLASSES.map((sc) => (
                <div
                  key={sc.id}
                  onClick={() => setSeatClass(sc.id)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border:
                      seatClass === sc.id
                        ? '1px solid #10b981'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                    background:
                      seatClass === sc.id
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(10, 16, 30, 0.6)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f8fafc' }}>
                    {sc.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Est. {sc.fare}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Passengers & Preferred Coach */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginBottom: '1.25rem',
            }}
          >
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Passengers (1-4)</label>
              <input
                type="number"
                min={1}
                max={4}
                className="form-control"
                value={passengerCount}
                onChange={(e) => setPassengerCount(Number(e.target.value))}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Preferred Coach (e.g. KHA, GA)</label>
              <input
                type="text"
                className="form-control"
                placeholder="Optional (+30 pts)"
                value={preferredCoach}
                onChange={(e) => setPreferredCoach(e.target.value)}
              />
            </div>
          </div>

          {/* Prioritization Rules */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              padding: '1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            <div
              style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#f8fafc',
                marginBottom: '1rem',
              }}
            >
              🎯 Seat Prioritization Rules
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={preferWindow}
                  onChange={(e) => setPreferWindow(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#10b981' }}
                />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Prefer Window Seats (+25 pts)</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Gives preference to seats with window view.
                  </div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={requireAdjacent}
                  onChange={(e) => setRequireAdjacent(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#10b981' }}
                />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Require Adjacent Seats (+100 pts)</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Ensures all passengers sit next to each other in sequential rows.
                  </div>
                </div>
              </label>

              <div className="form-group" style={{ marginBottom: 0, marginTop: '0.5rem' }}>
                <label className="form-label">Avoid Specific Seats (-100 pts penalty)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. KA-1, KA-2, 12, 13 (comma-separated)"
                  value={avoidSeats}
                  onChange={(e) => setAvoidSeats(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Telegram Dispatcher Config */}
          <div className="form-group">
            <label className="form-label">Telegram Chat ID (Optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. 123456789"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>
              Message <code>/start</code> to our Telegram bot to retrieve your Chat ID for instant phone notifications.
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', marginTop: '1rem' }}
          >
            <Check size={18} />
            <span>{loading ? 'Creating Alert...' : 'Start Monitoring Alert'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

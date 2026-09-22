'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  Train,
  Calendar,
  Users,
  Armchair,
  Shield,
  Bell,
  Volume2,
  Smartphone,
  Send,
  Check,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { getFareForRoute } from '@/lib/railwayFares';
import { TrainInfo } from '@/providers/railwayService';

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

export default function CreateAlertPage() {
  const router = useRouter();

  // Step 1: Route & Date
  const [fromStation, setFromStation] = useState('Sylhet');
  const [toStation, setToStation] = useState('Dhaka');
  const [journeyDate, setJourneyDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });

  // Step 2: Trains (Queried ONLY on explicit click of "Search Trains")
  const [hasSearchedTrains, setHasSearchedTrains] = useState(false);
  const [searchingTrains, setSearchingTrains] = useState(false);
  const [availableTrains, setAvailableTrains] = useState<TrainInfo[]>([]);
  const [selectedTrain, setSelectedTrain] = useState<TrainInfo | null>(null);
  const [monitorAllTrains, setMonitorAllTrains] = useState(false);

  // Step 3: Class, Fares & Location-based Pricing
  const [seatClass, setSeatClass] = useState('S_CHAIR');
  const [passengerCount, setPassengerCount] = useState(1);
  const [preferredCoach, setPreferredCoach] = useState('');
  const [preferWindow, setPreferWindow] = useState(true);
  const [requireAdjacent, setRequireAdjacent] = useState(false);
  const [avoidSeats, setAvoidSeats] = useState('');

  // Step 4: Notification Channels
  const [enableSiren, setEnableSiren] = useState(true);
  const [enableVibration, setEnableVibration] = useState(true);
  const [enableTelegram, setEnableTelegram] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState('');

  // State & Feedback
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Dynamic Fare Lookup based on From, To, and Class
  const farePerSeat = useMemo(() => {
    return getFareForRoute(fromStation, toStation, seatClass);
  }, [fromStation, toStation, seatClass]);

  const totalFare = farePerSeat * passengerCount;

  // Step 1 Action: Search Trains (Triggered ONLY on user click)
  const handleSearchTrains = async () => {
    if (fromStation === toStation) {
      setError('Departure and destination stations cannot be the same.');
      return;
    }

    setError('');
    setSearchingTrains(true);

    try {
      const res = await fetch(
        `/api/trains?from=${encodeURIComponent(fromStation)}&to=${encodeURIComponent(
          toStation
        )}&date=${encodeURIComponent(journeyDate)}`
      );
      const data = await res.json();

      if (data.success && Array.isArray(data.trains)) {
        setAvailableTrains(data.trains);
        setHasSearchedTrains(true);
        if (data.trains.length > 0 && !monitorAllTrains) {
          setSelectedTrain(data.trains[0]);
        }
      } else {
        setError(data.error || 'Failed to search trains for this route.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error searching trains';
      setError(message);
    } finally {
      setSearchingTrains(false);
    }
  };

  // Step 5: Start Confirmation & Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasSearchedTrains) {
      setError('Please search and select a train first in Step 1 & 2.');
      return;
    }

    if (!monitorAllTrains && !selectedTrain) {
      setError('Please select a specific train or choose "Monitor All Trains".');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromStation,
          toStation,
          journeyDate,
          trainName: monitorAllTrains ? null : selectedTrain?.trainName,
          trainCode: monitorAllTrains ? null : selectedTrain?.trainNumber,
          seatClass,
          passengerCount: Number(passengerCount),
          preferredCoach: preferredCoach || null,
          requireAdjacent,
          preferWindow,
          avoidSeats: avoidSeats || null,
          telegramChatId: enableTelegram ? telegramChatId || null : null,
          monitorAllTrains,
          enableSiren,
          enableVibration,
          enableTelegram,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/');
      } else {
        setError(data.error || 'Failed to start monitoring.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '1.75rem', maxWidth: '760px' }}>
      <Link
        href="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          color: 'var(--text-muted)',
          textDecoration: 'none',
          fontSize: '0.85rem',
          marginBottom: '1.25rem',
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to Dashboard</span>
      </Link>

      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Train size={20} />
          </div>
          <h1 style={{ fontSize: '1.55rem' }}>Create Smart Seat Alert</h1>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
          5-Step progressive configuration for Bangladesh Railway 8:00 AM BST ticket release drops and daytime cancellations.
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
          {/* ========================================================================= */}
          {/* STEP 1: ROUTE & JOURNEY DATE */}
          {/* ========================================================================= */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#10b981',
                  color: '#070b14',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                1
              </span>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>
                Route & Journey Date
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1rem',
              }}
            >
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">From Station</label>
                <select
                  className="form-control"
                  value={fromStation}
                  onChange={(e) => {
                    setFromStation(e.target.value);
                    setHasSearchedTrains(false);
                  }}
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
                  onChange={(e) => {
                    setToStation(e.target.value);
                    setHasSearchedTrains(false);
                  }}
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
                <label className="form-label">Journey Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={journeyDate}
                  onChange={(e) => {
                    setJourneyDate(e.target.value);
                    setHasSearchedTrains(false);
                  }}
                  required
                />
              </div>
            </div>

            {/* Explicit Primary Search Button */}
            <button
              type="button"
              onClick={handleSearchTrains}
              disabled={searchingTrains}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}
            >
              <Search size={16} />
              <span>{searchingTrains ? 'Searching Trains on Route...' : 'Search Trains'}</span>
            </button>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '0.4rem' }}>
              Boundary Lock: No automatic network searches on station or date change.
            </div>
          </div>

          {/* ========================================================================= */}
          {/* STEP 2: AVAILABLE TRAIN SELECTION (Triggered ONLY after clicking Search Trains) */}
          {/* ========================================================================= */}
          {hasSearchedTrains && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '14px',
                padding: '1.25rem',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#10b981',
                      color: '#070b14',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    2
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>
                    Available Train Selection
                  </span>
                </div>

                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    color: '#6ee7b7',
                    background: 'rgba(16, 185, 129, 0.1)',
                    padding: '0.3rem 0.65rem',
                    borderRadius: '6px',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={monitorAllTrains}
                    onChange={(e) => setMonitorAllTrains(e.target.checked)}
                    style={{ accentColor: '#10b981' }}
                  />
                  <span>Monitor All Trains on this Route</span>
                </label>
              </div>

              {!monitorAllTrains ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {availableTrains.map((train) => {
                    const isSelected = selectedTrain?.trainNumber === train.trainNumber;
                    return (
                      <div
                        key={train.trainNumber}
                        onClick={() => setSelectedTrain(train)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.85rem 1rem',
                          borderRadius: '10px',
                          border: isSelected
                            ? '1px solid #10b981'
                            : '1px solid rgba(255, 255, 255, 0.08)',
                          background: isSelected
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(10, 16, 30, 0.5)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 700, color: '#f8fafc' }}>
                              {train.trainName}
                            </span>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                color: '#93c5fd',
                                background: 'rgba(59, 130, 246, 0.15)',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                              }}
                            >
                              #{train.trainNumber}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            Departs: {train.departureTime} • Arrives: {train.arrivalTime} ({train.duration})
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                            Classes: {train.classes.join(', ')}
                          </span>
                          <div
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              border: isSelected ? '5px solid #10b981' : '2px solid var(--border-glass)',
                              background: '#070b14',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    fontSize: '0.85rem',
                    color: '#6ee7b7',
                  }}
                >
                  ✓ <strong>Route-Locked Mode Active:</strong> Any operating train on this route ({fromStation} ➔ {toStation}) with matching seats will trigger the alert!
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: CLASS, FARES & LOCATION-BASED PRICING */}
          {/* ========================================================================= */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#10b981',
                  color: '#070b14',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                3
              </span>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>
                Class, Fares & Seat Rules
              </span>
            </div>

            {/* Dynamic Fare Badge Callout */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                marginBottom: '1rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Location-Aware Estimated Fare ({fromStation} ➔ {toStation}):
                </span>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#10b981' }}>
                  ৳{farePerSeat} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-dim)' }}>per seat ({passengerCount} pax: ৳{totalFare})</span>
                </div>
              </div>
              <span className="badge badge-class" style={{ textTransform: 'uppercase' }}>
                {seatClass}
              </span>
            </div>

            {/* Seat Class Selection */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: '0.75rem',
                marginBottom: '1.25rem',
              }}
            >
              {[
                { id: 'S_CHAIR', label: 'Shovon Chair (Non-AC)' },
                { id: 'SNIGDHA', label: 'Snigdha (AC Chair)' },
                { id: 'AC_BERTH', label: 'AC Berth / Cabin' },
              ].map((sc) => {
                const isSelected = seatClass === sc.id;
                const price = getFareForRoute(fromStation, toStation, sc.id);
                return (
                  <div
                    key={sc.id}
                    onClick={() => setSeatClass(sc.id)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      border: isSelected
                        ? '1px solid #10b981'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isSelected
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(10, 16, 30, 0.5)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#f8fafc' }}>
                      {sc.label}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700, marginTop: '0.2rem' }}>
                      ৳{price}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Passenger Count & Preferred Coach */}
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
                <select
                  className="form-control"
                  value={passengerCount}
                  onChange={(e) => setPassengerCount(Number(e.target.value))}
                >
                  <option value={1}>1 Passenger</option>
                  <option value={2}>2 Passengers</option>
                  <option value={3}>3 Passengers</option>
                  <option value={4}>4 Passengers</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Preferred Coach (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. KHA (+30 pts)"
                  value={preferredCoach}
                  onChange={(e) => setPreferredCoach(e.target.value)}
                />
              </div>
            </div>

            {/* Prioritization Toggles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={preferWindow}
                  onChange={(e) => setPreferWindow(e.target.checked)}
                  style={{ accentColor: '#10b981', width: '16px', height: '16px' }}
                />
                <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                  Prefer Window Seats (+25 pts per window)
                </span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={requireAdjacent}
                  onChange={(e) => setRequireAdjacent(e.target.checked)}
                  style={{ accentColor: '#10b981', width: '16px', height: '16px' }}
                />
                <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                  Require Adjacent Seats (Same Coach & Sequential Rows: +100 pts)
                </span>
              </label>

              <div className="form-group" style={{ marginBottom: 0, marginTop: '0.4rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>
                  Avoid Seats (Comma-separated, -100 penalty)
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. KA-1, KA-2, 12, 13"
                  value={avoidSeats}
                  onChange={(e) => setAvoidSeats(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* STEP 4: NOTIFICATION CHANNELS */}
          {/* ========================================================================= */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#10b981',
                  color: '#070b14',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                4
              </span>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>
                Notification Channels
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  background: enableSiren ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 0, 0, 0.3)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={enableSiren}
                  onChange={(e) => setEnableSiren(e.target.checked)}
                  style={{ accentColor: '#10b981' }}
                />
                <Volume2 size={16} color={enableSiren ? '#10b981' : '#64748b'} />
                <span style={{ fontSize: '0.85rem' }}>In-Browser Siren</span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  background: enableVibration ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 0, 0, 0.3)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={enableVibration}
                  onChange={(e) => setEnableVibration(e.target.checked)}
                  style={{ accentColor: '#10b981' }}
                />
                <Smartphone size={16} color={enableVibration ? '#10b981' : '#64748b'} />
                <span style={{ fontSize: '0.85rem' }}>Mobile Vibration</span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  background: enableTelegram ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 0, 0, 0.3)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={enableTelegram}
                  onChange={(e) => setEnableTelegram(e.target.checked)}
                  style={{ accentColor: '#10b981' }}
                />
                <Send size={16} color={enableTelegram ? '#10b981' : '#64748b'} />
                <span style={{ fontSize: '0.85rem' }}>Telegram Alerts</span>
              </label>
            </div>

            {enableTelegram && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Telegram Chat ID</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 123456789"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>
                  Send <code>/start</code> to your Telegram bot to obtain your personal Chat ID.
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* STEP 5: START CONFIRMATION */}
          {/* ========================================================================= */}
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.06)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '14px',
              padding: '1.25rem',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#10b981',
                  color: '#070b14',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                5
              </span>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: '#f8fafc' }}>
                Start Confirmation
              </span>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '1.25rem' }}>
              <em>&ldquo;Monitoring will begin only after you click Start Monitoring.&rdquo;</em>
              <br />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Zero background queries will run until this explicit confirmation.
              </span>
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '1rem',
                fontWeight: 700,
                boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)',
              }}
            >
              <CheckCircle2 size={18} />
              <span>{submitting ? 'Initializing Monitoring...' : 'Start Monitoring'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

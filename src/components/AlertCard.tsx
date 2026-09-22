'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Users,
  Armchair,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Zap,
  RotateCcw,
  Edit3,
  ChevronDown,
  ChevronUp,
  History,
  X,
  Check,
  Volume2,
  Smartphone,
  Send,
  ExternalLink,
} from 'lucide-react';
import { ScanHistoryEntry } from '@/worker/pollingWorker';
import { generateDeepSearchUrl } from '@/lib/bookmarkletGenerator';
import { BANGLADESH_CLASSES } from '@/lib/railwayDatabase';


export interface AlertData {
  id: string;
  fromStation: string;
  toStation: string;
  journeyDate: string;
  trainName?: string | null;
  trainCode?: string | null;
  seatClass: string;
  passengerCount: number;
  preferredCoach?: string | null;
  requireAdjacent: boolean;
  preferWindow: boolean;
  avoidSeats?: string | null;
  telegramChatId?: string | null;
  status: string; // IDLE, MONITORING, PAUSED, SEAT_FOUND, COMPLETED, EXPIRED
  isActive: boolean;
  monitorAllTrains?: boolean;
  scanHistory?: string | null;
  matchDetails?: string | null;
  enableSiren?: boolean;
  enableVibration?: boolean;
  enableTelegram?: boolean;
  lastCheckedAt?: string | null;
  createdAt: string;
}

interface AlertCardProps {
  alert: AlertData;
  onTogglePause: (id: string, currentStatus: string) => void;
  onDelete: (id: string) => void;
  onTriggerTargetedScan?: (id: string) => Promise<void>;
  onResetStatus?: (id: string) => void;
  onUpdateAlert?: (id: string, updatedFields: Partial<AlertData>) => Promise<void>;
}

export default function AlertCard({
  alert,
  onTogglePause,
  onDelete,
  onTriggerTargetedScan,
  onResetStatus,
  onUpdateAlert,
}: AlertCardProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<string | null>(null);

  // Edit form state
  const [editClass, setEditClass] = useState(alert.seatClass);
  const [editPassengers, setEditPassengers] = useState(alert.passengerCount);
  const [editCoach, setEditCoach] = useState(alert.preferredCoach || '');
  const [editWindow, setEditWindow] = useState(alert.preferWindow);
  const [editAdjacent, setEditAdjacent] = useState(alert.requireAdjacent);
  const [editAvoid, setEditAvoid] = useState(alert.avoidSeats || '');
  const [editTelegram, setEditTelegram] = useState(alert.telegramChatId || '');

  // Parse scan history
  let historyList: ScanHistoryEntry[] = [];
  try {
    if (alert.scanHistory) {
      historyList = JSON.parse(alert.scanHistory);
    }
  } catch {
    historyList = [];
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SEAT_FOUND':
        return (
          <span className="badge badge-seat-found" style={{ animation: 'pulse-emerald 2s infinite' }}>
            <Zap size={13} /> ⚡ SEAT FOUND
          </span>
        );
      case 'MONITORING':
        return (
          <span className="badge badge-monitoring">
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#f59e0b',
                display: 'inline-block',
              }}
            />
            🟡 MONITORING
          </span>
        );
      case 'PAUSED':
        return (
          <span
            className="badge"
            style={{
              background: 'rgba(100, 116, 139, 0.15)',
              color: '#94a3b8',
              border: '1px solid rgba(100, 116, 139, 0.3)',
            }}
          >
            <Pause size={12} /> ⏸ PAUSED
          </span>
        );
      case 'COMPLETED':
        return (
          <span
            className="badge"
            style={{
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#93c5fd',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}
          >
            <CheckCircle2 size={12} /> ✅ COMPLETED
          </span>
        );
      case 'IDLE':
      default:
        return (
          <span
            className="badge"
            style={{
              background: 'rgba(100, 116, 139, 0.15)',
              color: '#94a3b8',
              border: '1px solid rgba(100, 116, 139, 0.25)',
            }}
          >
            ⚪ IDLE
          </span>
        );
    }
  };


  const formattedDate = new Date(alert.journeyDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleTargetedScan = async () => {
    if (!onTriggerTargetedScan || scanning) return;
    setScanning(true);
    setLastScanResult(null);
    try {
      await onTriggerTargetedScan(alert.id);
      setLastScanResult('Targeted scan completed');
    } catch {
      setLastScanResult('Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!onUpdateAlert) return;
    try {
      await onUpdateAlert(alert.id, {
        seatClass: editClass,
        passengerCount: editPassengers,
        preferredCoach: editCoach || null,
        preferWindow: editWindow,
        requireAdjacent: editAdjacent,
        avoidSeats: editAvoid || null,
        telegramChatId: editTelegram || null,
      });
      setShowEditModal(false);
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const isPaused = alert.status === 'PAUSED';

  return (
    <div
      className="glass-card"
      style={{
        padding: '1.25rem 1.5rem',
        marginBottom: '1rem',
        borderLeft:
          alert.status === 'SEAT_FOUND'
            ? '4px solid #10b981'
            : alert.status === 'MONITORING'
            ? '4px solid #f59e0b'
            : alert.status === 'PAUSED'
            ? '4px solid #64748b'
            : '4px solid #10b981',
      }}
    >
      {/* Top Header & Route */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          paddingBottom: '0.85rem',
          marginBottom: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
            {alert.fromStation}
          </span>
          <ArrowRight size={18} color="#10b981" />
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
            {alert.toStation}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-class">{alert.seatClass}</span>
          {getStatusBadge(alert.status)}
        </div>
      </div>

      {/* Train & Journey Specifications */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.75rem',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          marginBottom: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Calendar size={15} color="#94a3b8" />
          <span>{formattedDate}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Users size={15} color="#94a3b8" />
          <span>
            {alert.passengerCount} Passenger{alert.passengerCount > 1 ? 's' : ''}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Armchair size={15} color="#94a3b8" />
          <span style={{ fontWeight: 600, color: '#e2e8f0' }}>
            {alert.monitorAllTrains
              ? 'All Trains (Route-locked)'
              : `${alert.trainName || 'Any Train'} ${alert.trainCode ? `(#${alert.trainCode})` : ''}`}
          </span>
        </div>

        {/* Preferences Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', gridColumn: '1 / -1' }}>
          {alert.preferredCoach && (
            <span
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#cbd5e1',
              }}
            >
              Coach: {alert.preferredCoach} (+30)
            </span>
          )}
          {alert.preferWindow && (
            <span
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#6ee7b7',
              }}
            >
              🪟 Window (+25)
            </span>
          )}
          {alert.requireAdjacent && (
            <span
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                background: 'rgba(59, 130, 246, 0.1)',
                color: '#93c5fd',
              }}
            >
              Adjacent Required (+100)
            </span>
          )}
          {alert.avoidSeats && (
            <span
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#fca5a5',
              }}
            >
              Avoid: {alert.avoidSeats}
            </span>
          )}
        </div>
      </div>

      {/* Action Toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* ⚡ Instant Search Link */}
          <button
            onClick={() => {
              const url = generateDeepSearchUrl(
                alert.fromStation,
                alert.toStation,
                alert.journeyDate,
                alert.seatClass
              );
              window.open(url, '_blank', 'noopener,noreferrer');
            }}
            className="btn btn-secondary"
            style={{
              fontSize: '0.775rem',
              padding: '0.4rem 0.75rem',
              borderColor: 'rgba(16, 185, 129, 0.4)',
              color: '#6ee7b7',
              background: 'rgba(16, 185, 129, 0.1)',
            }}
            title="Open official Bangladesh Railway search page for this route and date"
          >
            <ExternalLink size={13} color="#10b981" />
            <span>⚡ Instant Search Link</span>
          </button>

          {/* ⚡ Scan Now */}
          {onTriggerTargetedScan && (
            <button
              onClick={handleTargetedScan}
              disabled={scanning}
              className="btn btn-secondary"
              style={{ fontSize: '0.775rem', padding: '0.4rem 0.75rem' }}
              title="Execute single targeted check immediately"
            >
              <Zap size={14} color="#10b981" />
              <span>{scanning ? 'Scanning...' : '⚡ Scan Now'}</span>
            </button>
          )}

          {/* ▶ Start Monitoring or ⏸ Pause */}
          {alert.status === 'MONITORING' ? (
            <button
              onClick={() => onTogglePause(alert.id, alert.status)}
              className="btn btn-secondary"
              style={{ fontSize: '0.775rem', padding: '0.4rem 0.75rem' }}
              title="Pause background polling timers"
            >
              <Pause size={14} color="#f59e0b" />
              <span>⏸ Pause</span>
            </button>
          ) : (
            onUpdateAlert && (
              <button
                onClick={() => onUpdateAlert(alert.id, { status: 'MONITORING', isActive: true })}
                className="btn btn-primary"
                style={{
                  fontSize: '0.775rem',
                  padding: '0.4rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)',
                }}
                title="Activate real-time monitoring and trigger immediate scan"
              >
                <Play size={13} fill="#070b14" />
                <span>▶ Start Monitoring</span>
              </button>
            )
          )}


          {/* ✏️ Edit Alert */}
          {onUpdateAlert && (
            <button
              onClick={() => setShowEditModal(true)}
              className="btn btn-secondary"
              style={{ fontSize: '0.775rem', padding: '0.4rem 0.75rem' }}
              title="Edit alert preferences"
            >
              <Edit3 size={14} />
              <span>✏️ Edit</span>
            </button>
          )}

          {/* Reset button if SEAT_FOUND */}
          {alert.status === 'SEAT_FOUND' && onResetStatus && (
            <button
              onClick={() => onResetStatus(alert.id)}
              className="btn btn-secondary"
              style={{
                fontSize: '0.775rem',
                padding: '0.4rem 0.75rem',
                borderColor: '#10b981',
                color: '#6ee7b7',
              }}
              title="Reset alert back to monitoring"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* History Drawer Toggle */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}
            title="Toggle scan history drawer"
          >
            <History size={13} />
            <span>History ({historyList.length})</span>
            {showHistory ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {/* 🛑 Stop Alert (Delete) */}
          <button
            onClick={() => onDelete(alert.id)}
            className="btn btn-danger"
            style={{
              fontSize: '0.75rem',
              padding: '0.35rem 0.65rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
            title="Completely stop monitoring and delete alert"
          >
            <Trash2 size={13} />
            <span>🛑 Stop Alert</span>
          </button>
        </div>
      </div>

      {/* Scan History Drawer (Collapsible list of last 5 scans) */}
      {showHistory && (
        <div
          style={{
            marginTop: '0.85rem',
            padding: '0.85rem',
            borderRadius: '8px',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            fontSize: '0.775rem',
          }}
        >
          <div style={{ fontWeight: 700, color: '#94a3b8', marginBottom: '0.5rem' }}>
            Last Scans (BST):
          </div>

          {historyList.length === 0 ? (
            <div style={{ color: 'var(--text-dim)' }}>
              No scan history recorded yet. Click <strong>⚡ Scan Now</strong> to execute a check.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {historyList.map((h, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: h.isSeatFound ? '#6ee7b7' : '#94a3b8',
                  }}
                >
                  <span style={{ fontFamily: 'monospace' }}>{h.result}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Alert Modal */}
      {showEditModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(5, 8, 16, 0.8)',
            backdropFilter: 'blur(10px)',
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
              maxWidth: '480px',
              width: '100%',
              padding: '1.75rem',
              borderRadius: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Edit Alert Preferences</h3>
              <button
                onClick={() => setShowEditModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Seat Class</label>
                <select
                  className="form-control"
                  value={editClass}
                  onChange={(e) => setEditClass(e.target.value)}
                >
                  {BANGLADESH_CLASSES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>


              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Passengers</label>
                <select
                  className="form-control"
                  value={editPassengers}
                  onChange={(e) => setEditPassengers(Number(e.target.value))}
                >
                  <option value={1}>1 Passenger</option>
                  <option value={2}>2 Passengers</option>
                  <option value={3}>3 Passengers</option>
                  <option value={4}>4 Passengers</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Preferred Coach</label>
                <input
                  type="text"
                  className="form-control"
                  value={editCoach}
                  placeholder="e.g. KHA"
                  onChange={(e) => setEditCoach(e.target.value)}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editWindow}
                  onChange={(e) => setEditWindow(e.target.checked)}
                  style={{ accentColor: '#10b981' }}
                />
                <span>Prefer Window Seats</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editAdjacent}
                  onChange={(e) => setEditAdjacent(e.target.checked)}
                  style={{ accentColor: '#10b981' }}
                />
                <span>Require Adjacent Seats</span>
              </label>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Avoid Seats</label>
                <input
                  type="text"
                  className="form-control"
                  value={editAvoid}
                  placeholder="e.g. KA-1, 12"
                  onChange={(e) => setEditAvoid(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  <Check size={16} />
                  <span>Save Changes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

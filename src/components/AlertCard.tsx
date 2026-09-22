'use client';

import React from 'react';
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
} from 'lucide-react';

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
  status: string;
  isActive: boolean;
  lastCheckedAt?: string | null;
  createdAt: string;
}

interface AlertCardProps {
  alert: AlertData;
  onToggleActive: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
  onTriggerCheck?: (id: string) => void;
  onResetStatus?: (id: string) => void;
}

export default function AlertCard({
  alert,
  onToggleActive,
  onDelete,
  onTriggerCheck,
  onResetStatus,
}: AlertCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SEAT_FOUND':
        return (
          <span className="badge badge-seat-found">
            <Zap size={13} /> SEAT FOUND!
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
            MONITORING
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="badge badge-completed">
            <CheckCircle2 size={13} /> COMPLETED
          </span>
        );
      case 'SCHEDULED':
      default:
        return (
          <span className="badge badge-scheduled">
            <Calendar size={13} /> SCHEDULED
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

  return (
    <div
      className="glass-card"
      style={{
        padding: '1.25rem 1.5rem',
        marginBottom: '1rem',
        opacity: alert.isActive ? 1 : 0.65,
        borderLeft:
          alert.status === 'SEAT_FOUND'
            ? '4px solid #10b981'
            : alert.isActive
            ? '4px solid #3b82f6'
            : '4px solid #64748b',
      }}
    >
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
        {/* Route */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
            {alert.fromStation}
          </span>
          <ArrowRight size={18} color="#10b981" />
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
            {alert.toStation}
          </span>
        </div>

        {/* Status and Class */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-class">{alert.seatClass}</span>
          {getStatusBadge(alert.status)}
        </div>
      </div>

      {/* Details Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.75rem',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          marginBottom: '1rem',
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

        {alert.trainName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Armchair size={15} color="#94a3b8" />
            <span>
              {alert.trainName} {alert.trainCode ? `(#${alert.trainCode})` : ''}
            </span>
          </div>
        )}

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
              Coach: {alert.preferredCoach}
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
              🪟 Window Preferred (+25)
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
          {alert.telegramChatId && (
            <span
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                background: 'rgba(14, 165, 233, 0.1)',
                color: '#7dd3fc',
              }}
            >
              📱 Telegram: {alert.telegramChatId}
            </span>
          )}
        </div>
      </div>

      {/* Footer Controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          fontSize: '0.75rem',
          color: 'var(--text-dim)',
        }}
      >
        <div>
          Last checked:{' '}
          {alert.lastCheckedAt
            ? new Date(alert.lastCheckedAt).toLocaleTimeString('en-US', {
                timeZone: 'Asia/Dhaka',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              }) + ' BST'
            : 'Pending initial scan'}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {alert.status === 'SEAT_FOUND' && onResetStatus && (
            <button
              onClick={() => onResetStatus(alert.id)}
              className="btn btn-secondary"
              style={{
                fontSize: '0.75rem',
                padding: '0.35rem 0.65rem',
                borderColor: '#10b981',
                color: '#6ee7b7',
              }}
              title="Reset alert back to monitoring"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}

          {onTriggerCheck && alert.isActive && (
            <button
              onClick={() => onTriggerCheck(alert.id)}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
              title="Test scan now"
            >
              <Zap size={13} color="#10b981" />
              <span>Scan</span>
            </button>
          )}

          <button
            onClick={() => onToggleActive(alert.id, alert.isActive)}
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
          >
            {alert.isActive ? (
              <>
                <Pause size={13} />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play size={13} />
                <span>Resume</span>
              </>
            )}
          </button>

          <button
            onClick={() => onDelete(alert.id)}
            className="btn btn-danger"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            title="Delete alert"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

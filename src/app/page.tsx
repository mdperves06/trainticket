'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import CountdownTimer from '@/components/CountdownTimer';
import AlertCard, { AlertData } from '@/components/AlertCard';
import SirenModal from '@/components/SirenModal';
import QuickFillModal from '@/components/QuickFillModal';
import { generateDeepSearchUrl, copyToClipboard } from '@/lib/bookmarkletGenerator';
import {
  PlusCircle,
  RefreshCw,
  Zap,
  Bell,
  CheckCircle2,
  Pause,
  Activity,
  ShieldCheck,
  AlertCircle,
  Bookmark,
} from 'lucide-react';

export default function Dashboard() {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanningAll, setScanningAll] = useState(false);
  const [activeSirenAlert, setActiveSirenAlert] = useState<AlertData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [showQuickFill, setShowQuickFill] = useState(false);

  // Track dismissed sirens in current session
  const [dismissedSirenIds, setDismissedSirenIds] = useState<Set<string>>(new Set());
  // Track auto-redirected alerts so we only auto-open once per detection
  const autoRedirectedAlertIds = useRef<Set<string>>(new Set());

  // Polling interval ref
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts');
      const data = await res.json();

      if (data.success && Array.isArray(data.alerts)) {
        setAlerts(data.alerts);

        // Check if any alert has status 'SEAT_FOUND' and hasn't been dismissed by the user yet
        const found = data.alerts.find(
          (a: AlertData) => a.status === 'SEAT_FOUND' && a.isActive && !dismissedSirenIds.has(a.id)
        );

        if (found) {
          setActiveSirenAlert(found);

          // Zero-Click Auto-Redirect & Auto-Clipboard (Immediate handoff to official portal)
          if (!autoRedirectedAlertIds.current.has(found.id)) {
            autoRedirectedAlertIds.current.add(found.id);

            const copyText = `ROUTE: ${found.fromStation} -> ${found.toStation} | DATE: ${found.journeyDate} | CLASS: ${found.seatClass} | PASSENGERS: ${found.passengerCount}${found.preferredCoach ? ` | COACH: ${found.preferredCoach}` : ''}`;
            copyToClipboard(copyText);

            const portalUrl = generateDeepSearchUrl(
              found.fromStation,
              found.toStation,
              found.journeyDate,
              found.seatClass
            );

            try {
              window.open(portalUrl, '_blank', 'noopener,noreferrer');
            } catch (err) {
              console.warn('Auto-redirect window.open blocked by browser:', err);
            }
          }
        }


        setLastUpdated(
          new Date().toLocaleTimeString('en-US', {
            timeZone: 'Asia/Dhaka',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          })
        );
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [dismissedSirenIds]);

  // Initial fetch on mount
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Controlled Background Polling:
  // ONLY run timer if there is at least one active alert with status === 'MONITORING'
  useEffect(() => {
    const monitoringAlerts = alerts.filter((a) => a.isActive && a.status === 'MONITORING');

    if (monitoringAlerts.length > 0) {
      // Set 30-second controlled polling
      pollingRef.current = setInterval(() => {
        fetch('/api/check', { method: 'POST' })
          .then(() => fetchAlerts())
          .catch((err) => console.error('Background poll failed:', err));
      }, 30000);
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [alerts, fetchAlerts]);

  // Global Status Evaluation
  const activeAlerts = alerts.filter((a) => a.isActive);
  const monitoringCount = alerts.filter((a) => a.isActive && a.status === 'MONITORING').length;
  const pausedCount = alerts.filter((a) => a.isActive && a.status === 'PAUSED').length;
  const seatsFoundCount = alerts.filter((a) => a.status === 'SEAT_FOUND').length;

  const getGlobalStatusBadge = () => {
    if (activeAlerts.length === 0) {
      return (
        <span
          className="badge"
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
            color: '#34d399',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            fontSize: '0.85rem',
            padding: '0.35rem 0.85rem',
          }}
        >
          🟢 IDLE — System Resting
        </span>
      );
    }

    if (monitoringCount === 0 && pausedCount > 0) {
      return (
        <span
          className="badge"
          style={{
            background: 'rgba(100, 116, 139, 0.15)',
            color: '#94a3b8',
            border: '1px solid rgba(100, 116, 139, 0.3)',
            fontSize: '0.85rem',
            padding: '0.35rem 0.85rem',
          }}
        >
          ⏸ PAUSED — No background requests
        </span>
      );
    }

    if (monitoringCount > 0) {
      return (
        <span
          className="badge"
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            fontSize: '0.85rem',
            padding: '0.35rem 0.85rem',
          }}
        >
          🔴 MONITORING — Active ({monitoringCount} monitored)
        </span>
      );
    }

    return (
      <span
        className="badge"
        style={{
          background: 'rgba(16, 185, 129, 0.1)',
          color: '#34d399',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          fontSize: '0.85rem',
          padding: '0.35rem 0.85rem',
        }}
      >
        🟢 IDLE — System Resting
      </span>
    );
  };

  // Targeted single scan for specific alert
  const handleTargetedScan = async (alertId: string) => {
    try {
      const res = await fetch(`/api/check?alertId=${encodeURIComponent(alertId)}`, {
        method: 'POST',
      });
      await res.json();
      await fetchAlerts();
    } catch (err) {
      console.error('Targeted scan failed:', err);
    }
  };

  // Toggle Pause / Resume
  const handleTogglePause = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'PAUSED' ? 'MONITORING' : 'PAUSED';
    try {
      await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      await fetchAlerts();
    } catch (err) {
      console.error('Toggle pause failed:', err);
    }
  };

  // Reset alert back to MONITORING
  const handleResetStatus = async (id: string) => {
    try {
      await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'MONITORING' }),
      });
      setDismissedSirenIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await fetchAlerts();
    } catch (err) {
      console.error('Reset status failed:', err);
    }
  };

  // Update alert preferences
  const handleUpdateAlert = async (id: string, updatedFields: Partial<AlertData>) => {
    try {
      await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updatedFields }),
      });
      await fetchAlerts();
    } catch (err) {
      console.error('Update alert failed:', err);
    }
  };

  // Delete / Stop alert
  const handleDeleteAlert = async (id: string) => {
    if (!confirm('Are you sure you want to stop and delete this alert?')) return;
    try {
      await fetch(`/api/alerts?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      await fetchAlerts();
    } catch (err) {
      console.error('Delete alert failed:', err);
    }
  };

  // Siren Modal Dismissal Handlers
  const handleSilenceSirenOnly = () => {
    if (activeSirenAlert) {
      setDismissedSirenIds((prev) => {
        const next = new Set(prev);
        next.add(activeSirenAlert.id);
        return next;
      });
    }
  };

  const handleStopAndDismissAlert = async () => {
    if (!activeSirenAlert) return;
    const alertId = activeSirenAlert.id;
    try {
      await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: alertId, status: 'COMPLETED', isActive: false }),
      });
      setDismissedSirenIds((prev) => {
        const next = new Set(prev);
        next.add(alertId);
        return next;
      });
      setActiveSirenAlert(null);
      await fetchAlerts();
    } catch (err) {
      console.error('Stop alert failed:', err);
    }
  };

  // Test simulation trigger
  const handleSimulateDrop = async () => {
    setScanningAll(true);
    try {
      await fetch('/api/check?simulateDrop=true', { method: 'POST' });
      await fetchAlerts();
    } catch (err) {
      console.error('Simulate drop failed:', err);
    } finally {
      setScanningAll(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '1.75rem' }}>
      {/* Upgraded Siren Modal */}
      {activeSirenAlert && (
        <SirenModal
          alert={activeSirenAlert}
          onSilenceOnly={handleSilenceSirenOnly}
          onStopAndDismiss={handleStopAndDismissAlert}
        />
      )}

      {/* Speed-Booking & Auto-Fill Suite Modal */}
      <QuickFillModal
        isOpen={showQuickFill}
        onClose={() => setShowQuickFill(false)}
        defaultFrom={alerts[0]?.fromStation || 'Chattogram'}
        defaultTo={alerts[0]?.toStation || 'Dhaka'}
        defaultDate={alerts[0]?.journeyDate}
        defaultClass={alerts[0]?.seatClass || 'S_CHAIR'}
      />

      {/* Countdown Timer to 8:00 AM BST */}
      <CountdownTimer />

      {/* Header & Global Status Indicator */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <h1 style={{ fontSize: '1.75rem' }}>Active Train Alerts</h1>
            {getGlobalStatusBadge()}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Strict Exact-Match engine. Zero background queries when idle or paused.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            onClick={() => setShowQuickFill(true)}
            className="btn btn-secondary"
            style={{
              fontSize: '0.85rem',
              borderColor: 'rgba(59, 130, 246, 0.4)',
              color: '#93c5fd',
            }}
            title="Open 1-Tap Mobile Bookmarklet & Speed-Booking Suite"
          >
            <Bookmark size={15} />
            <span>🚀 Speed Booking</span>
          </button>

          <button
            onClick={handleSimulateDrop}
            disabled={scanningAll}
            className="btn btn-secondary"
            style={{
              fontSize: '0.85rem',
              borderColor: 'rgba(16, 185, 129, 0.4)',
              color: '#34d399',
            }}
            title="Simulate ticket release burst to verify Siren & HITL modal"
          >
            <Zap size={15} />
            <span>{scanningAll ? 'Simulating...' : '⚡ Test Drop'}</span>
          </button>

          <Link href="/create-alert" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
            <PlusCircle size={16} />
            <span>New Alert</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div className="glass-card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Alerts</span>
            <Bell size={16} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.35rem' }}>
            {activeAlerts.length}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Monitoring</span>
            <Activity size={16} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.35rem' }}>
            {monitoringCount}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Paused</span>
            <Pause size={16} color="#94a3b8" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#94a3b8', marginTop: '0.35rem' }}>
            {pausedCount}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Seats Found</span>
            <Zap size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: '0.35rem' }}>
            {seatsFoundCount}
          </div>
        </div>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div
          className="glass-card"
          style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}
        >
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
          <div>Loading your alerts...</div>
        </div>
      ) : alerts.length === 0 ? (
        <div
          className="glass-card"
          style={{
            padding: '3.5rem 1.5rem',
            textAlign: 'center',
            borderRadius: '16px',
            border: '1px dashed rgba(255, 255, 255, 0.15)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <Bell size={28} />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>System Resting (0 Alerts)</h3>
          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-muted)',
              maxWidth: '440px',
              margin: '0 auto 1.5rem',
            }}
          >
            Create an alert with your chosen route and journey date. Monitoring will only begin when you explicitly click Start Monitoring.
          </p>
          <Link href="/create-alert" className="btn btn-primary">
            <PlusCircle size={16} />
            <span>Create Smart Seat Alert</span>
          </Link>
        </div>
      ) : (
        <div>
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onTogglePause={handleTogglePause}
              onDelete={handleDeleteAlert}
              onTriggerTargetedScan={handleTargetedScan}
              onResetStatus={handleResetStatus}
              onUpdateAlert={handleUpdateAlert}
            />
          ))}
        </div>
      )}
    </div>
  );
}

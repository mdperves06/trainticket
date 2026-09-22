'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import CountdownTimer from '@/components/CountdownTimer';
import AlertCard, { AlertData } from '@/components/AlertCard';
import SirenBanner from '@/components/SirenBanner';
import { PlusCircle, RefreshCw, Zap, Bell, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function Dashboard() {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [activeSirenAlert, setActiveSirenAlert] = useState<AlertData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const [dismissedSirenIds, setDismissedSirenIds] = useState<Set<string>>(new Set());

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
        }

        setLastUpdated(
          new Date().toLocaleTimeString('en-US', {
            timeZone: 'Asia/Dhaka',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        );
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [dismissedSirenIds]);

  useEffect(() => {
    fetchAlerts();
    // Poll alerts every 8 seconds
    const interval = setInterval(fetchAlerts, 8000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleDismissSiren = (id: string) => {
    setDismissedSirenIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setActiveSirenAlert(null);
  };

  const handleResetStatus = async (id: string) => {
    try {
      await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'MONITORING' }),
      });
      // Allow future sirens for this alert if seats drop again
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

  const handleTriggerManualCheck = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/check', { method: 'POST' });
      await res.json();
      await fetchAlerts();
    } catch (err) {
      console.error('Manual check failed:', err);
    } finally {
      setScanning(false);
    }
  };

  const handleSimulateDrop = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/check?simulateDrop=true', { method: 'POST' });
      await res.json();
      await fetchAlerts();
    } catch (err) {
      console.error('Simulate drop failed:', err);
    } finally {
      setScanning(false);
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !current }),
      });
      await fetchAlerts();
    } catch (err) {
      console.error('Toggle alert failed:', err);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    if (!confirm('Are you sure you want to remove this alert?')) return;
    try {
      await fetch(`/api/alerts?id=${id}`, { method: 'DELETE' });
      await fetchAlerts();
    } catch (err) {
      console.error('Delete alert failed:', err);
    }
  };

  const activeCount = alerts.filter((a) => a.isActive).length;
  const seatsFoundCount = alerts.filter((a) => a.status === 'SEAT_FOUND').length;

  return (
    <div className="container" style={{ paddingTop: '1.75rem' }}>
      {/* Siren Emergency Modal */}
      {activeSirenAlert && (
        <SirenBanner
          alert={activeSirenAlert}
          onDismiss={() => handleDismissSiren(activeSirenAlert.id)}
        />
      )}

      {/* Hero & Countdown */}
      <CountdownTimer />

      {/* Dashboard Stats & Header */}
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
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
            Active Train Alerts
          </h1>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Real-time monitoring for ticket drop bursts and daytime cancellations.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            onClick={handleTriggerManualCheck}
            disabled={scanning}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem' }}
            title="Scan official availability"
          >
            <RefreshCw size={15} className={scanning ? 'animate-spin' : ''} />
            <span>{scanning ? 'Scanning...' : 'Scan Now'}</span>
          </button>

          <button
            onClick={handleSimulateDrop}
            disabled={scanning}
            className="btn btn-secondary"
            style={{
              fontSize: '0.85rem',
              borderColor: 'rgba(16, 185, 129, 0.4)',
              color: '#34d399',
            }}
            title="Simulate 8:00 AM BST seat drop burst to test siren & notification"
          >
            <Zap size={15} />
            <span>Test Drop</span>
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
            {activeCount}
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

        <div className="glass-card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Last Scan (BST)</span>
            <CheckCircle2 size={16} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.5rem', color: '#cbd5e1' }}>
            {lastUpdated ? `${lastUpdated} BST` : 'Connecting...'}
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
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Active Alerts Yet</h3>
          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-muted)',
              maxWidth: '420px',
              margin: '0 auto 1.5rem',
            }}
          >
            Create your first alert to start monitoring 8:00 AM BST ticket drops and real-time seat cancellations.
          </p>
          <Link href="/create-alert" className="btn btn-primary">
            <PlusCircle size={16} />
            <span>Create Your First Alert</span>
          </Link>
        </div>
      ) : (
        <div>
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onToggleActive={handleToggleActive}
              onDelete={handleDeleteAlert}
              onTriggerCheck={handleTriggerManualCheck}
              onResetStatus={handleResetStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}

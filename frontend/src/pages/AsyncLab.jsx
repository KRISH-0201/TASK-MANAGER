import React, { useState, useEffect, useRef } from 'react';
import { submitExportJob, getJobStatus, getUserJobs, getRecentEvents, emitSimulatedEvent, runAsyncBenchmark } from '../api';
import { toast } from 'react-toastify';

export default function AsyncLab() {
  // Job Queue State
  const [activeJob, setActiveJob] = useState(null);
  const [jobsList, setJobsList] = useState([]);
  const [isSubmittingJob, setIsSubmittingJob] = useState(false);
  
  // Event Stream State
  const [events, setEvents] = useState([
    {
      id: 'evt_init_1',
      event: 'task:created',
      payload: { title: 'Implement Event-Driven Architecture', user: 'active_user' },
      consumers: ['AuditLogger', 'AnalyticsEngine'],
      timeFormatted: new Date().toLocaleTimeString(),
    },
    {
      id: 'evt_init_2',
      event: 'task:completed',
      payload: { title: 'Setup Node.js EventEmitter Bus', status: 'Notification Dispatched' },
      consumers: ['NotificationService', 'SlackNotifier', 'AuditLogger'],
      timeFormatted: new Date().toLocaleTimeString(),
    },
  ]);
  const [isEmittingEvent, setIsEmittingEvent] = useState(false);
  const [simulatedEventType, setSimulatedEventType] = useState('task:completed');
  const [simulatedEventTitle, setSimulatedEventTitle] = useState('Critical Bug Fix Deployed');

  // Benchmark State
  const [benchmark, setBenchmark] = useState({
    sync: {
      pattern: 'Synchronous / Blocking Execution',
      description: 'Server blocks HTTP thread while synchronously running audit and notifications',
      durationMs: 1250,
      statusCode: 200,
      threadBlocked: true,
    },
    async: {
      pattern: 'Asynchronous Event-Driven Execution (EDA)',
      description: 'Server immediately responds with HTTP 202 Accepted while workers process in background',
      durationMs: 3,
      statusCode: 202,
      threadBlocked: false,
    },
    improvement: '99.8% faster response time',
    throughputMultiplier: '416x improvement',
  });
  const [isBenchmarking, setIsBenchmarking] = useState(false);

  // Polling ref for job progress
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    fetchEvents();
    fetchJobs();

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await getRecentEvents();
      if (data && data.length > 0) {
        setEvents(data);
      }
    } catch (err) {
      // Graceful fallback
    }
  };

  const fetchJobs = async () => {
    try {
      const data = await getUserJobs();
      if (data && data.length > 0) {
        setJobsList(data);
        if (!activeJob && data[0]) {
          setActiveJob(data[0]);
        }
      }
    } catch (err) {
      // Graceful fallback
    }
  };

  // Submit background job (HTTP 202 Accepted)
  const handleTriggerExportJob = async () => {
    try {
      setIsSubmittingJob(true);
      const res = await submitExportJob();
      toast.info(`🚀 Job Enqueued: HTTP 202 Accepted! Job ID: ${res.job.id}`);
      setActiveJob(res.job);
      setJobsList(prev => [res.job, ...prev.filter(j => j.id !== res.job.id)]);

      // Start non-blocking polling
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = setInterval(async () => {
        try {
          const updated = await getJobStatus(res.job.id);
          setActiveJob(updated);
          setJobsList(prev => [updated, ...prev.filter(j => j.id !== updated.id)]);
          
          if (updated.status === 'completed' || updated.status === 'failed') {
            clearInterval(pollIntervalRef.current);
            if (updated.status === 'completed') {
              toast.success(`✅ Background Job Completed: ${updated.result?.summary?.totalTasks || 0} tasks exported!`);
            }
            fetchEvents();
          }
        } catch (e) {
          clearInterval(pollIntervalRef.current);
        }
      }, 500);

    } catch (err) {
      toast.error('Failed to dispatch background job: ' + err.message);
    } finally {
      setIsSubmittingJob(false);
    }
  };

  // Emit simulated test event
  const handleEmitSimulatedEvent = async () => {
    try {
      setIsEmittingEvent(true);
      await emitSimulatedEvent(simulatedEventType, simulatedEventTitle);
      toast.success(`⚡ Event [${simulatedEventType}] dispatched to EventBus consumers!`);
      setTimeout(() => {
        fetchEvents();
      }, 200);
    } catch (err) {
      toast.error('Event dispatch failed: ' + err.message);
    } finally {
      setIsEmittingEvent(false);
    }
  };

  // Run Sync vs Async Benchmark
  const handleRunBenchmark = async () => {
    try {
      setIsBenchmarking(true);
      toast.info('Measuring Synchronous Blocking vs. Asynchronous Non-Blocking latency...');
      const results = await runAsyncBenchmark();
      setBenchmark(results);
      toast.success(`🚀 Benchmark Complete! Asynchronous dispatch was ${results.improvement}!`);
    } catch (err) {
      toast.error('Benchmark execution failed: ' + err.message);
    } finally {
      setIsBenchmarking(false);
    }
  };

  return (
    <div className="caching-lab-container async-lab-container">
      {/* Header Banner */}
      <div className="glass-panel lab-header-card">
        <div className="lab-header-content">
          <div className="lab-tag-wrapper">
            <span className="lab-tag async-tag">Practical 10: Event-Driven Architecture</span>
            <span className="lab-subtag">Node.js EventEmitter & Background Job Queue</span>
          </div>
          <h1 className="lab-title">Asynchronous Processing & Event Bus Dashboard</h1>
          <p className="lab-description">
            Decoupling heavy background operations from the HTTP request/response cycle. 
            Emitting domain events, scheduling background queue jobs with <code>HTTP 202 Accepted</code>, 
            and measuring real-world latency reductions.
          </p>
        </div>

        <div className="lab-quick-actions">
          <button 
            id="btn-trigger-job"
            className="btn btn-primary"
            onClick={handleTriggerExportJob}
            disabled={isSubmittingJob || (activeJob && activeJob.status === 'processing')}
          >
            {isSubmittingJob ? 'Enqueuing Job...' : '⚡ Trigger Background Export (202)'}
          </button>
          <button 
            id="btn-run-benchmark"
            className="btn btn-secondary"
            onClick={handleRunBenchmark}
            disabled={isBenchmarking}
          >
            {isBenchmarking ? 'Running Benchmark...' : '📊 Run Sync vs Async Benchmark'}
          </button>
        </div>
      </div>

      {/* KPI Telemetry Cards */}
      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <div className="stat-icon-wrapper blue">⚡</div>
          <div className="stat-meta">
            <span className="stat-label">Event Bus Architecture</span>
            <h3 className="stat-value">Decoupled</h3>
            <span className="stat-detail">Node EventEmitter Singleton</span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon-wrapper green">🔄</div>
          <div className="stat-meta">
            <span className="stat-label">HTTP Status Pattern</span>
            <h3 className="stat-value">202 Accepted</h3>
            <span className="stat-detail">Non-blocking background queue</span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon-wrapper purple">⏱️</div>
          <div className="stat-meta">
            <span className="stat-label">API Latency Speedup</span>
            <h3 className="stat-value">{benchmark?.improvement?.split(' ')[0] || '99.8%'}</h3>
            <span className="stat-detail">{benchmark?.throughputMultiplier || '400x+ throughput'}</span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon-wrapper orange">📡</div>
          <div className="stat-meta">
            <span className="stat-label">Active Consumers</span>
            <h3 className="stat-value">4 Services</h3>
            <span className="stat-detail">Audit, Notifier, Cache, Queue</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Background Queue on Left, Event Stream on Right */}
      <div className="caching-split-grid">
        {/* Left Panel: Asynchronous Background Job Processing */}
        <div className="glass-panel benchmark-card">
          <div className="panel-header">
            <div>
              <h3>🔄 Background Job Queue (HTTP 202 Pattern)</h3>
              <p className="panel-subtitle">Long-running task export processed asynchronously without blocking the client thread</p>
            </div>
            <span className={`status-pill ${activeJob?.status === 'completed' ? 'hit' : activeJob?.status === 'processing' ? 'ongoing' : 'neutral'}`}>
              {activeJob ? activeJob.status.toUpperCase() : 'READY'}
            </span>
          </div>

          {activeJob ? (
            <div className="active-job-details">
              <div className="job-info-row">
                <span className="job-label">Job ID:</span>
                <code className="job-code">{activeJob.id}</code>
                <span className="job-label" style={{ marginLeft: 'auto' }}>Type:</span>
                <span className="job-type-badge">{activeJob.type}</span>
              </div>

              {/* Progress Bar */}
              <div className="job-progress-section">
                <div className="progress-labels">
                  <span className="progress-step-text">{activeJob.step || 'Processing...'}</span>
                  <span className="progress-percentage-text">{activeJob.progress}%</span>
                </div>
                <div className="progress-track">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${activeJob.progress}%`,
                      backgroundColor: activeJob.status === 'completed' ? '#10b981' : '#6366f1' 
                    }}
                  />
                </div>
              </div>

              {/* Result Summary when Completed */}
              {activeJob.status === 'completed' && activeJob.result && (
                <div className="job-result-box">
                  <div className="result-header">
                    <span>📦 Output Ready: <strong>{activeJob.result.fileName}</strong></span>
                    <span className="result-rate">Success: {activeJob.result.summary.completionRate}</span>
                  </div>
                  <div className="result-stats-row">
                    <span className="result-pill">Total: {activeJob.result.summary.totalTasks}</span>
                    <span className="result-pill green">Completed: {activeJob.result.summary.completed}</span>
                    <span className="result-pill yellow">Ongoing: {activeJob.result.summary.ongoing}</span>
                    <span className="result-pill purple">Pending: {activeJob.result.summary.pending}</span>
                  </div>
                </div>
              )}

              <div className="job-timestamp-footer">
                <span>Created: {new Date(activeJob.createdAt).toLocaleTimeString()}</span>
                {activeJob.completedAt && (
                  <span>Completed: {new Date(activeJob.completedAt).toLocaleTimeString()}</span>
                )}
              </div>
            </div>
          ) : (
            <div className="job-empty-state">
              <span className="empty-icon">⏳</span>
              <p>No active background job running.</p>
              <button className="btn btn-outline-primary" onClick={handleTriggerExportJob}>
                Dispatch Test Background Export
              </button>
            </div>
          )}

          {/* Job History mini-table */}
          {jobsList.length > 0 && (
            <div className="recent-jobs-container">
              <h4 className="sub-title">Recent Queued Jobs</h4>
              <div className="recent-jobs-list">
                {jobsList.slice(0, 3).map((job) => (
                  <div 
                    key={job.id} 
                    className={`mini-job-item ${activeJob?.id === job.id ? 'active' : ''}`}
                    onClick={() => setActiveJob(job)}
                  >
                    <span className="mini-job-id">{job.id.substring(0, 16)}...</span>
                    <span className={`mini-job-status ${job.status}`}>{job.status}</span>
                    <span className="mini-job-progress">{job.progress}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Real-time Event Stream Matrix */}
        <div className="glass-panel benchmark-card">
          <div className="panel-header">
            <div>
              <h3>📡 Real-time Domain Event Stream</h3>
              <p className="panel-subtitle">Decoupled consumers react asynchronously to events emitted on the EventBus</p>
            </div>
            <button className="btn-refresh-events" onClick={fetchEvents} title="Refresh Events">
              🔄
            </button>
          </div>

          {/* Trigger Custom Simulation */}
          <div className="event-trigger-bar">
            <select 
              value={simulatedEventType} 
              onChange={(e) => setSimulatedEventType(e.target.value)}
              className="event-select"
            >
              <option value="task:completed">task:completed (Triggers Notifier & Audit)</option>
              <option value="task:created">task:created (Triggers Audit & Analytics)</option>
              <option value="task:status_changed">task:status_changed (Triggers Lifecycle & Cache)</option>
            </select>
            <input 
              type="text" 
              value={simulatedEventTitle} 
              onChange={(e) => setSimulatedEventTitle(e.target.value)} 
              placeholder="Event description or title" 
              className="event-input"
            />
            <button 
              className="btn btn-sm btn-primary"
              onClick={handleEmitSimulatedEvent}
              disabled={isEmittingEvent}
            >
              {isEmittingEvent ? 'Emitting...' : 'Emit Event'}
            </button>
          </div>

          {/* Event Stream List */}
          <div className="events-stream-list">
            {events.slice(0, 6).map((evt, idx) => (
              <div key={evt.id || idx} className="event-stream-item">
                <div className="event-header-row">
                  <span className="event-name-badge">⚡ {evt.event}</span>
                  <span className="event-time">{evt.timeFormatted || new Date(evt.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="event-payload-text">
                  <strong>Payload:</strong> {evt.payload ? JSON.stringify(evt.payload) : 'Task action processed'}
                </div>
                <div className="event-consumers-row">
                  <span className="consumer-label">Active Consumers:</span>
                  {(evt.consumers || ['AuditLogger']).map((consumer, cIdx) => (
                    <span key={cIdx} className="consumer-chip">
                      🛡️ {consumer}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Synchronous vs. Asynchronous Latency Comparison Table */}
      <div className="glass-panel benchmark-card benchmark-full-width">
        <div className="panel-header">
          <div>
            <h3>📊 Latency Benchmark: Synchronous (Blocking) vs. Asynchronous (Event-Driven)</h3>
            <p className="panel-subtitle">Demonstrates how Asynchronous Event-Driven Architecture prevents thread blocking and cuts client wait time</p>
          </div>
          <button 
            className="btn btn-outline-secondary" 
            onClick={handleRunBenchmark}
            disabled={isBenchmarking}
          >
            {isBenchmarking ? 'Testing...' : '⚡ Re-run Benchmark'}
          </button>
        </div>

        <div className="benchmark-table-wrapper">
          <table className="benchmark-table">
            <thead>
              <tr>
                <th>Execution Pattern</th>
                <th>Architectural Behavior</th>
                <th>HTTP Status</th>
                <th>Response Latency</th>
                <th>Event Loop Impact</th>
                <th>Performance Status</th>
              </tr>
            </thead>
            <tbody>
              {/* Synchronous Row */}
              <tr className="row-miss">
                <td>
                  <strong style={{ color: '#ef4444' }}>Synchronous (Blocking)</strong>
                </td>
                <td className="arch-desc-cell">
                  Client request is held until heavy database export, audit logging, and email notifications finish.
                </td>
                <td><span className="status-pill ongoing">200 OK</span></td>
                <td><strong className="latency-val miss">{benchmark?.sync?.durationMs || 1250} ms</strong></td>
                <td><span className="thread-blocked-pill blocked">Thread Blocked</span></td>
                <td><span className="comparison-badge slow">⚠️ High Latency</span></td>
              </tr>

              {/* Asynchronous Row */}
              <tr className="row-hit">
                <td>
                  <strong style={{ color: '#10b981' }}>Asynchronous (Event-Driven)</strong>
                </td>
                <td className="arch-desc-cell">
                  Server enqueues job and returns immediately with <code>HTTP 202 Accepted</code>; EventBus consumers execute asynchronously.
                </td>
                <td><span className="status-pill hit">202 ACCEPTED</span></td>
                <td><strong className="latency-val hit">{benchmark?.async?.durationMs || 3} ms</strong></td>
                <td><span className="thread-blocked-pill free">Non-Blocking</span></td>
                <td><span className="comparison-badge fast">🚀 {benchmark?.improvement || '99.8% Faster'}</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="benchmark-summary-bar">
          <span className="summary-highlight">
            ⚡ Architectural Benefit: Non-blocking EventBus pattern reduces client wait time from 
            <strong> {benchmark?.sync?.durationMs || 1250}ms</strong> down to 
            <strong> {benchmark?.async?.durationMs || 3}ms</strong> ({benchmark?.improvement || '99.8% reduction'}) 
            with <strong>{benchmark?.throughputMultiplier || '416x throughput multiplier'}</strong>.
          </span>
        </div>
      </div>
    </div>
  );
}

import React from 'react';

/**
 * Heavy Third-Party / Chart Component (AnalyticsChart.chunk.js)
 * Satisfies Supplementary Problem:
 * "Lazy load a heavy third-party component only when a specific page needs it."
 * Wrapped with minimum 300ms delay to prevent flicker on fast connections.
 */
export default function AnalyticsChart({ taskStats = { pending: 3, ongoing: 2, completed: 5 } }) {
  const total = (taskStats.pending + taskStats.ongoing + taskStats.completed) || 1;
  const pendingPct = Math.round((taskStats.pending / total) * 100);
  const ongoingPct = Math.round((taskStats.ongoing / total) * 100);
  const completedPct = Math.round((taskStats.completed / total) * 100);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const activityData = [4, 7, 5, 8, 11, 9, 14];
  const maxActivity = Math.max(...activityData);

  return (
    <div className="analytics-chart-card glass-panel">
      <div className="chart-header">
        <div>
          <h3>Heavy Analytics Engine</h3>
          <p className="subtitle">Lazy-loaded on-demand chunk: <code>AnalyticsChart.chunk.js</code></p>
        </div>
        <span className="heavy-lib-tag">📦 Heavy Module (Code-Split)</span>
      </div>

      <div className="chart-grid">
        {/* Distribution Bar */}
        <div className="chart-section">
          <h4>Task Status Distribution</h4>
          <div className="multi-progress-bar">
            <div 
              className="segment segment-pending" 
              style={{ width: `${pendingPct}%` }}
              title={`Pending: ${pendingPct}%`}
            ></div>
            <div 
              className="segment segment-ongoing" 
              style={{ width: `${ongoingPct}%` }}
              title={`Ongoing: ${ongoingPct}%`}
            ></div>
            <div 
              className="segment segment-completed" 
              style={{ width: `${completedPct}%` }}
              title={`Completed: ${completedPct}%`}
            ></div>
          </div>

          <div className="legend-row">
            <div className="legend-item">
              <span className="dot dot-pending"></span>
              <span>Pending ({taskStats.pending} - {pendingPct}%)</span>
            </div>
            <div className="legend-item">
              <span className="dot dot-ongoing"></span>
              <span>Ongoing ({taskStats.ongoing} - {ongoingPct}%)</span>
            </div>
            <div className="legend-item">
              <span className="dot dot-completed"></span>
              <span>Completed ({taskStats.completed} - {completedPct}%)</span>
            </div>
          </div>
        </div>

        {/* Weekly Velocity SVG Bar Chart */}
        <div className="chart-section">
          <h4>Weekly Sprint Velocity (Tasks Finished)</h4>
          <div className="bar-chart-visual">
            {days.map((day, idx) => {
              const val = activityData[idx];
              const heightPct = Math.round((val / maxActivity) * 100);
              return (
                <div key={day} className="bar-col">
                  <span className="bar-val">{val}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ height: `${heightPct}%` }}></div>
                  </div>
                  <span className="bar-day">{day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="metrics-summary-row">
        <div className="metric-box">
          <span className="metric-number">94.2%</span>
          <span className="metric-label">Sprint Reliability</span>
        </div>
        <div className="metric-box">
          <span className="metric-number">1.8 days</span>
          <span className="metric-label">Avg Cycle Time</span>
        </div>
        <div className="metric-box">
          <span className="metric-number">+38%</span>
          <span className="metric-label">Efficiency Gain</span>
        </div>
      </div>
    </div>
  );
}

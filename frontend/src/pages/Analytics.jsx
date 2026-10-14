import React, { useState, useCallback, Suspense } from 'react';
import lazyWithDelay from '../utils/lazyWithDelay';
import LoadingFallback from '../components/LoadingFallback';

// Supplementary Problem 1 & 2: Lazy load heavy component with min 300ms delay to prevent flicker
const LazyAnalyticsChart = lazyWithDelay(() => import('../components/AnalyticsChart'), 350);

/**
 * Child component demonstrating unnecessary re-renders
 * When not memoized, it re-renders every time parent state changes even if props didn't change!
 */
const UnmemoizedChild = ({ count, onAction }) => {
  const renderRef = React.useRef(0);
  renderRef.current += 1;

  return (
    <div className="profiler-child-box unmemoized">
      <h4>❌ Standard (Unmemoized) Component</h4>
      <p>Render Count: <strong className="render-counter badge-danger">{renderRef.current}</strong></p>
      <p className="profiler-desc">Re-renders on EVERY parent state update (unnecessary re-render!).</p>
      <button onClick={onAction} className="btn-small">Fire Action</button>
    </div>
  );
};

/**
 * Optimized child component using React.memo
 * It ONLY re-renders when its specific props genuinely change!
 */
const MemoizedChild = React.memo(({ count, onAction }) => {
  const renderRef = React.useRef(0);
  renderRef.current += 1;

  return (
    <div className="profiler-child-box memoized">
      <h4>✅ Optimized with React.memo()</h4>
      <p>Render Count: <strong className="render-counter badge-success">{renderRef.current}</strong></p>
      <p className="profiler-desc">Skips render when unrelated parent state changes.</p>
      <button onClick={onAction} className="btn-small">Fire Action</button>
    </div>
  );
});

export default function Analytics({ tasks = [] }) {
  const [parentCounter, setParentCounter] = useState(0);
  const [unrelatedInput, setUnrelatedInput] = useState('');
  const [showChart, setShowChart] = useState(true);

  // Memoized callback to prevent child re-render
  const handleOptimizedAction = useCallback(() => {
    alert('Optimized callback triggered!');
  }, []);

  const handleUnoptimizedAction = () => {
    alert('Standard callback triggered!');
  };

  const taskStats = {
    pending: tasks.filter(t => t.status === 'pending').length,
    ongoing: tasks.filter(t => t.status === 'ongoing').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  return (
    <div className="page-container page-analytics">
      <header className="page-header glass-panel">
        <div>
          <h1>Performance Analytics & Profiler</h1>
          <p className="subtitle">
            Supplementary Practical Tasks: Heavy Component Lazy Loading + Profiler Optimization
          </p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => setShowChart(prev => !prev)}
        >
          {showChart ? 'Hide Heavy Chart' : 'Mount Heavy Chart (Lazy)'}
        </button>
      </header>

      {/* Heavy Component Lazy Loading Demo with Suspense */}
      {showChart && (
        <Suspense fallback={<LoadingFallback pageName="Heavy Analytics Chart" />}>
          <LazyAnalyticsChart taskStats={taskStats} />
        </Suspense>
      )}

      {/* Profiler / Unnecessary Re-render Demonstration */}
      <div className="profiler-section glass-panel">
        <div className="profiler-header">
          <div>
            <h3>React DevTools Profiler: Unnecessary Re-Render Analysis</h3>
            <p className="subtitle">
              Typing in the input below updates parent state. Watch how the unmemoized child re-renders continuously, while <code>React.memo()</code> prevents wasteful re-renders.
            </p>
          </div>
        </div>

        <div className="profiler-controls">
          <input
            type="text"
            placeholder="Type here to trigger parent re-renders..."
            value={unrelatedInput}
            onChange={(e) => setUnrelatedInput(e.target.value)}
            className="profiler-input"
          />
          <button 
            className="btn-primary"
            onClick={() => setParentCounter(c => c + 1)}
          >
            Increment Parent State ({parentCounter})
          </button>
        </div>

        <div className="profiler-comparison-grid">
          <UnmemoizedChild 
            count={parentCounter} 
            onAction={handleUnoptimizedAction} 
          />
          <MemoizedChild 
            count={parentCounter} 
            onAction={handleOptimizedAction} 
          />
        </div>

        <div className="profiler-notes">
          <h4>📌 Profiler Takeaway for Lab Report</h4>
          <p>
            When profiling with <strong>React DevTools Profiler</strong>:
            Components with unchanged props should show as <em>"Did not render"</em> (gray).
            Unmemoized functions recreated each render trigger false prop-change re-renders.
            Using <code>useCallback</code> for handler functions and <code>React.memo</code> for child components completely eliminates unnecessary renders!
          </p>
        </div>
      </div>
    </div>
  );
}

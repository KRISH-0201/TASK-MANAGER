import React from 'react';

/**
 * Meaningful Suspense fallback UI rendered while lazy-loaded route chunks are streaming.
 * Includes skeleton placeholders and chunk loading indicator to prevent Cumulative Layout Shift (CLS).
 */
export default function LoadingFallback({ pageName = 'Page' }) {
  return (
    <div className="lazy-fallback-container glass-panel">
      <div className="lazy-fallback-header">
        <div className="chunk-spinner"></div>
        <div className="fallback-text-group">
          <h3>Loading {pageName} Chunk...</h3>
          <p className="chunk-badge">Dynamic import via React.lazy() & Suspense</p>
        </div>
      </div>

      <div className="chunk-progress-bar">
        <div className="chunk-progress-fill"></div>
      </div>

      {/* Skeleton placeholders to avoid layout shift */}
      <div className="skeleton-grid">
        <div className="skeleton-card skeleton-pulse">
          <div className="skeleton-line short"></div>
          <div className="skeleton-line long"></div>
          <div className="skeleton-line medium"></div>
        </div>
        <div className="skeleton-card skeleton-pulse">
          <div className="skeleton-line short"></div>
          <div className="skeleton-line long"></div>
          <div className="skeleton-line medium"></div>
        </div>
        <div className="skeleton-card skeleton-pulse">
          <div className="skeleton-line short"></div>
          <div className="skeleton-line long"></div>
          <div className="skeleton-line medium"></div>
        </div>
      </div>
    </div>
  );
}

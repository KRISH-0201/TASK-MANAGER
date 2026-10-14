import { lazy } from 'react';

/**
 * Higher-order utility to wrap React.lazy with an artificial minimum delay
 * This prevents the loading fallback from rapidly flashing on fast networks (flicker prevention).
 * 
 * @param {Function} importFunc - The dynamic import function, e.g. () => import('./MyComponent')
 * @param {number} minDelay - Minimum duration in ms to hold the loading state (default 300ms)
 * @returns {React.LazyExoticComponent}
 */
export function lazyWithDelay(importFunc, minDelay = 300) {
  return lazy(() =>
    Promise.all([
      importFunc(),
      new Promise((resolve) => setTimeout(resolve, minDelay)),
    ]).then(([moduleExports]) => moduleExports)
  );
}

export default lazyWithDelay;

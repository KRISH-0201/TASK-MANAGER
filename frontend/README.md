# Full-Stack Task Manager (MERN + React 19 + Vite)

A modern Task Management application featuring JWT Authentication, Google OAuth, Kanban Task Board, and **Practical 8: Performance Optimization & Lazy Loading in React**.

---

## ⚡ Practical 8: Performance Optimization & Lazy Loading

### Key Features Implemented:
1. **Route-Based Code Splitting**:
   - `Home.jsx` (`/`) -> Dynamically loaded Kanban Board chunk.
   - `Projects.jsx` (`/projects`) -> Dynamically loaded Projects Workspace chunk.
   - `Analytics.jsx` (`/analytics`) -> Dynamically loaded Performance & Profiler chunk.
   - `Contact.jsx` (`/contact`) -> Dynamically loaded Developer Support chunk.
2. **Suspense Boundaries & Fallback Skeleton**:
   - High-fidelity `LoadingFallback.jsx` skeleton UI with animated progress bar preventing Cumulative Layout Shift (CLS).
3. **Heavy Component Lazy Loading**:
   - `AnalyticsChart.jsx` is split into its own independent chunk and loaded on demand.
4. **Minimum-Delay Flicker Prevention**:
   - Custom `lazyWithDelay` utility enforces a minimum 300ms buffer on fast networks to prevent jarring loading flashes.
5. **React DevTools Profiler Optimization**:
   - Interactive re-render comparison demonstrating `React.memo` and `useCallback` stopping wasteful component renders.

---

## 🚀 Running the Project

### 1. Backend Server
```bash
cd backend
npm install
node server.js
```
*Runs on `http://localhost:5000`*

### 2. Frontend Application
```bash
cd frontend
npm install
npm run dev
```
*Runs on `http://localhost:5173`*

### 3. Production Build & Chunk Verification
```bash
cd frontend
npm run build
```
Verify generated chunks in terminal:
- `vendor-*.js`
- `index-*.js`
- `Home-*.js`
- `Projects-*.js`
- `Analytics-*.js`
- `Contact-*.js`
- `AnalyticsChart-*.js`

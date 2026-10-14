import React from 'react';
import { NavLink } from '../router';

export default function Navbar({ user, onLogout }) {
  return (
    <nav className="glass-panel main-navbar">
      <div className="navbar-brand">
        <div className="brand-icon">⚡</div>
        <div>
          <h2>Task Manager</h2>
          <span className="navbar-badge">Practical 8: Code Splitting</span>
        </div>
      </div>

      <div className="navbar-links">
        <NavLink to="/" className="nav-item">
          <span className="nav-icon">📋</span> Kanban Board
        </NavLink>
        <NavLink to="/projects" className="nav-item">
          <span className="nav-icon">📁</span> Projects
        </NavLink>
        <NavLink to="/analytics" className="nav-item">
          <span className="nav-icon">📊</span> Analytics & Profiler
        </NavLink>
        <NavLink to="/contact" className="nav-item">
          <span className="nav-icon">✉️</span> Contact
        </NavLink>
      </div>

      <div className="navbar-user-actions">
        <span className="user-email-chip" title="Active User">
          👤 {user?.email || 'User'}
        </span>
        <button onClick={onLogout} className="btn-logout-small" title="Sign out">
          Logout
        </button>
      </div>
    </nav>
  );
}

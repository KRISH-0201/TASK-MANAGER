import React, { useState } from 'react';

/**
 * Lazy-loaded Projects Route Component (Projects.chunk.js)
 * Only fetched over the network when user navigates to /projects
 */
export default function Projects() {
  const [filter, setFilter] = useState('all');
  const [projectsList, setProjectsList] = useState([
    {
      id: 1,
      title: 'Full-Stack Task Manager',
      category: 'Web App',
      description: 'MERN stack task management app featuring JWT auth, Google OAuth, and Kanban task segregation.',
      progress: 85,
      tasksCount: 14,
      status: 'Active',
      deadline: 'Oct 20, 2026',
      badgeColor: 'badge-ongoing',
    },
    {
      id: 2,
      title: 'React Code-Splitting & Profiler',
      category: 'Optimization',
      description: 'Performance engineering lab optimizing initial bundle size with React.lazy, Suspense & DevTools profiling.',
      progress: 95,
      tasksCount: 8,
      status: 'Review',
      deadline: 'Oct 15, 2026',
      badgeColor: 'badge-success',
    },
    {
      id: 3,
      title: 'Kubernetes Cloud Deployment',
      category: 'DevOps',
      description: 'Containerized deployment with Docker and Google Cloud Run for automated continuous deployment.',
      progress: 40,
      tasksCount: 19,
      status: 'In Progress',
      deadline: 'Nov 05, 2026',
      badgeColor: 'badge-warning',
    },
    {
      id: 4,
      title: 'Real-time WebSocket Notifications',
      category: 'Backend',
      description: 'Socket.IO integration for instant task update synchronization across multi-user workspaces.',
      progress: 20,
      tasksCount: 11,
      status: 'Planning',
      deadline: 'Nov 22, 2026',
      badgeColor: 'badge-info',
    },
  ]);

  const filteredProjects = filter === 'all' 
    ? projectsList 
    : projectsList.filter(p => p.status.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="page-container page-projects">
      <header className="page-header glass-panel">
        <div>
          <h1>Projects Workspace</h1>
          <p className="subtitle">Route: <code>/projects</code> | Lazy Chunk: <code>Projects.chunk.js</code></p>
        </div>
        <div className="project-filter-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({projectsList.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button 
            className={`filter-btn ${filter === 'review' ? 'active' : ''}`}
            onClick={() => setFilter('review')}
          >
            Review
          </button>
          <button 
            className={`filter-btn ${filter === 'in progress' ? 'active' : ''}`}
            onClick={() => setFilter('in progress')}
          >
            In Progress
          </button>
        </div>
      </header>

      <div className="projects-grid">
        {filteredProjects.map((project) => (
          <div key={project.id} className="project-card glass-panel">
            <div className="project-card-header">
              <span className="project-category">{project.category}</span>
              <span className={`status-pill ${project.badgeColor}`}>{project.status}</span>
            </div>

            <h3 className="project-title">{project.title}</h3>
            <p className="project-description">{project.description}</p>

            <div className="project-progress-section">
              <div className="progress-labels">
                <span>Completion</span>
                <span className="progress-pct">{project.progress}%</span>
              </div>
              <div className="progress-bar-track">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
            </div>

            <div className="project-footer">
              <span className="tasks-count">📌 {project.tasksCount} Tasks</span>
              <span className="deadline-tag">📅 {project.deadline}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

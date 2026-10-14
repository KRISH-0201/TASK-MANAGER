import React, { useState } from 'react';

/**
 * Lazy-loaded Home / Kanban Board Page
 * Loaded dynamically on first visit to '/' or '/tasks'
 */
export default function Home({
  tasks,
  loading,
  newTaskTitle,
  setNewTaskTitle,
  newTaskStatus,
  setNewTaskStatus,
  handleCreateTask,
  activeAddColumn,
  setActiveAddColumn,
  columnInputTitle,
  setColumnInputTitle,
  handleCreateColumnTask,
  handleUpdateStatus,
  handleStartEdit,
  handleCancelEdit,
  handleSaveEdit,
  handleDeleteTask,
  editingTaskId,
  editingTaskTitle,
  setEditingTaskTitle,
}) {
  const renderTaskCard = (task) => (
    <li key={task._id} className="task-card">
      <div className="task-content">
        {editingTaskId === task._id ? (
          <input
            type="text"
            value={editingTaskTitle}
            onChange={(e) => setEditingTaskTitle(e.target.value)}
            className="edit-input"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveEdit(task);
              if (e.key === 'Escape') handleCancelEdit();
            }}
          />
        ) : (
          <span className="task-title" onDoubleClick={() => handleStartEdit(task)}>
            {task.title}
          </span>
        )}
      </div>
      
      <div className="task-actions">
        {editingTaskId === task._id ? (
          <div className="edit-buttons">
            <button onClick={() => handleSaveEdit(task)} className="icon-btn btn-save" title="Save">✓</button>
            <button onClick={handleCancelEdit} className="icon-btn btn-cancel" title="Cancel">✕</button>
          </div>
        ) : (
          <>
            <div className="status-buttons">
              {task.status !== 'pending' && (
                <button onClick={() => handleUpdateStatus(task, 'pending')} className="badge-btn pending-btn" title="Move to Pending">
                  ← Pending
                </button>
              )}
              {task.status !== 'ongoing' && (
                <button onClick={() => handleUpdateStatus(task, 'ongoing')} className="badge-btn ongoing-btn" title="Move to Ongoing">
                  {task.status === 'pending' ? '→ Ongoing' : '← Ongoing'}
                </button>
              )}
              {task.status !== 'completed' && (
                <button onClick={() => handleUpdateStatus(task, 'completed')} className="badge-btn completed-btn" title="Move to Completed">
                  ✓ Done
                </button>
              )}
            </div>
            <div className="card-right-actions">
              <button onClick={() => handleStartEdit(task)} className="icon-btn btn-edit" title="Edit">✎</button>
              <button onClick={() => handleDeleteTask(task._id)} className="icon-btn btn-delete" title="Delete">🗑</button>
            </div>
          </>
        )}
      </div>
    </li>
  );

  const renderColumn = (statusKey, title, headerClass, emptyText) => {
    const columnTasks = tasks.filter(t => t.status === statusKey);
    const isAdding = activeAddColumn === statusKey;

    return (
      <div className="kanban-column" key={statusKey}>
        <div className={`column-header ${headerClass}`}>
          <div className="column-title-wrap">
            <h2>{title}</h2>
            <span className="task-count">{columnTasks.length}</span>
          </div>
          <button 
            className="btn-column-add-icon"
            onClick={() => {
              setActiveAddColumn(isAdding ? null : statusKey);
              setColumnInputTitle('');
            }}
            title={`Add task directly to ${title}`}
          >
            {isAdding ? '✕' : '+'}
          </button>
        </div>

        {/* Inline Quick Add in Column */}
        {isAdding && (
          <div className="column-add-box">
            <input
              type="text"
              placeholder={`New ${title} task (min 4 chars)...`}
              value={columnInputTitle}
              onChange={(e) => setColumnInputTitle(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateColumnTask(statusKey);
                if (e.key === 'Escape') setActiveAddColumn(null);
              }}
            />
            <div className="column-add-actions">
              <button 
                className="btn-add-inline"
                disabled={!columnInputTitle.trim()}
                onClick={() => handleCreateColumnTask(statusKey)}
              >
                Add to {title}
              </button>
              <button 
                className="btn-cancel-inline"
                onClick={() => setActiveAddColumn(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Task Cards */}
        {columnTasks.length === 0 ? (
          <div className="column-empty-state">
            <p>{emptyText}</p>
            {!isAdding && (
              <button 
                className="btn-empty-add" 
                onClick={() => setActiveAddColumn(statusKey)}
              >
                + Add Task in {title}
              </button>
            )}
          </div>
        ) : (
          <ul className="task-list">
            {columnTasks.map(renderTaskCard)}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="page-container page-home">
      <header className="page-header glass-panel">
        <div>
          <h1>Kanban Task Board</h1>
          <p className="subtitle">Route-based Lazy Loaded Chunk (Home.chunk.js)</p>
        </div>
        <form onSubmit={handleCreateTask} className="task-form header-task-form">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add new task (min 4 characters)..."
            disabled={loading}
          />
          <select
            value={newTaskStatus}
            onChange={(e) => setNewTaskStatus(e.target.value)}
            className="status-dropdown"
            disabled={loading}
            title="Target Column"
          >
            <option value="pending">Pending</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
          <button type="submit" disabled={!newTaskTitle.trim() || loading} className="btn-primary">
            + Add Task
          </button>
        </form>
      </header>

      {loading ? (
        <div className="loading-state glass-panel">
          <div className="spinner"></div>
          <p>Loading your tasks...</p>
        </div>
      ) : (
        <div className="kanban-board">
          {renderColumn('pending', 'Pending', 'pending-header', 'No pending tasks')}
          {renderColumn('ongoing', 'Ongoing', 'ongoing-header', 'No tasks in progress')}
          {renderColumn('completed', 'Completed', 'completed-header', 'No completed tasks')}
        </div>
      )}
    </div>
  );
}

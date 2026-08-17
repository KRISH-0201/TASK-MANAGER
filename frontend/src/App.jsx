import React, { useState, useEffect } from 'react';
import { getTasks, createTask, updateTask, deleteTask } from './api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  // For editing
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTasks();
      setTasks(data);
    } catch (err) {
      setError(err.message || 'Error fetching tasks');
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    if (newTaskTitle.trim().length <= 3) {
      toast.warn('Task must be more than 3 characters long');
      return;
    }

    // Optimistic UI update
    const tempId = Date.now().toString();
    const tempTask = { _id: tempId, title: newTaskTitle, completed: false };
    setTasks([tempTask, ...tasks]);
    setNewTaskTitle('');

    try {
      const createdTask = await createTask({ title: tempTask.title });
      setTasks(currentTasks => 
        currentTasks.map(t => t._id === tempId ? createdTask : t)
      );
      toast.success('Task created successfully!');
    } catch (err) {
      // Revert optimistic update
      setTasks(currentTasks => currentTasks.filter(t => t._id !== tempId));
      toast.error('Failed to create task');
    }
  };

  const handleToggleComplete = async (task) => {
    // Optimistic UI update
    setTasks(currentTasks => 
      currentTasks.map(t => 
        t._id === task._id ? { ...t, completed: !t.completed } : t
      )
    );

    try {
      await updateTask(task._id, { ...task, completed: !task.completed });
      toast.success('Task updated successfully!');
    } catch (err) {
      // Revert optimistic update
      setTasks(currentTasks => 
        currentTasks.map(t => 
          t._id === task._id ? { ...t, completed: task.completed } : t
        )
      );
      toast.error('Failed to update task');
    }
  };

  const handleStartEdit = (task) => {
    setEditingTaskId(task._id);
    setEditingTaskTitle(task.title);
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditingTaskTitle('');
  };

  const handleSaveEdit = async (task) => {
    if (!editingTaskTitle.trim()) return;
    
    if (editingTaskTitle.trim().length <= 3) {
      toast.warn('Task must be more than 3 characters long');
      return;
    }

    // Optimistic UI update
    const originalTitle = task.title;
    setTasks(currentTasks => 
      currentTasks.map(t => 
        t._id === task._id ? { ...t, title: editingTaskTitle } : t
      )
    );
    setEditingTaskId(null);
    setEditingTaskTitle('');

    try {
      await updateTask(task._id, { ...task, title: editingTaskTitle });
      toast.success('Task edited successfully!');
    } catch (err) {
      // Revert optimistic update
      setTasks(currentTasks => 
        currentTasks.map(t => 
          t._id === task._id ? { ...t, title: originalTitle } : t
        )
      );
      toast.error('Failed to edit task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this task?');
    if (!isConfirmed) return;

    // Optimistic UI update
    const taskToDelete = tasks.find(t => t._id === taskId);
    setTasks(currentTasks => currentTasks.filter(t => t._id !== taskId));

    try {
      await deleteTask(taskId);
      toast.success('Task deleted successfully!');
    } catch (err) {
      // Revert optimistic update
      setTasks(currentTasks => [taskToDelete, ...currentTasks]);
      toast.error('Failed to delete task');
    }
  };

  return (
    <div className="app-container">
      <div className="glass-panel">
        <header>
          <h1>Task Manager</h1>
          <p className="subtitle">Practical 6: Full Stack Integration</p>
        </header>

        <form onSubmit={handleCreateTask} className="task-form">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="What needs to be done?"
            disabled={loading}
          />
          <button type="submit" disabled={!newTaskTitle.trim() || loading} className="btn-primary">
            Add Task
          </button>
        </form>

        {error && (
          <div className="error-banner">
            <p>{error}</p>
            <button onClick={fetchTasks} className="btn-retry">Retry</button>
          </div>
        )}

        <div className="task-list">
          {loading && tasks.length === 0 ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading tasks...</p>
            </div>
          ) : tasks.length === 0 && !error ? (
            <div className="empty-state">
              <p>No tasks found. Start by creating one!</p>
            </div>
          ) : (
            <ul>
              {tasks.map(task => (
                <li key={task._id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                  <div className="task-content">
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggleComplete(task)}
                      />
                      <span className="checkmark"></span>
                    </label>
                    
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
                      <>
                        <button onClick={() => handleSaveEdit(task)} className="icon-btn btn-save" title="Save">✓</button>
                        <button onClick={handleCancelEdit} className="icon-btn btn-cancel" title="Cancel">✕</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleStartEdit(task)} className="icon-btn btn-edit" title="Edit">✎</button>
                        <button onClick={() => handleDeleteTask(task._id)} className="icon-btn btn-delete" title="Delete">🗑</button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <ToastContainer position="bottom-right" />
    </div>
  );
}

export default App;

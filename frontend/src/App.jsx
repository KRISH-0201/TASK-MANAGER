import React, { useState, useEffect } from 'react';
import { getTasks, createTask, updateTask, deleteTask, login, register, getMe } from './api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  
  // Auth Form State
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Task State
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  // Edit State
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');

  // Handle unauthorized events triggered by api.js
  useEffect(() => {
    const handleAuthError = () => {
      setToken(null);
      setUser(null);
      toast.error('Session expired. Please log in again.');
    };
    window.addEventListener('auth-error', handleAuthError);
    return () => window.removeEventListener('auth-error', handleAuthError);
  }, []);

  useEffect(() => {
    if (token) {
      fetchUserAndTasks();
    }
  }, [token]);

  const fetchUserAndTasks = async () => {
    try {
      setLoading(true);
      const userData = await getMe();
      setUser(userData);
      const tasksData = await getTasks();
      setTasks(tasksData);
    } catch (err) {
      console.error(err);
      if (err.message !== 'Unauthorized') {
        toast.error('Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.warn('Please fill all fields');
    
    try {
      setAuthLoading(true);
      if (isLogin) {
        const data = await login({ email, password });
        localStorage.setItem('token', data.token);
        setToken(data.token);
        toast.success('Logged in successfully!');
      } else {
        await register({ email, password });
        toast.success('Registered successfully! Please log in.');
        setIsLogin(true);
      }
    } catch (err) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setTasks([]);
    toast.info('Logged out successfully');
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    if (newTaskTitle.trim().length <= 3) {
      toast.warn('Task must be more than 3 characters long');
      return;
    }

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
      setTasks(currentTasks => currentTasks.filter(t => t._id !== tempId));
      toast.error('Failed to create task');
    }
  };

  const handleToggleComplete = async (task) => {
    setTasks(currentTasks => 
      currentTasks.map(t => 
        t._id === task._id ? { ...t, completed: !t.completed } : t
      )
    );

    try {
      await updateTask(task._id, { ...task, completed: !task.completed });
    } catch (err) {
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

    const taskToDelete = tasks.find(t => t._id === taskId);
    setTasks(currentTasks => currentTasks.filter(t => t._id !== taskId));

    try {
      await deleteTask(taskId);
      toast.success('Task deleted successfully!');
    } catch (err) {
      setTasks(currentTasks => [taskToDelete, ...currentTasks]);
      toast.error('Failed to delete task');
    }
  };

  if (!token) {
    return (
      <div className="app-container">
        <div className="glass-panel auth-panel">
          <header>
            <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
            <p className="subtitle">Practical 7: Authentication Pipeline</p>
          </header>
          
          <form onSubmit={handleAuthSubmit} className="auth-form">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              disabled={authLoading}
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              disabled={authLoading}
              required
            />
            <button type="submit" className="btn-primary" disabled={authLoading}>
              {authLoading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
            </button>
          </form>
          
          <p className="auth-toggle">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'Register here' : 'Login here'}
            </span>
          </p>
        </div>
        <ToastContainer position="bottom-right" />
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="glass-panel">
        <header className="app-header">
          <div>
            <h1>Task Manager</h1>
            <p className="subtitle">Welcome, {user?.email || 'User'}</p>
          </div>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
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

        <div className="task-list">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
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

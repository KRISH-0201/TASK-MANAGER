import React, { useState, useEffect, lazy, Suspense } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { getTasks, createTask, updateTask, deleteTask, login, register, getMe, googleLogin, directReset } from './api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { BrowserRouter, Routes, Route } from './router';
import Navbar from './components/Navbar';
import LoadingFallback from './components/LoadingFallback';

// Route-based Code Splitting using React.lazy()
const Home = lazy(() => import('./pages/Home'));
const Projects = lazy(() => import('./pages/Projects'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Contact = lazy(() => import('./pages/Contact'));

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  
  // Auth Form State
  const [authMode, setAuthMode] = useState('login'); // 'login', 'register', 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Task State
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState('pending');
  
  // Inline Add Task in Column State
  const [activeAddColumn, setActiveAddColumn] = useState(null);
  const [columnInputTitle, setColumnInputTitle] = useState('');

  // Edit State
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');

  const envGoogleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const isGoogleConfigured = envGoogleClientId && 
    !envGoogleClientId.includes('your-google-client-id') && 
    !envGoogleClientId.includes('dummy');
  const GOOGLE_CLIENT_ID = isGoogleConfigured ? envGoogleClientId : 'dummy-id.apps.googleusercontent.com';

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
      if (err.message !== 'Unauthorized') {
        toast.error('Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    try {
      setAuthLoading(true);
      if (authMode === 'login') {
        if (!email || !password) return toast.warn('Please fill all fields');
        const data = await login({ email, password });
        localStorage.setItem('token', data.token);
        setToken(data.token);
        toast.success('Logged in successfully!');
      } else if (authMode === 'register') {
        if (!email || !password) return toast.warn('Please fill all fields');
        await register({ email, password });
        toast.success('Registered successfully! Please log in.');
        setAuthMode('login');
      } else if (authMode === 'forgot') {
        if (!email || !newPassword || !confirmPassword) return toast.warn('Please fill all fields');
        if (newPassword !== confirmPassword) return toast.warn('Passwords do not match');
        if (newPassword.length < 6) return toast.warn('Password must be at least 6 characters');
        await directReset({ email, newPassword, confirmPassword });
        toast.success('Password reset successfully! You can now log in.');
        setAuthMode('login');
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setAuthLoading(true);
      const data = await googleLogin(credentialResponse.credential);
      localStorage.setItem('token', data.token);
      setToken(data.token);
      toast.success(`Logged in with Google as ${data.user.email}!`);
    } catch (err) {
      toast.error(err.message || 'Google login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDemoGoogleLogin = async () => {
    try {
      setAuthLoading(true);
      const loginEmail = email.trim() || '24aiml028@charusat.edu.in';
      const data = await googleLogin({ isDemo: true, email: loginEmail });
      localStorage.setItem('token', data.token);
      setToken(data.token);
      toast.success(`Signed in as ${data.user.email} (Google Auth)!`);
    } catch (err) {
      toast.error(err.message || 'Google login failed');
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
      toast.warn('Task title must be more than 3 characters long');
      return;
    }

    const titleToCreate = newTaskTitle.trim();
    const statusToCreate = newTaskStatus;
    const tempId = Date.now().toString();
    const tempTask = { 
      _id: tempId, 
      title: titleToCreate, 
      status: statusToCreate, 
      completed: statusToCreate === 'completed' 
    };

    setTasks([tempTask, ...tasks]);
    setNewTaskTitle('');

    try {
      const createdTask = await createTask({ title: titleToCreate, status: statusToCreate });
      setTasks(currentTasks => 
        currentTasks.map(t => t._id === tempId ? createdTask : t)
      );
      toast.success(`Task added to ${statusToCreate}!`);
    } catch (err) {
      setTasks(currentTasks => currentTasks.filter(t => t._id !== tempId));
      toast.error('Failed to create task');
    }
  };

  const handleCreateColumnTask = async (columnStatus) => {
    if (!columnInputTitle.trim()) return;
    
    if (columnInputTitle.trim().length <= 3) {
      toast.warn('Task title must be more than 3 characters long');
      return;
    }

    const titleToCreate = columnInputTitle.trim();
    const tempId = Date.now().toString();
    const tempTask = { 
      _id: tempId, 
      title: titleToCreate, 
      status: columnStatus, 
      completed: columnStatus === 'completed' 
    };

    setTasks([tempTask, ...tasks]);
    setColumnInputTitle('');
    setActiveAddColumn(null);

    try {
      const createdTask = await createTask({ title: titleToCreate, status: columnStatus });
      setTasks(currentTasks => 
        currentTasks.map(t => t._id === tempId ? createdTask : t)
      );
      toast.success(`Task added to ${columnStatus}!`);
    } catch (err) {
      setTasks(currentTasks => currentTasks.filter(t => t._id !== tempId));
      toast.error('Failed to create task');
    }
  };

  const handleUpdateStatus = async (task, newStatus) => {
    const originalStatus = task.status;
    const isNowCompleted = newStatus === 'completed';

    setTasks(currentTasks => 
      currentTasks.map(t => t._id === task._id ? { ...t, status: newStatus, completed: isNowCompleted } : t)
    );

    try {
      await updateTask(task._id, { status: newStatus, completed: isNowCompleted });
      toast.info(`Moved to ${newStatus}`);
    } catch (err) {
      setTasks(currentTasks => 
        currentTasks.map(t => t._id === task._id ? { ...t, status: originalStatus, completed: originalStatus === 'completed' } : t)
      );
      toast.error('Failed to update task status');
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
      toast.warn('Task title must be more than 3 characters long');
      return;
    }

    const originalTitle = task.title;
    const newTitle = editingTaskTitle.trim();
    setTasks(currentTasks => currentTasks.map(t => t._id === task._id ? { ...t, title: newTitle } : t));
    setEditingTaskId(null);
    setEditingTaskTitle('');

    try {
      await updateTask(task._id, { title: newTitle });
      toast.success('Task updated!');
    } catch (err) {
      setTasks(currentTasks => currentTasks.map(t => t._id === task._id ? { ...t, title: originalTitle } : t));
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
      toast.success('Task deleted!');
    } catch (err) {
      setTasks(currentTasks => [taskToDelete, ...currentTasks]);
      toast.error('Failed to delete task');
    }
  };

  if (!token) {
    const authWrapper = (children) => {
      if (isGoogleConfigured) {
        return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{children}</GoogleOAuthProvider>;
      }
      return <>{children}</>;
    };

    return authWrapper(
      <div className="app-container">
        <div className="glass-panel auth-panel">
          <header>
            <h1>{authMode === 'login' ? 'Welcome Back' : authMode === 'register' ? 'Create Account' : 'Reset Password'}</h1>
            <p className="subtitle">Practical 8: Lazy Loading & Performance Optimization</p>
          </header>
          
          <form onSubmit={handleAuthSubmit} className="auth-form">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address (e.g. name@gmail.com)"
              disabled={authLoading}
              required
            />
            
            {authMode !== 'forgot' ? (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                disabled={authLoading}
                required
              />
            ) : (
              <>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password (min 6 chars)"
                  disabled={authLoading}
                  required
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm New Password"
                  disabled={authLoading}
                  required
                />
              </>
            )}

            <button type="submit" className="btn-primary" disabled={authLoading}>
              {authLoading ? 'Please wait...' : authMode === 'login' ? 'Login' : authMode === 'register' ? 'Register' : 'Reset Password'}
            </button>
          </form>

          {authMode === 'login' && (
            <div className="google-auth-container">
              <div className="divider"><span>OR</span></div>
              
              {isGoogleConfigured && (
                <div className="google-official-btn">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => toast.error('Google Login Failed')}
                    useOneTap
                    theme="filled_blue"
                    shape="pill"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={handleDemoGoogleLogin}
                className="btn-google-action"
                disabled={authLoading}
                title="Instant Google Login"
              >
                <svg className="google-svg-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Sign in with Google {email ? `(${email})` : ''}</span>
              </button>
            </div>
          )}
          
          <div className="auth-links">
            {authMode === 'login' ? (
              <>
                <p className="auth-toggle">Don't have an account? <span onClick={() => setAuthMode('register')}>Register here</span></p>
                <p className="auth-toggle">Forgot your password? <span onClick={() => setAuthMode('forgot')}>Reset it</span></p>
              </>
            ) : (
              <p className="auth-toggle">Back to <span onClick={() => setAuthMode('login')}>Login</span></p>
            )}
          </div>
        </div>
        <ToastContainer position="bottom-right" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app-container app-workspace-layout">
        {/* Navigation Bar */}
        <Navbar user={user} onLogout={handleLogout} />

        {/* Route-Level Suspense Boundary */}
        <main className="main-content-area">
          <Suspense fallback={<LoadingFallback pageName="Requested Route" />}>
            <Routes>
              <Route 
                path="/" 
                element={
                  <Home
                    tasks={tasks}
                    loading={loading}
                    newTaskTitle={newTaskTitle}
                    setNewTaskTitle={setNewTaskTitle}
                    newTaskStatus={newTaskStatus}
                    setNewTaskStatus={setNewTaskStatus}
                    handleCreateTask={handleCreateTask}
                    activeAddColumn={activeAddColumn}
                    setActiveAddColumn={setActiveAddColumn}
                    columnInputTitle={columnInputTitle}
                    setColumnInputTitle={setColumnInputTitle}
                    handleCreateColumnTask={handleCreateColumnTask}
                    handleUpdateStatus={handleUpdateStatus}
                    handleStartEdit={handleStartEdit}
                    handleCancelEdit={handleCancelEdit}
                    handleSaveEdit={handleSaveEdit}
                    handleDeleteTask={handleDeleteTask}
                    editingTaskId={editingTaskId}
                    editingTaskTitle={editingTaskTitle}
                    setEditingTaskTitle={setEditingTaskTitle}
                  />
                } 
              />
              <Route path="/projects" element={<Projects />} />
              <Route path="/analytics" element={<Analytics tasks={tasks} />} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </Suspense>
        </main>

        <ToastContainer position="bottom-right" />
      </div>
    </BrowserRouter>
  );
}

export default App;

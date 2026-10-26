const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const { normalizeEmail, isValidEmail, isGmailAddress, isStrongPassword } = require('./utils/validation');
const Task = require('./models/Task');
const User = require('./models/User');

const auth = require('./middleware/auth');
const validateTask = require('./middleware/validateTask');
const cache = require('./cache');
const eventBus = require('./eventBus');
const asyncQueue = require('./asyncQueue');
const aiService = require('./aiService');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskdb';
const JWT_SECRET = process.env.JWT_SECRET;
const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

// Helper functions
const getTaskStatus = (task) => {
  if (task.completed) return 'completed';
  if (task.status === 'ongoing') return 'ongoing';
  return 'pending';
};

const syncTaskStatus = (task) => {
  if (!['pending', 'ongoing', 'completed'].includes(task.status)) {
    task.status = task.completed ? 'completed' : 'pending';
  }
  task.completed = (task.status === 'completed');
  return task;
};

// Middleware
app.use(cors({
  exposedHeaders: ['X-Response-Time', 'X-Cache']
}));
app.use(express.json());

// Practical 9: Response Time Telemetry Middleware
app.use((req, res, next) => {
  const start = Date.now();
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - start;
    res.setHeader('X-Response-Time', `${duration}ms`);
    return originalJson.call(this, data);
  };
  next();
});

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- Auth Routes ---

app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Please enter all fields' });
    }

    if (!isValidEmail(normalizedEmail) || !isGmailAddress(normalizedEmail)) {
      return res.status(400).json({ error: 'Please enter a valid Gmail address' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email: normalizedEmail, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error during registration' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Please enter all fields' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ error: 'User does not exist' });
    }

    if (!user.password) {
      return res.status(400).json({ error: 'This account was signed in with Google. Please use Google Login or reset your password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Server error during login' });
  }
});

app.post('/google-login', async (req, res) => {
  try {
    const { credential, isDemo, email: demoEmail } = req.body;

    // Handle Demo / Simulated Google Login
    if (isDemo || credential === 'demo-google-token') {
      const email = normalizeEmail(demoEmail || '24aiml028@charusat.edu.in');
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({ email, password: null, googleId: 'demo-google-' + Date.now() });
      }
      const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
      return res.json({ token, user: { id: user._id, email: user.email } });
    }

    if (!credential) return res.status(400).json({ error: 'Google credential is required' });

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: 'Google login is not configured yet. Add GOOGLE_CLIENT_ID to backend .env or use Demo Google login.' });
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.email_verified) {
      return res.status(401).json({ error: 'Google account verification failed' });
    }

    const email = normalizeEmail(payload.email);
    const googleId = payload.sub;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email, password: null, googleId });
    } else if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, email: user.email } });
  } catch (err) {
    console.error('Google login error:', err);
    res.status(401).json({ error: 'Google login failed: ' + (err.message || 'Invalid token') });
  }
});

app.post('/direct-reset', async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Please enter your new password twice' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // In a real app we shouldn't reveal if user exists, but for demo we will
      return res.status(400).json({ error: 'User does not exist' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password reset successful. You can now log in with your new password.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error while resetting password' });
  }
});

app.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Protected Task Routes ---

// --- Protected Task Routes with In-Memory Caching (Practical 9) ---

app.get('/tasks', auth, async (req, res) => {
  try {
    const cacheKey = `tasks_${req.user.id}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    res.setHeader('X-Cache', 'MISS');
    const tasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 });
    const normalizedTasks = tasks.map(task => {
      const normalized = task.toObject();
      normalized.status = getTaskStatus(normalized);
      normalized.completed = normalized.status === 'completed';
      return normalized;
    });

    // Store in cache with 60s TTL
    cache.set(cacheKey, normalizedTasks, 60);
    res.json(normalizedTasks);
  } catch (err) {
    res.status(500).json({ error: 'Server error while fetching tasks' });
  }
});

// Supplementary Problem 1: Cache single task endpoint separately
app.get('/tasks/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `task_${req.user.id}_${id}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    res.setHeader('X-Cache', 'MISS');
    const task = await Task.findOne({ _id: id, user: req.user.id });
    if (!task) {
      return res.status(404).json({ error: 'Task not found or not authorized' });
    }

    const normalized = task.toObject();
    normalized.status = getTaskStatus(normalized);
    normalized.completed = normalized.status === 'completed';

    cache.set(cacheKey, normalized, 60);
    res.json(normalized);
  } catch (err) {
    res.status(500).json({ error: 'Server error while fetching single task' });
  }
});

app.post('/tasks', auth, validateTask, async (req, res) => {
  try {
    const { title, status } = req.body;
    const taskStatus = ['pending', 'ongoing', 'completed'].includes(status) ? status : 'pending';
    const newTask = new Task({
      title,
      user: req.user.id,
      status: taskStatus,
      completed: taskStatus === 'completed',
    });
    await newTask.save();

    // Cache Invalidation on Create (Practical 9)
    cache.del(`tasks_${req.user.id}`);

    // Practical 10: Event-Driven Architecture - Emit task:created event
    eventBus.emit('task:created', { task: newTask, user: req.user });

    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: 'Server error while creating task' });
  }
});

app.put('/tasks/:id', auth, validateTask, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, completed, status } = req.body;
    
    const task = await Task.findOne({ _id: id, user: req.user.id });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found or not authorized' });
    }

    const previousStatus = task.status;

    if (title !== undefined) task.title = title;
    if (status !== undefined && ['pending', 'ongoing', 'completed'].includes(status)) {
      task.status = status;
      task.completed = status === 'completed';
    }
    if (completed !== undefined) {
      task.completed = Boolean(completed);
      if (task.completed) {
        task.status = 'completed';
      } else if (task.status === 'completed') {
        task.status = 'pending';
      }
    }

    syncTaskStatus(task);
    await task.save();

    // Cache Invalidation on Update (all tasks + single task cache)
    cache.del(`tasks_${req.user.id}`);
    cache.del(`task_${req.user.id}_${id}`);

    // Practical 10: Event-Driven Architecture - Emit appropriate event
    if (task.status === 'completed' && previousStatus !== 'completed') {
      eventBus.emit('task:completed', { task, user: req.user });
    } else if (task.status !== previousStatus) {
      eventBus.emit('task:status_changed', { task, newStatus: task.status, previousStatus, user: req.user });
    }

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Server error while updating task' });
  }
});

app.delete('/tasks/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findOneAndDelete({ _id: id, user: req.user.id });
    if (!task) {
      return res.status(404).json({ error: 'Task not found or not authorized' });
    }

    // Cache Invalidation on Delete (all tasks + single task cache)
    cache.del(`tasks_${req.user.id}`);
    cache.del(`task_${req.user.id}_${id}`);

    // Practical 10: Event-Driven Architecture - Emit task:deleted event
    eventBus.emit('task:deleted', { taskId: id, task, user: req.user });

    res.json({ message: 'Task deleted successfully', task });
  } catch (err) {
    res.status(500).json({ error: 'Server error while deleting task' });
  }
});

// Supplementary Problem 2: Cache Hit/Miss Debug & Management Endpoints
app.get('/cache/stats', (req, res) => {
  res.json(cache.getStats());
});

app.post('/cache/clear', (req, res) => {
  cache.flush();
  res.json({ message: 'In-memory cache flushed successfully', stats: cache.getStats() });
});

// ========================================================
// Practical 10: Asynchronous Job Processing & Event Routes
// ========================================================

// 1. Submit heavy export job -> Responds with HTTP 202 Accepted immediately
app.post('/jobs/export', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 });
    const job = asyncQueue.createExportJob(req.user.id, req.user.email, tasks);
    
    // HTTP 202 Accepted: Request received and scheduled for background execution
    res.status(202).json({
      message: 'Export job accepted and scheduled in background queue (HTTP 202 Accepted)',
      job,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to enqueue export job' });
  }
});

// 2. Poll job status by ID
app.get('/jobs/:id', auth, (req, res) => {
  const job = asyncQueue.getJob(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json(job);
});

// 3. List recent jobs for user
app.get('/jobs', auth, (req, res) => {
  const jobs = asyncQueue.getUserJobs(req.user.id);
  res.json(jobs);
});

// 4. Real-time Event Stream inspection
app.get('/events/recent', (req, res) => {
  res.json(eventBus.getRecentEvents());
});

// 5. Trigger simulated test event for demonstration
app.post('/events/emit-test', auth, (req, res) => {
  const { eventType, details } = req.body;
  const type = eventType || 'task:status_changed';
  
  if (type === 'task:completed') {
    eventBus.emit('task:completed', { task: { title: details || 'Quarterly Financial Model Review' }, user: req.user });
  } else if (type === 'task:created') {
    eventBus.emit('task:created', { task: { _id: 'sim_' + Date.now(), title: details || 'Automated Performance Audit' }, user: req.user });
  } else {
    eventBus.emit('task:status_changed', { task: { title: details || 'Security Vulnerability Scan' }, newStatus: 'completed', user: req.user });
  }

  res.json({ message: `Simulated event "${type}" emitted successfully to EventBus`, timestamp: new Date().toISOString() });
});

// 6. Benchmark Comparison: Synchronous Blocking vs. Asynchronous Event-Driven
app.post('/benchmark/async-vs-sync', auth, async (req, res) => {
  try {
    const benchmarkResults = await asyncQueue.runBenchmarkComparison();
    res.json(benchmarkResults);
  } catch (err) {
    res.status(500).json({ error: 'Failed to run benchmark' });
  }
});

// ========================================================
// Practical 11: Containerization & Docker Health Endpoints
// ========================================================

// Container Healthcheck Endpoint
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'healthy' : 'degraded';
  res.status(dbStatus === 'healthy' ? 200 : 503).json({
    status: dbStatus,
    service: 'taskmgr-backend',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus === 'healthy' ? 'CONNECTED' : 'DISCONNECTED',
      host: mongoose.connection.host || 'mongodb',
      name: mongoose.connection.name || 'taskdb',
    },
  });
});

// Docker Telemetry & Container Orchestration Status Endpoint
app.get('/docker/status', (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    isContainerized: Boolean(process.env.DOCKER_CONTAINER || process.env.KUBERNETES_SERVICE_HOST),
    environment: process.env.NODE_ENV || 'production',
    uptimeSeconds: Math.floor(process.uptime()),
    nodeVersion: process.version,
    platform: process.platform,
    pid: process.pid,
    memory: {
      rss: `${Math.round(mem.rss / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)} MB`,
    },
    database: {
      status: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
      host: mongoose.connection.host || 'taskmgr-mongodb',
      port: mongoose.connection.port || 27017,
      name: mongoose.connection.name || 'taskdb',
    },
    topology: [
      {
        service: 'frontend',
        container: 'taskmgr-frontend',
        image: 'nginx:alpine (Multi-Stage Node 20)',
        internalPort: '80',
        externalPort: '5173 / 80',
        role: 'Reverse Proxy & Static Asset Web Server',
        status: 'HEALTHY',
        type: 'client',
      },
      {
        service: 'backend',
        container: 'taskmgr-backend',
        image: 'node:20-alpine',
        internalPort: '5000',
        externalPort: '5000',
        role: 'Express.js REST API & Event Bus',
        status: 'HEALTHY',
        type: 'api',
      },
      {
        service: 'mongodb',
        container: 'taskmgr-mongodb',
        image: 'mongo:7.0',
        internalPort: '27017',
        externalPort: '27017',
        role: 'Persistent NoSQL Document Store (Volume: mongo_data)',
        status: mongoose.connection.readyState === 1 ? 'HEALTHY' : 'CONNECTING',
        type: 'database',
      },
    ],
  });
});

// ==========================================
// Practical 13: AI API Integration Endpoints
// ==========================================

// AI Status & Configuration Telemetry
app.get('/api/ai/status', (req, res) => {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  res.json({
    enabled: true,
    provider: hasGemini ? 'Google Gemini 1.5 Flash' : (hasOpenAI ? 'OpenAI GPT-4o-mini' : 'Heuristic Fallback Engine'),
    apiKeyConfigured: hasGemini || hasOpenAI,
    gracefulDegradationReady: true,
    rateLimitWindowSeconds: 60,
    maxRequestsPerWindow: 1,
    sanitizationActive: true
  });
});

// AI Task Description & Priority Generator
app.post('/api/ai/generate-description', async (req, res) => {
  try {
    const { title, simulateFailure } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    // Identify user from header or fallback
    let userIdentifier = req.ip || 'anonymous';
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        userIdentifier = decoded.id;
      } catch (e) {
        // Continue with IP identifier if token invalid
      }
    }

    const result = await aiService.generateTaskDescription({
      title,
      simulateFailure: Boolean(simulateFailure),
      userIdentifier
    });

    res.json(result);
  } catch (err) {
    if (err.status === 429) {
      return res.status(429).json({
        error: err.message,
        remainingSeconds: err.remainingSeconds,
        rateLimited: true
      });
    }

    console.error('AI Route Unexpected Error:', err);
    // Graceful fallback response instead of crash
    res.status(200).json(aiService.generateFallbackSuggestion(req.body?.title || 'New Task'));
  }
});

// Responsible AI: Live PII Sanitization Preview
app.post('/api/ai/sanitize-preview', (req, res) => {
  const { text } = req.body;
  const sanitized = aiService.sanitizePrompt(text || '');
  res.json({
    original: text || '',
    sanitized,
    piiDetected: sanitized !== (text || '')
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


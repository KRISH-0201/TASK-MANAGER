const BASE_URL = 'http://localhost:5000';

// Helper to get headers with the authorization token
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

// Handle common response logic including 401 Unauthorized
const handleResponse = async (response) => {
  if (response.status === 401) {
    // Clear token and trigger custom event so App.jsx can handle logout
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('auth-error'));
    throw new Error('Unauthorized');
  }
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'API request failed');
  }
  
  return response.json();
};

export const register = async (credentials) => {
  const response = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  return handleResponse(response);
};

export const login = async (credentials) => {
  const response = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  return handleResponse(response);
};

export const googleLogin = async (payload) => {
  const body = typeof payload === 'string' ? { credential: payload } : payload;
  const response = await fetch(`${BASE_URL}/google-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse(response);
};

export const directReset = async ({ email, newPassword, confirmPassword }) => {
  const response = await fetch(`${BASE_URL}/direct-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, newPassword, confirmPassword }),
  });
  return handleResponse(response);
};

export const getMe = async () => {
  const response = await fetch(`${BASE_URL}/me`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const getTasks = async () => {
  const response = await fetch(`${BASE_URL}/tasks`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const createTask = async (taskData) => {
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(taskData),
  });
  return handleResponse(response);
};

export const updateTask = async (id, taskData) => {
  const response = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(taskData),
  });
  return handleResponse(response);
};

export const deleteTask = async (id) => {
  const response = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

// Practical 9: Caching Telemetry & Benchmarking APIs
export const getTasksWithTelemetry = async () => {
  const t0 = performance.now();
  const response = await fetch(`${BASE_URL}/tasks`, {
    headers: getAuthHeaders(),
  });
  const t1 = performance.now();
  const data = await handleResponse(response);
  const serverTime = response.headers.get('X-Response-Time') || `${Math.round(t1 - t0)}ms`;
  const cacheStatus = response.headers.get('X-Cache') || 'UNKNOWN';

  return {
    data,
    cacheStatus,
    serverTime,
    clientDurationMs: Math.round(t1 - t0),
  };
};

export const getSingleTask = async (id) => {
  const response = await fetch(`${BASE_URL}/tasks/${id}`, {
    headers: getAuthHeaders(),
  });
  const cacheStatus = response.headers.get('X-Cache') || 'UNKNOWN';
  const serverTime = response.headers.get('X-Response-Time') || '0ms';
  const data = await handleResponse(response);
  return { data, cacheStatus, serverTime };
};

export const getCacheStats = async () => {
  const response = await fetch(`${BASE_URL}/cache/stats`);
  return handleResponse(response);
};

export const clearCache = async () => {
  const response = await fetch(`${BASE_URL}/cache/clear`, {
    method: 'POST',
  });
  return handleResponse(response);
};

// Practical 10: Asynchronous Job Processing & Event-Driven Architecture APIs
export const submitExportJob = async () => {
  const response = await fetch(`${BASE_URL}/jobs/export`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  // Handles 202 Accepted status
  return handleResponse(response);
};

export const getJobStatus = async (jobId) => {
  const response = await fetch(`${BASE_URL}/jobs/${jobId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const getUserJobs = async () => {
  const response = await fetch(`${BASE_URL}/jobs`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const getRecentEvents = async () => {
  const response = await fetch(`${BASE_URL}/events/recent`);
  return handleResponse(response);
};

export const emitSimulatedEvent = async (eventType, details) => {
  const response = await fetch(`${BASE_URL}/events/emit-test`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ eventType, details }),
  });
  return handleResponse(response);
};

export const runAsyncBenchmark = async () => {
  const response = await fetch(`${BASE_URL}/benchmark/async-vs-sync`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

// Practical 11: Containerization & Docker Orchestration APIs
export const getHealthStatus = async () => {
  const t0 = performance.now();
  const response = await fetch(`${BASE_URL}/health`);
  const t1 = performance.now();
  const data = await handleResponse(response);
  return {
    ...data,
    pingLatencyMs: Math.round(t1 - t0),
  };
};

export const getDockerStatus = async () => {
  const response = await fetch(`${BASE_URL}/docker/status`);
  return handleResponse(response);
};




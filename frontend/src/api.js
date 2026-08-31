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

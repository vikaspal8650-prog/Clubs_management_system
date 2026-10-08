/**
 * API Helper Layer
 * 
 * Manages network communication with Express Backend and handles error catching
 */

const STORAGE_KEYS = {
  USERS: 'ccms_users_v1',
  CLUBS: 'ccms_clubs_v1',
  EVENTS: 'ccms_events_v1',
  ATTENDANCE: 'ccms_attendance_v1',
  ATTENDANCE_SESSIONS: 'ccms_attendance_sessions_v1',
  DEPARTMENTS: 'ccms_departments_v1',
  NOTIFICATIONS: 'ccms_notifications_v1',
  ACTIVITY_LOG: 'ccms_activity_log_v1',
  CURRENT_USER: 'ccms_current_user_v1',
};

export const initStorage = () => {};

export const getFromStorage = (key) => {
  if (typeof localStorage === 'undefined') return null;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return null;
  }
};

export const saveToStorage = (key, value) => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
};

export const simulateDelay = (ms = 200) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

export const api = {
  async request(endpoint, options = {}) {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('ccms_token_v1') : null;
    const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const headers = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    try {
      const res = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || `HTTP error ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      if (err.name === 'TypeError' || err.message === 'Failed to fetch' || (err.message && err.message.includes('fetch'))) {
        throw new Error('Unable to connect to the server. Please check that the backend is running.');
      }
      throw err;
    }
  },

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },
};

export default api;
export { STORAGE_KEYS };

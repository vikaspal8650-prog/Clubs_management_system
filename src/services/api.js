/**
 * API Helper Layer
 * 
 * Manages network communication with Express Backend and handles error catching
 */

export const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
// Relative API paths are resolved by the browser against the current origin
// (and by Vite's /api proxy in development). Only absolute API URLs need to
// provide their own origin here.
export const API_ORIGIN = /^https?:\/\//i.test(API_BASE_URL)
  ? new URL(API_BASE_URL).origin
  : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
const REQUEST_TIMEOUT_MS = 15_000;

const messageForStatus = (status, serverMessage) => {
  if (serverMessage) return serverMessage;
  if (status === 401) return 'Invalid email or password.';
  if (status === 403) return 'You are not authorized to perform this action.';
  if (status === 404) return 'Requested resource was not found.';
  if (status === 409) return 'Resource already exists.';
  if (status === 503) return 'Database service is currently unavailable.';
  if (status >= 500) return 'Something went wrong on the server.';
  return `Request failed (${status}).`;
};

export const api = {
  async request(endpoint, options = {}) {
    if (typeof window !== 'undefined' && API_ORIGIN !== window.location.origin && window.location.protocol === 'https:' && API_ORIGIN.startsWith('http:')) {
      throw new Error('Secure page cannot connect to an insecure HTTP API. Set VITE_API_URL to an HTTPS endpoint.');
    }
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const headers = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        ...options,
        headers,
        signal: options.signal || controller.signal,
        credentials: 'include',
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const error = new Error(messageForStatus(res.status, payload.error || payload.message));
        error.status = res.status;
        throw error;
      }

      return await res.json();
    } catch (err) {
      if (err.status) throw err;
      if (err.name === 'AbortError') {
        throw new Error('The request timed out. Please try again.');
      }
      if (err.name === 'TypeError' || err.message === 'Failed to fetch' || (err.message && err.message.includes('fetch'))) {
        throw new Error('The request was blocked or the backend could not be reached. Check the backend URL, CORS origin, and browser network details.');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  async post(endpoint, data) {
    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      return this.request(endpoint, { method: 'POST', body: data });
    }
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

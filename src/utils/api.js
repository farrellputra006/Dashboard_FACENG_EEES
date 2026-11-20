/**
 * Centralized API Client with Bearer Token Injection & 401 Interception
 */

const TOKEN_KEY = 'dashboard_auth_token';
const REMEMBER_KEY = 'dashboard_auth_remember';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token, remember = false) {
  if (typeof window === 'undefined') return;
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REMEMBER_KEY, 'true');
    sessionStorage.removeItem(TOKEN_KEY);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REMEMBER_KEY);
  }
}

export function removeToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REMEMBER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

export function getBaseApiUrl() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.replace(/\/+$/, '');
  }
  return '';
}

// =========================================================================
// Global Loading Interceptor & State Subscription
// =========================================================================
let activeRequestCount = 0;
const loadingListeners = new Set();

export function subscribeToLoading(listener) {
  loadingListeners.add(listener);
  // Emit current state immediately to new listener
  listener(activeRequestCount > 0);
  return () => {
    loadingListeners.delete(listener);
  };
}

function notifyLoading() {
  const isLoading = activeRequestCount > 0;
  loadingListeners.forEach((listener) => {
    try {
      listener(isLoading);
    } catch {
      // ignore
    }
  });
}

export async function apiRequest(endpoint, options = {}) {
  activeRequestCount++;
  notifyLoading();

  try {
    const token = getToken();
    const baseUrl = getBaseApiUrl();
    const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers = {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(options.headers || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Auto-inject CSRF XSRF-TOKEN header if cookie is present
    if (typeof document !== 'undefined' && document.cookie) {
      const xsrfCookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('XSRF-TOKEN='));
      if (xsrfCookie) {
        try {
          headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfCookie.split('=')[1]);
        } catch {
          // ignore decode failure
        }
      }
    }

    let body = options.body;
    if (body && typeof body === 'object' && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(body);
    }

    const response = await fetch(url, {
      credentials: 'same-origin',
      ...options,
      headers,
      body,
    });

    if (response.status === 401) {
      removeToken();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return response;
  } finally {
    activeRequestCount = Math.max(0, activeRequestCount - 1);
    notifyLoading();
  }
}

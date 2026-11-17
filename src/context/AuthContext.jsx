import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getToken, setToken as saveToken, removeToken, apiRequest } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(() => getToken());
  const [loading, setLoading] = useState(true);

  // Validate current token on initial app load
  const validateSession = useCallback(async () => {
    const currentToken = getToken();
    if (!currentToken) {
      setUser(null);
      setTokenState(null);
      setLoading(false);
      return;
    }

    try {
      const response = await apiRequest('/api/me', { method: 'GET' });
      if (response.ok) {
        const result = await response.json();
        const userData = result.user || result.data || result;
        setUser(userData);
        setTokenState(currentToken);
      } else {
        // Token invalid / expired
        removeToken();
        setUser(null);
        setTokenState(null);
      }
    } catch (err) {
      console.warn('Gagal memvalidasi sesi auth:', err);
      // If network fails or server error, retain token or handle gracefully
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  /**
   * Log in user with credentials
   */
  const login = async (email, password, remember = false) => {
    const response = await apiRequest('/api/login', {
      method: 'POST',
      body: { email, password, remember },
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      const errorMsg = result.message || 'Email atau password salah.';
      const error = new Error(errorMsg);
      error.status = response.status;
      error.errors = result.errors;
      throw error;
    }

    // Save token according to remember preference
    saveToken(result.token, remember);
    setTokenState(result.token);
    setUser(result.user);

    return result;
  };

  /**
   * Log out user and revoke Sanctum token
   */
  const logout = async () => {
    try {
      if (getToken()) {
        await apiRequest('/api/logout', { method: 'POST' });
      }
    } catch (err) {
      console.warn('Gagal memproses logout API:', err);
    } finally {
      removeToken();
      setUser(null);
      setTokenState(null);
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    login,
    logout,
    refreshUser: validateSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

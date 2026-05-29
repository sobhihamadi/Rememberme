import { useState, useCallback } from 'react';
import { login, logout, register } from '../api/Api.auth';
import type { LoginRequest, RegisterRequest, AuthUser } from '../types/Types.auth';
import { ApiException } from '../api/Api.client';

interface AuthState {
  user:      AuthUser | null;
  loading:   boolean;
  error:     string | null;
}

interface UseAuthReturn extends AuthState {
  login:    (payload: LoginRequest)    => Promise<void>;
  logout:   ()                         => Promise<void>;
  register: (payload: RegisterRequest) => Promise<AuthUser>;
  clearError: ()                       => void;
}

/**
 * useAuth
 *
 * Handles login, logout, and registration.
 * Auth state is cookie-based (httpOnly) — the browser sends the cookie
 * automatically on every request so there's nothing to store in JS memory
 * beyond the public user info (name, email, role) for display purposes.
 *
 * On a real app you'd restore `user` from a /api/v1/users/me endpoint
 * or from a persisted value (localStorage / context provider).
 */
export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user:    null,
    loading: false,
    error:   null,
  });

  const setLoading = (loading: boolean) =>
    setState((prev) => ({ ...prev, loading, error: null }));

  const setError = (error: string) =>
    setState((prev) => ({ ...prev, loading: false, error }));

  const clearError = useCallback(() =>
    setState((prev) => ({ ...prev, error: null })), []);

  // ── Login ─────────────────────────────────────────────────────────────────

  const handleLogin = useCallback(async (payload: LoginRequest) => {
    setLoading(true);
    try {
      const response = await login(payload);

setState({
  user: {
    id: response.user.id,
    name: response.user.name,
    email: response.user.email,
    role: response.user.role,
  },
  loading: false,
  error: null,
});
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'Login failed');
      throw err;
    }
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────

  const handleLogout = useCallback(async () => {
    setLoading(true);
    try {
      await logout();
      setState({ user: null, loading: false, error: null });
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'Logout failed');
      throw err;
    }
  }, []);

  // ── Register ──────────────────────────────────────────────────────────────

  const handleRegister = useCallback(async (payload: RegisterRequest) => {
    setLoading(true);
    try {
      const user = await register(payload);
      setState({
        user:    { id: user.id, name: user.name, email: user.email, role: user.role },
        loading: false,
        error:   null,
      });
      return { id: user.id, name: user.name, email: user.email, role: user.role };
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'Registration failed');
      throw err;
    }
  }, []);

  return {
    ...state,
    login:      handleLogin,
    logout:     handleLogout,
    register:   handleRegister,
    clearError,
  };
}
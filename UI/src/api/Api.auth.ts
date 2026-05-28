import { client } from './Api.client';
import type {
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    LogoutResponse,
} from '../types/Types.auth';

/**
 * POST /api/v1/auth/login
 * Sets httpOnly access + refresh cookies on success.
 */
export async function login(payload: LoginRequest): Promise<LoginResponse> {
  return client.post<LoginResponse>('/auth/login', payload);
}

/**
 * GET /api/v1/auth/logout
 * Clears both auth cookies.
 */
export async function logout(): Promise<LogoutResponse> {
  return client.get<LogoutResponse>('/auth/logout');
}

/**
 * POST /api/v1/users
 * Registers a new account — public, no token required.
 */
export async function register(payload: RegisterRequest): Promise<RegisterResponse> {
  return client.post<RegisterResponse>('/users', payload);
}
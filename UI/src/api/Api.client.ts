// ── Base URL ──────────────────────────────────────────────────────────────────
// In development the React dev server proxies /api → Express on :3000.
// In production set VITE_API_BASE_URL to the real backend origin.

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

// ── Error shape returned by the backend ───────────────────────────────────────

export interface ApiError {
  error:    string;
  message:  string;
  details?: Record<string, unknown>;
}

export class ApiException extends Error {
  public readonly status: number;
  public readonly details?: Record<string, unknown>;

  constructor(status: number, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name    = 'ApiException';
    this.status  = status;
    this.details = details;
  }
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────

/**
 * Thin wrapper around fetch that:
 * - Always sends credentials (httpOnly cookie for auth)
 * - Always sets Content-Type: application/json on non-GET requests
 * - Throws ApiException on non-2xx responses (parsed from the backend error shape)
 * - Returns the parsed JSON body on success
 */
async function request<T>(
  method:  string,
  path:    string,
  body?:   unknown,
): Promise<T> {
  const init: RequestInit = {
    method,
    credentials: 'include',   // required — backend reads auth from httpOnly cookie
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body !== undefined) {
    (init as any).body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${path}`, init);

  // Handle empty responses (e.g. 204 No Content on DELETE)
  const text = await res.text();
  const json = text.length > 0 ? JSON.parse(text) : null;

  if (!res.ok) {
    const err = json as ApiError | null;
    throw new ApiException(
      res.status,
      err?.message ?? `Request failed with status ${res.status}`,
      err?.details,
    );
  }

  return json as T;
}

// ── Convenience methods ───────────────────────────────────────────────────────

export const client = {
  get:    <T>(path: string)                    => request<T>('GET',    path),
  post:   <T>(path: string, body: unknown)     => request<T>('POST',   path, body),
  put:    <T>(path: string, body: unknown)     => request<T>('PUT',    path, body),
  delete: <T>(path: string)                    => request<T>('DELETE', path),
};
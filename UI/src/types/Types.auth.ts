// ── Auth request / response shapes ───────────────────────────────────────────

export interface LoginRequest {
  email:    string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}
export interface RegisterRequest {
  name:     string;
  email:    string;
  password: string;
}

export interface RegisterResponse {
  id:    string;
  name:  string;
  email: string;
  role:  string;
}

export interface LogoutResponse {
  message: string;
}

// ── The user shape stored in auth context ─────────────────────────────────────

export interface AuthUser {
  id:    string;
  name:  string;
  email: string;
  role:  string;
}
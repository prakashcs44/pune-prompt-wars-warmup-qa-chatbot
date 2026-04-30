const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:8000';

export interface ChatResponseData {
  response: string;
  session_id: string;
  user_id: string;
  timestamp: string;
}

export interface SessionInfo {
  session_id: string;
  title: string;
  message_count: number;
  created_at: string;
  last_active: string;
}

export interface SessionListResponse {
  user_id: string;
  sessions: SessionInfo[];
}

export interface LearnerProfile {
  user_id: string;
  pace: string;
  expertise_level: string;
  interests: string[];
  stuck_points: string[];
  understanding_score: number;
  topics_completed: string[];
  progress_history: { timestamp: string; score: number }[];
  total_messages: number;
  created_at: string;
  updated_at: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  model: string;
  ltm_users_count: number;
}

export interface UserOut {
  id: string;
  email: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface OnboardingData {
  age: number;
  profession: string;
  education_level: string;
  interests: string[];
  learning_goals?: string;
}

// ─── API Functions ────────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function sendChatMessage(
  message: string,
  sessionId: string,
  attachments?: { filename: string; content: string }[]
): Promise<ChatResponseData> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({
      message,
      session_id: sessionId,
      attachments,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchSessions(): Promise<SessionListResponse> {
  const res = await fetch(`${API_BASE}/sessions`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error(`Failed to load sessions`);
  return res.json();
}

export async function deleteSession(sessionId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`, { 
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error(`Failed to delete session`);
}

export async function fetchProfile(): Promise<LearnerProfile> {
  const res = await fetch(`${API_BASE}/user/profile`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error(`Failed to load profile`);
  const data = await res.json();
  return data.profile;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed`);
  return res.json();
}

export async function fetchSessionHistory(sessionId: string): Promise<{ session_id: string; messages: any[] }> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/history`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error(`Failed to load session history`);
  return res.json();
}

// ─── Auth Functions ───────────────────────────────────────────

export async function login(email: string, password: string): Promise<Token> {
  const params = new URLSearchParams();
  params.append('username', email);
  params.append('password', password);

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(err.detail || 'Login failed');
  }
  return res.json();
}

export async function signup(email: string, password: string): Promise<UserOut> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Signup failed' }));
    throw new Error(err.detail || 'Signup failed');
  }
  return res.json();
}

export async function fetchMe(): Promise<UserOut> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error(`Failed to load user info`);
  return res.json();
}

export async function submitOnboarding(data: OnboardingData): Promise<void> {
  const res = await fetch(`${API_BASE}/user/onboarding`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Onboarding failed' }));
    throw new Error(err.detail || 'Onboarding failed');
  }
}

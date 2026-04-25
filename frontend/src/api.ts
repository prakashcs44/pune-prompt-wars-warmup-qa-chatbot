const API_BASE = 'http://localhost:8000';

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

// ─── API Functions ────────────────────────────────────────────

export async function sendChatMessage(
  message: string,
  sessionId: string,
  userId: string,
  attachments?: { filename: string; content: string }[]
): Promise<ChatResponseData> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      session_id: sessionId,
      user_id: userId,
      attachments,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchSessions(userId: string): Promise<SessionListResponse> {
  const res = await fetch(`${API_BASE}/sessions/${userId}`);
  if (!res.ok) throw new Error(`Failed to load sessions`);
  return res.json();
}

export async function deleteSession(sessionId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete session`);
}

export async function fetchProfile(userId: string): Promise<LearnerProfile> {
  const res = await fetch(`${API_BASE}/profile/${userId}`);
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
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/history`);
  if (!res.ok) throw new Error(`Failed to load session history`);
  return res.json();
}

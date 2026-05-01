import React, { useState, useEffect, useCallback } from 'react';
import {
  sendChatMessage,
  fetchSessions,
  deleteSession as apiDeleteSession,
  fetchProfile,
  fetchSessionHistory,
  fetchHealth,
  type LearnerProfile,
  type SessionInfo,
  type HealthResponse,
} from '../api';
import { useAuth } from '../context/AuthContext';

// Sub-components
import { DashboardModal } from './chat/DashboardModal';
import { Sidebar } from './chat/Sidebar';
import { ChatHeader } from './chat/ChatHeader';
import { MessageList } from './chat/MessageList';
import { ChatInput } from './chat/ChatInput';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Main Component ───────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
export const ChatInterface: React.FC = () => {
  // State
  const [sessions, setSessions] = useState<Map<string, Message[]>>(new Map());
  const [serverSessions, setServerSessions] = useState<SessionInfo[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [backendOnline, setBackendOnline] = useState(true);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [healthInfo, setHealthInfo] = useState<HealthResponse | null>(null);

  const { user, logout } = useAuth();

  const activeMessages = activeSessionId ? sessions.get(activeSessionId) ?? [] : [];

  // ── Fetch backend data on mount ──────────────────────────
  useEffect(() => {
    fetchProfile()
      .then(setProfile)
      .catch(() => setProfile(null));

    fetchSessions()
      .then(data => {
        setServerSessions(data.sessions);
        setBackendOnline(true);
      })
      .catch(() => setBackendOnline(false));

    fetchHealth()
      .then(setHealthInfo)
      .catch(() => setHealthInfo(null));
  }, []);


  // Periodically refresh profile
  useEffect(() => {
    const id = setInterval(() => {
      fetchProfile().then(setProfile).catch(() => { });
    }, 15000);
    return () => clearInterval(id);
  }, []);

  // ── Actions ──────────────────────────────────────────────────

  const createNewChat = useCallback(() => {
    const id = uid();
    setSessions(prev => new Map(prev).set(id, []));
    setActiveSessionId(id);
    setInput('');
    setSelectedFile(null);
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  const switchSession = async (id: string) => {
    setActiveSessionId(id);
    setInput('');
    setSelectedFile(null);
    if (window.innerWidth < 768) setSidebarOpen(false);

    const localMsgs = sessions.get(id);
    if (!localMsgs || localMsgs.length === 0) {
      try {
        setIsLoading(true);
        const data = await fetchSessionHistory(id);
        const mappedMessages: Message[] = data.messages.map((m: any) => ({
          id: m.id || uid(),
          role: m.role,
          content: m.content,
          timestamp: new Date()
        }));
        setSessions(prev => new Map(prev).set(id, mappedMessages));
      } catch (err) {
        console.error("Failed to fetch session history:", err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await apiDeleteSession(id);
    } catch { }
    setSessions(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
    setServerSessions(prev => prev.filter(s => s.session_id !== id));
    if (activeSessionId === id) {
      const remaining = [...sessions.keys()].filter(k => k !== id);
      setActiveSessionId(remaining[0] ?? null);
    }
  };

  const handleSend = async (overrideMsg?: any) => {
    const msgText = typeof overrideMsg === 'string' ? overrideMsg : input.trim();
    if ((!msgText && !selectedFile) || isLoading) return;

    let content = msgText;
    if (selectedFile) {
      content = content ? `${content}\n📎 ${selectedFile.name}` : `📎 ${selectedFile.name}`;
    }

    let sessionId = activeSessionId;
    if (!sessionId) {
      sessionId = uid();
      setSessions(prev => new Map(prev).set(sessionId!, []));
      setActiveSessionId(sessionId);
    }

    const userMsg: Message = { id: uid(), role: 'user', content, timestamp: new Date() };

    setSessions(prev => {
      const next = new Map(prev);
      next.set(sessionId!, [...(next.get(sessionId!) ?? []), userMsg]);
      return next;
    });

    // Read file if attached (Base64 for all types like PDF, CSV, etc.)
    let attachments: { filename: string; content: string }[] = [];
    if (selectedFile) {
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(selectedFile);
          reader.onload = () => {
            const result = reader.result as string;
            const base64Content = result.split(',')[1]; // Strip metadata prefix
            resolve(base64Content);
          };
          reader.onerror = error => reject(error);
        });
        attachments.push({ filename: selectedFile.name, content: base64 });
      } catch (err) {
        console.error("Failed to read file:", err);
      }
    }


    setInput('');
    setSelectedFile(null);
    setIsLoading(true);

    try {
      const data = await sendChatMessage(
        content,
        sessionId!,
        attachments.length > 0 ? attachments : undefined
      );

      const aiMsg: Message = { id: uid(), role: 'assistant', content: data.response, timestamp: new Date(data.timestamp) };

      setSessions(prev => {
        const next = new Map(prev);
        next.set(sessionId!, [...(next.get(sessionId!) ?? []), aiMsg]);
        return next;
      });

      fetchProfile().then(setProfile).catch(() => { });
      fetchSessions().then(d => setServerSessions(d.sessions)).catch(() => { });
      setBackendOnline(true);
    } catch (err: any) {
      console.error("Chat Error:", err);
      const errMsg: Message = {
        id: uid(), role: 'assistant',
        content: "⚠️ Something went wrong. Please try again.",
        timestamp: new Date(),
      };
      setSessions(prev => {
        const next = new Map(prev);
        next.set(sessionId!, [...(next.get(sessionId!) ?? []), errMsg]);
        return next;
      });
      setBackendOnline(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getSessionTitle = (id: string): string => {
    const server = serverSessions.find(s => s.session_id === id);
    if (server && server.title !== 'New Chat') return server.title;
    const msgs = sessions.get(id);
    const firstUserMsg = msgs?.find(m => m.role === 'user');
    if (firstUserMsg) {
      const content = typeof firstUserMsg.content === 'string' ? firstUserMsg.content : '';
      return content.slice(0, 40) + (content.length > 40 ? '…' : '');
    }
    return 'New Chat';
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#020617] text-slate-100 font-['Inter']">

      {/* Modals */}
      <DashboardModal
        profile={profile}
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
      />

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        sessions={serverSessions}
        localSessionIds={Array.from(sessions.keys())}
        activeSessionId={activeSessionId}
        onNewChat={createNewChat}
        onSwitchSession={switchSession}
        onDeleteSession={handleDeleteSession}
        getSessionTitle={getSessionTitle}
        profile={profile}
        onViewDashboard={() => setIsDashboardOpen(true)}
        userEmail={user?.email}
        backendOnline={backendOnline}
        onLogout={logout}
      />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <ChatHeader
          onToggleSidebar={() => setSidebarOpen(p => !p)}
          title={activeSessionId ? getSessionTitle(activeSessionId) : 'Lumina AI'}
          backendOnline={backendOnline}
          modelInfo={healthInfo?.model}
          onViewDashboard={() => setIsDashboardOpen(true)}
          onNewChat={createNewChat}
        />

        <MessageList
          messages={activeMessages}
          isLoading={isLoading}
          suggestedPrompts={profile?.suggested_prompts}
          onEmptyAction={(text) => {
            setInput(text);
          }}
        />

        <ChatInput
          input={input}
          setInput={setInput}
          onSend={handleSend}
          isLoading={isLoading}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
        />
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, User, Loader2, Paperclip, X,
  Plus, Menu, MessageSquare, Trash2,
  ChevronLeft, Sparkles, GraduationCap,
  Brain, TrendingUp, BookOpen, Zap, Target,
  LayoutDashboard,
  ChevronRight, Award, History, Activity
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, AreaChart, Area
} from 'recharts';
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);
const USER_ID = 'lumina-user-1';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ─── Dashboard Modal ──────────────────────────────────────────────────────────
function DashboardModal({ profile, isOpen, onClose }: { profile: LearnerProfile | null, isOpen: boolean, onClose: () => void }) {
  if (!isOpen || !profile) return null;

  // Prepare chart data
  const chartData = profile.progress_history.map(h => ({
    time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    score: Math.round(h.score * 100)
  }));

  const skillData = [
    { subject: 'Logic', A: 80, fullMark: 100 },
    { subject: 'Coding', A: profile.topics_completed.length * 20 + 30, fullMark: 100 },
    { subject: 'Memory', A: Math.min(100, profile.total_messages * 2), fullMark: 100 },
    { subject: 'Pace', A: profile.pace === 'fast' ? 90 : profile.pace === 'medium' ? 60 : 40, fullMark: 100 },
    { subject: 'Depth', A: Math.round(profile.understanding_score * 100), fullMark: 100 },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl h-full max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">

        {/* Close Button */}
        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all z-10">
          <X className="w-6 h-6" />
        </button>

        {/* Modal Header */}
        <div className="p-8 pb-4 shrink-0">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-900/40">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Learning Insights</h2>
              <p className="text-slate-400 text-sm">Detailed performance metrics for {profile.user_id}</p>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-8 pt-2 space-y-8">

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Avg. Understanding', value: `${Math.round(profile.understanding_score * 100)}%`, icon: Brain, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Topics Mastered', value: profile.topics_completed.length, icon: Award, color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { label: 'Total Interactions', value: profile.total_messages, icon: MessageSquare, color: 'text-primary-400', bg: 'bg-primary-500/10' },
              { label: 'Current Pace', value: profile.pace.toUpperCase(), icon: Zap, color: 'text-violet-400', bg: 'bg-violet-500/10' },
            ].map((stat, i) => (
              <div key={i} className={`${stat.bg} p-5 rounded-2xl border border-white/5 flex flex-col gap-2`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Progress Line Chart */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Learning Momentum
                </h3>
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                      itemStyle={{ color: '#10b981' }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Radar Skill Chart */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary-400" />
                  Cognitive Profile
                </h3>
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={10} />
                    <Radar
                      name="Learner"
                      dataKey="A"
                      stroke="#0ea5e9"
                      fill="#0ea5e9"
                      fillOpacity={0.5}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Interests & Stuck Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-400" />
                Domains of Interest
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map(i => (
                  <div key={i} className="px-4 py-2 bg-primary-500/10 border border-primary-500/20 text-primary-300 rounded-xl text-sm font-medium">
                    {i}
                  </div>
                ))}
                {profile.interests.length === 0 && <p className="text-slate-600 text-sm">No interests recorded yet.</p>}
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <History className="w-4 h-4 text-red-400" />
                Current Challenges
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.stuck_points.map(s => (
                  <div key={s} className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl text-sm font-medium">
                    {s}
                  </div>
                ))}
                {profile.stuck_points.length === 0 && <p className="text-slate-600 text-sm">Clear sailing! No stuck points.</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-8 border-t border-slate-800 bg-slate-900/50 shrink-0 text-center">
          <p className="text-xs text-slate-500 font-medium italic">
            "Lumina continuously adapts its model based on your interactions to provide the most effective learning path."
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (!line.trim()) return <br key={i} />;
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className={i > 0 ? 'mt-1.5' : ''}>
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j} className="font-semibold">{part}</strong> : part
          )}
        </p>
      );
    });
  };

  return (
    <div className={`flex gap-3 animate-fade-in ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ring-2 ${isUser
          ? 'bg-primary-600 ring-primary-500/30 text-white'
          : 'bg-slate-800 ring-slate-700 text-emerald-400'
        }`}>
        {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
      </div>
      <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${isUser
          ? 'bg-primary-600 text-white rounded-tr-sm shadow-md shadow-primary-900/20'
          : 'bg-slate-900 border border-slate-700/60 text-slate-100 rounded-tl-sm shadow-sm'
        }`}>
        <div>{renderContent(message.content)}</div>
        <span className={`block text-[10px] mt-2 select-none ${isUser ? 'text-primary-200/60 text-right' : 'text-slate-500'
          }`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-slate-800 ring-2 ring-slate-700 flex items-center justify-center mt-1 shrink-0">
        <Sparkles className="w-4 h-4 text-emerald-400" />
      </div>
      <div className="px-5 py-4 rounded-2xl rounded-tl-sm bg-slate-900 border border-slate-700/60 shadow-sm flex items-center gap-2">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}

// ─── Profile Card ─────────────────────────────────────────────────────────────
function ProfileCard({ profile, onClick }: { profile: LearnerProfile | null, onClick: () => void }) {
  if (!profile) return null;

  const scorePercent = Math.round(profile.understanding_score * 100);
  const scoreColor = scorePercent >= 70 ? 'text-emerald-400' : scorePercent >= 40 ? 'text-amber-400' : 'text-red-400';
  const scoreBarColor = scorePercent >= 70 ? 'bg-emerald-500' : scorePercent >= 40 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div
      onClick={onClick}
      className="mx-3 mb-3 p-4 bg-slate-800/40 hover:bg-slate-800/80 rounded-2xl border border-white/5 hover:border-primary-500/30 transition-all cursor-pointer group space-y-4 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="w-4 h-4 text-primary-400" />
      </div>

      <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
        <Activity className="w-3.5 h-3.5 text-primary-500" />
        Live Insights
      </div>

      {/* Understanding Score */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-slate-300">Understanding</span>
          <span className={`text-xs font-black ${scoreColor}`}>{scorePercent}%</span>
        </div>
        <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
          <div
            className={`h-full ${scoreBarColor} rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(16,185,129,0.4)]`}
            style={{ width: `${scorePercent}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="capitalize">{profile.pace} pace</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
          <Award className="w-3.5 h-3.5 text-primary-400" />
          <span className="capitalize">{profile.expertise_level}</span>
        </div>
      </div>

      <div className="pt-2 border-t border-white/5 flex items-center justify-center text-[10px] font-bold text-primary-500/80 group-hover:text-primary-400 transition-colors uppercase tracking-widest gap-2">
        <LayoutDashboard className="w-3 h-3" />
        View Full Metrics
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onAction }: { onAction: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 select-none px-4">
      <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
        <GraduationCap className="w-10 h-10 text-primary-500/50" />
      </div>
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-black text-white mb-2 tracking-tight">How can I help you learn today?</h2>
        <p className="text-sm text-slate-400 leading-relaxed font-medium">
          I'm your personalized AI tutor. I adapt to your pace, remember your history,
          and help you bridge knowledge gaps across sessions.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        {[
          { icon: BookOpen, label: 'Explain Quantum Computing', desc: 'using a Lego analogy' },
          { icon: Brain, label: 'Mastering Python OOP', desc: 'beginner-to-advanced roadmap' },
          { icon: Activity, label: 'Analyze my progress', desc: 'show me what I need to focus on' },
          { icon: Target, label: 'Knowledge Check', desc: 'quiz me on recent topics' },
        ].map(({ icon: Icon, label, desc }) => (
          <div
            key={label}
            onClick={() => onAction(`${label} ${desc}`)}
            className="flex items-start gap-4 px-5 py-4 bg-slate-900/40 border border-white/5 rounded-2xl cursor-pointer hover:bg-slate-800/60 hover:border-primary-500/30 transition-all group shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center group-hover:bg-primary-500/10 transition-colors">
              <Icon className="w-5 h-5 text-primary-400 group-hover:text-primary-300" />
            </div>
            <div>
              <p className="text-sm text-slate-200 font-bold">{label}</p>
              <p className="text-xs text-slate-500 font-medium">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
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

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeMessages = activeSessionId ? sessions.get(activeSessionId) ?? [] : [];

  // ── Fetch backend data on mount ──────────────────────────
  useEffect(() => {
    fetchProfile(USER_ID)
      .then(setProfile)
      .catch(() => setProfile(null));

    fetchSessions(USER_ID)
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
      fetchProfile(USER_ID).then(setProfile).catch(() => { });
    }, 15000);
    return () => clearInterval(id);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeMessages, isLoading]);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

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

  const handleSend = async (overrideMsg?: string) => {
    const msgText = overrideMsg ?? input.trim();
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
        USER_ID,
        attachments.length > 0 ? attachments : undefined
      );

      const aiMsg: Message = { id: uid(), role: 'assistant', content: data.response, timestamp: new Date(data.timestamp) };

      setSessions(prev => {
        const next = new Map(prev);
        next.set(sessionId!, [...(next.get(sessionId!) ?? []), aiMsg]);
        return next;
      });

      fetchProfile(USER_ID).then(setProfile).catch(() => { });
      fetchSessions(USER_ID).then(d => setServerSessions(d.sessions)).catch(() => { });
      setBackendOnline(true);
    } catch {
      const errMsg: Message = {
        id: uid(), role: 'assistant',
        content: "⚠️ Could not reach the server. Make sure the backend is running on port 8000.",
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
    if (firstUserMsg) return firstUserMsg.content.slice(0, 40) + (firstUserMsg.content.length > 40 ? '…' : '');
    return 'New Chat';
  };

  const allSessionIds = Array.from(new Set([
    ...sessions.keys(),
    ...serverSessions.map(s => s.session_id),
  ]));

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#020617] text-slate-100 font-['Inter']">

      {/* Modals */}
      <DashboardModal
        profile={profile}
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
      />

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/70 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ─── SIDEBAR ──────────────────────────────────────────── */}
      <aside className={`fixed md:relative inset-y-0 left-0 z-30 flex flex-col bg-slate-950 border-r border-white/5 transition-all duration-500 ease-in-out overflow-hidden ${sidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0 md:w-0'
        }`}>
        <div className="flex flex-col h-full w-80">

          {/* Logo + Close */}
          <div className="flex items-center justify-between px-6 pt-8 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-primary-900/40">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-black tracking-tight">Lumina</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800 transition-all" title="Close sidebar">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* New Chat */}
          <div className="px-4 pb-4 shrink-0">
            <button onClick={createNewChat} className="w-full flex items-center gap-3 px-5 py-3.5 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl transition-all text-sm font-bold shadow-lg shadow-primary-900/20 group">
              <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300" />
              New Learning Session
            </button>
          </div>

          <div className="mx-6 border-t border-white/5 mb-4 shrink-0" />

          {/* Profile Card (Interactive) */}
          <ProfileCard profile={profile} onClick={() => setIsDashboardOpen(true)} />

          {/* Session List */}
          <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1 min-h-0 custom-scrollbar">
            <p className="px-4 py-2 text-[10px] font-black text-slate-600 uppercase tracking-[0.25em]">Recent Sessions</p>
            {allSessionIds.length === 0 && (
              <p className="px-4 py-8 text-xs text-slate-700 text-center font-medium italic">Your learning journey begins here…</p>
            )}
            {allSessionIds.map(id => (
              <div
                key={id}
                onClick={() => switchSession(id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer group transition-all duration-200 ${activeSessionId === id
                    ? 'bg-slate-900 text-slate-100 shadow-inner border border-white/5'
                    : 'text-slate-500 hover:bg-slate-900/50 hover:text-slate-300'
                  }`}
              >
                <MessageSquare className={`w-4 h-4 shrink-0 transition-colors ${activeSessionId === id ? 'text-primary-500' : ''}`} />
                <span className="text-sm truncate flex-1 font-semibold tracking-tight">{getSessionTitle(id)}</span>
                <button onClick={(e) => handleDeleteSession(e, id)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Archive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-white/5 bg-slate-950 shrink-0">
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center text-white shadow-md shrink-0 border border-white/10">
                <User className="w-4 h-4 text-slate-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-200 truncate">{USER_ID}</p>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${backendOnline ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`} />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{backendOnline ? 'Sync Active' : 'Offline'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── MAIN AREA ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(p => !p)} className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-white/10 transition-all" title="Toggle Sidebar">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-black leading-none text-white tracking-tight">
                {activeSessionId ? getSessionTitle(activeSessionId) : 'Lumina AI'}
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                <div className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  Adaptive Logic: {healthInfo?.model || 'Groq Llama 3.3'}
                </span>

              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDashboardOpen(true)}
              className="p-2.5 rounded-xl text-slate-400 hover:text-primary-400 hover:bg-primary-500/10 transition-all"
              title="View Metrics"
            >
              <LayoutDashboard className="w-5 h-5" />
            </button>
            <button onClick={createNewChat} className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-xl transition-all">
              <Plus className="w-4 h-4" />
              New Session
            </button>
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 custom-scrollbar">
          {activeMessages.length === 0 && !isLoading ? (
            <EmptyState onAction={(text) => {
              setInput(text);
              textareaRef.current?.focus();
            }} />
          ) : (

            <div className="max-w-4xl mx-auto space-y-6 pb-8">
              {activeMessages.map(msg => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {isLoading && <TypingIndicator />}
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="shrink-0 px-6 pb-8 pt-4 bg-gradient-to-t from-[#020617] via-[#020617] to-transparent z-10">
          <div className="max-w-4xl mx-auto">
            {/* File Chip */}
            {selectedFile && (
              <div className="mb-3 flex items-center gap-3 bg-slate-900 border border-white/10 text-sm text-slate-200 px-4 py-3 rounded-2xl w-max max-w-full shadow-2xl animate-fade-in ring-1 ring-primary-500/20">
                <div className="p-2 bg-primary-500/10 rounded-lg">
                  <Paperclip className="w-4 h-4 text-primary-400 shrink-0" />
                </div>
                <span className="truncate max-w-[250px] font-bold text-xs">{selectedFile.name}</span>
                <button onClick={() => setSelectedFile(null)} className="ml-2 p-1.5 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Input Wrapper */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 to-indigo-600 rounded-[22px] blur opacity-10 group-focus-within:opacity-25 transition-opacity duration-500"></div>
              <div className="relative flex items-end gap-3 bg-slate-900/90 border border-white/10 hover:border-white/20 focus-within:border-primary-500/50 focus-within:ring-4 focus-within:ring-primary-500/5 rounded-[20px] px-4 py-3.5 transition-all shadow-2xl backdrop-blur-xl">
                <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="p-2.5 text-slate-500 hover:text-primary-400 hover:bg-primary-500/10 rounded-xl transition-all shrink-0 mb-0.5" title="Attach context">
                  <Paperclip className="w-6 h-6" />
                </button>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                  }}
                  placeholder="Ask Lumina anything…"
                  rows={1}
                  className="flex-1 bg-transparent border-none outline-none resize-none min-h-[48px] max-h-48 py-3 text-[15px] font-medium text-slate-100 placeholder:text-slate-600 leading-relaxed"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={isLoading || (!input.trim() && !selectedFile)}
                  className="p-3.5 mb-0.5 bg-primary-600 hover:bg-primary-500 disabled:bg-slate-800 disabled:text-slate-600 rounded-[14px] transition-all flex items-center justify-center shrink-0 group shadow-lg shadow-primary-900/20 disabled:shadow-none"
                >
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  ) : (
                    <Send className="w-6 h-6 text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4 px-2">
              <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em]">
                Personalized Learning Engine 1.0
              </p>
              <div className="flex gap-4">
                <span className="text-[10px] text-slate-700 font-bold uppercase tracking-widest">End-to-End Encrypted</span>
                <span className="text-[10px] text-slate-700 font-bold uppercase tracking-widest">Powered by Groq</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

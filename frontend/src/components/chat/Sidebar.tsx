import React from 'react';
import { GraduationCap, ChevronLeft, Plus, MessageSquare, Trash2, User, LogOut } from 'lucide-react';
import { ProfileCard } from './ProfileCard';
import { type SessionInfo, type LearnerProfile } from '../../api';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  sessions: SessionInfo[];
  localSessionIds: string[];
  activeSessionId: string | null;
  onNewChat: () => void;
  onSwitchSession: (id: string) => void;
  onDeleteSession: (e: React.MouseEvent, id: string) => void;
  getSessionTitle: (id: string) => string;
  profile: LearnerProfile | null;
  onViewDashboard: () => void;
  userEmail?: string;
  backendOnline: boolean;
  onLogout: () => void;
}

export function Sidebar({
  isOpen,
  setIsOpen,
  sessions,
  localSessionIds,
  activeSessionId,
  onNewChat,
  onSwitchSession,
  onDeleteSession,
  getSessionTitle,
  profile,
  onViewDashboard,
  userEmail,
  backendOnline,
  onLogout
}: SidebarProps) {
  const allSessionIds = Array.from(new Set([
    ...localSessionIds,
    ...sessions.map(s => s.session_id),
  ]));

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-20 bg-black/70 backdrop-blur-sm md:hidden" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`fixed md:relative inset-y-0 left-0 z-30 flex flex-col bg-slate-950 border-r border-white/5 transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0 md:w-0'
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
            <button onClick={() => setIsOpen(false)} className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800 transition-all cursor-pointer" title="Close sidebar">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* New Chat */}
          <div className="px-4 pb-4 shrink-0">
            <button onClick={onNewChat} className="w-full flex items-center gap-3 px-5 py-3.5 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl transition-all text-sm font-bold shadow-lg shadow-primary-900/20 group cursor-pointer">
              <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300" />
              New Learning Session
            </button>
          </div>

          <div className="mx-6 border-t border-white/5 mb-4 shrink-0" />

          {/* Profile Card */}
          <ProfileCard profile={profile} onClick={onViewDashboard} />

          {/* Session List */}
          <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1 min-h-0 custom-scrollbar">
            <p className="px-4 py-2 text-[10px] font-black text-slate-600 uppercase tracking-[0.25em]">Recent Sessions</p>
            {allSessionIds.length === 0 && (
              <p className="px-4 py-8 text-xs text-slate-700 text-center font-medium italic">Your learning journey begins here…</p>
            )}
            {allSessionIds.map(id => (
              <div
                key={id}
                onClick={() => onSwitchSession(id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer group transition-all duration-200 ${activeSessionId === id
                  ? 'bg-slate-900 text-slate-100 shadow-inner border border-white/5'
                  : 'text-slate-500 hover:bg-slate-900/50 hover:text-slate-300'
                  }`}
              >
                <MessageSquare className={`w-4 h-4 shrink-0 transition-colors ${activeSessionId === id ? 'text-primary-500' : ''}`} />
                <span className="text-sm truncate flex-1 font-semibold tracking-tight">{getSessionTitle(id)}</span>
                <button onClick={(e) => onDeleteSession(e, id)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer" title="Archive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-white/5 bg-slate-950 shrink-0 space-y-3">
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center text-white shadow-md shrink-0 border border-white/10">
                <User className="w-4 h-4 text-slate-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-200 truncate">{userEmail || 'User'}</p>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${backendOnline ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`} />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{backendOnline ? 'Sync Active' : 'Offline'}</p>
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm font-bold group cursor-pointer"
            >
              <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

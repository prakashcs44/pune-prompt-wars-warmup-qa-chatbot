import { Menu, LayoutDashboard, Plus } from 'lucide-react';

interface ChatHeaderProps {
  onToggleSidebar: () => void;
  title: string;
  backendOnline: boolean;
  modelInfo?: string;
  onViewDashboard: () => void;
  onNewChat: () => void;
}

export function ChatHeader({
  onToggleSidebar,
  title,
  backendOnline,
  modelInfo,
  onViewDashboard,
  onNewChat
}: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl shrink-0 z-10">
      <div className="flex items-center gap-4">
        <button onClick={onToggleSidebar} className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-white/10 transition-all" title="Toggle Sidebar">
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-black leading-none text-white tracking-tight">
            {title}
          </h1>
          <div className="flex items-center gap-2 mt-1.5">
            <div className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Adaptive Logic: {modelInfo || 'Groq Llama 3.3'}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onViewDashboard}
          className="p-2.5 rounded-xl text-slate-400 hover:text-primary-400 hover:bg-primary-500/10 transition-all"
          title="View Metrics"
        >
          <LayoutDashboard className="w-5 h-5" />
        </button>
        <button onClick={onNewChat} className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-xl transition-all">
          <Plus className="w-4 h-4" />
          New Session
        </button>
      </div>
    </header>
  );
}

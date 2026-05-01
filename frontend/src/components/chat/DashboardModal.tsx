import { X, Activity, TrendingUp, Target, Sparkles, History, Brain, Award, MessageSquare, Zap } from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, AreaChart, Area
} from 'recharts';
import { type LearnerProfile } from '../../api';

interface DashboardModalProps {
  profile: LearnerProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DashboardModal({ profile, isOpen, onClose }: DashboardModalProps) {
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
        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all z-10 cursor-pointer">
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

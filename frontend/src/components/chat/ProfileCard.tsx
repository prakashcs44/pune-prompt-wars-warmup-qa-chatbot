import React from 'react';
import { Activity, ChevronRight, Zap, Award, LayoutDashboard } from 'lucide-react';
import { type LearnerProfile } from '../../api';

interface ProfileCardProps {
  profile: LearnerProfile | null;
  onClick: () => void;
}

export function ProfileCard({ profile, onClick }: ProfileCardProps) {
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

import { GraduationCap, BookOpen, Brain, Activity, Target } from 'lucide-react';

interface EmptyStateProps {
  onAction: (text: string) => void;
}

export function EmptyState({ onAction }: EmptyStateProps) {
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

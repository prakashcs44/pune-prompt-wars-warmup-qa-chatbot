import { Sparkles } from 'lucide-react';

export function TypingIndicator() {
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

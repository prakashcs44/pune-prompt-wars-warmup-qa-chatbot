import { useRef, useEffect } from 'react';
import { Paperclip, X, Loader2, Send } from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (val: string) => void;
  onSend: () => void;
  isLoading: boolean;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
}

export function ChatInput({
  input,
  setInput,
  onSend,
  isLoading,
  selectedFile,
  setSelectedFile
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  return (
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
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); }
              }}
              placeholder="Ask Lumina anything…"
              rows={1}
              className="flex-1 bg-transparent border-none outline-none resize-none min-h-[48px] max-h-48 py-3 text-[15px] font-medium text-slate-100 placeholder:text-slate-600 leading-relaxed"
            />
            <button
              onClick={onSend}
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
  );
}

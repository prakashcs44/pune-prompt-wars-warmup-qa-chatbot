import { useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { EmptyState } from './EmptyState';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onEmptyAction: (text: string) => void;
  suggestedPrompts?: string[];
}

export function MessageList({ messages, isLoading, onEmptyAction, suggestedPrompts }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 custom-scrollbar">
      {messages.length === 0 && !isLoading ? (
        <EmptyState onAction={onEmptyAction} suggestedPrompts={suggestedPrompts} />
      ) : (
        <div className="max-w-4xl mx-auto space-y-6 pb-8">
          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isLoading && <TypingIndicator />}
        </div>
      )}
    </div>
  );
}

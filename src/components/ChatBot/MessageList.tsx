import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, User } from 'lucide-react';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface MessageListProps {
  messages: Message[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <div className="space-y-3 p-3">
      <AnimatePresence initial={false}>
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`p-2 rounded-full ${message.role === 'assistant' ? 'bg-white/80 shadow-sm' : 'bg-primary/20'} border border-white/20 shrink-0`}>
              {message.role === 'assistant' ? <Bot size={14} className="text-primary" /> : <User size={14} className="text-primary" />}
            </div>
            <div className={`max-w-[80%] px-4 py-2 rounded-[1.5rem] text-[11px] leading-relaxed font-semibold shadow-sm transition-all ${
              message.role === 'assistant' 
                ? 'bg-white/60 border border-white/40 text-slate-800' 
                : 'bg-primary text-primary-foreground shadow-lg shadow-primary/10'
            }`}>
              {message.content}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

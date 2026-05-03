import React, { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 border-t border-white/20 bg-transparent">
      <div className="relative flex items-center gap-2">
        <div className="absolute left-4 text-primary/60">
          <Sparkles size={14} />
        </div>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="描述你的设计意图..."
          disabled={isLoading}
          className="pl-10 pr-12 h-11 text-xs bg-white/40 border-white/30 focus:bg-white/60 transition-all rounded-full"
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={isLoading || !input.trim()}
          className="absolute right-1.5 w-8 h-8 rounded-full bg-primary hover:bg-primary/90 transition-all active:scale-90"
        >
          <Send size={14} className="text-white" />
        </Button>
      </div>
    </form>
  );
};

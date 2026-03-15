import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Loader2, Sparkles, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/src/lib/utils';
import { sendMessageStream } from '@/src/services/gemini';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      id: Date.now().toString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();
    let assistantContent = '';

    try {
      const stream = sendMessageStream(input);
      
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '', id: assistantMessageId },
      ]);

      for await (const chunk of stream) {
        assistantContent += chunk;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: assistantContent }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Maaf, terjadi kesalahan saat menghubungi asisten. Silakan coba lagi.',
          id: (Date.now() + 2).toString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-2xl flex flex-col h-[85vh] bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <header className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-orange-500/30">
              <img 
                src="https://picsum.photos/seed/roger-mlbb-werewolf/100/100" 
                alt="Roger Avatar" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Roger (MLBB)</h1>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-orange-400" />
                The Dire Wolf Hunter
              </p>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-red-400"
            title="Clear Chat"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </header>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
              <img 
                src="https://picsum.photos/seed/roger-mlbb-werewolf/200/200" 
                alt="Roger Large Avatar" 
                className="w-24 h-24 rounded-full border-2 border-orange-600/30 object-cover grayscale"
                referrerPolicy="no-referrer"
              />
              <p className="text-slate-400 max-w-xs">
                Siap berburu, Tuan Andy! Saya Roger. Perintah apa yang Anda miliki untuk saya hari ini?
              </p>
            </div>
          )}
          
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-3",
                  msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden",
                  msg.role === 'user' ? "bg-slate-700" : "bg-orange-600"
                )}>
                  {msg.role === 'user' ? (
                    <User className="w-5 h-5" />
                  ) : (
                    <img 
                      src="https://picsum.photos/seed/roger-mlbb-werewolf/50/50" 
                      alt="Roger" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
                <div className={cn(
                  "max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed",
                  msg.role === 'user' 
                    ? "bg-slate-800 text-slate-100 rounded-tr-none" 
                    : "bg-slate-800/50 border border-slate-700 text-slate-200 rounded-tl-none"
                )}>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center animate-pulse overflow-hidden">
                <img 
                  src="https://picsum.photos/seed/roger-mlbb-werewolf/50/50" 
                  alt="Roger Loading" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="bg-slate-800/50 border border-slate-700 p-3 rounded-2xl rounded-tl-none">
                <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <footer className="p-4 bg-slate-900 border-t border-slate-800">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Tanya sesuatu..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-2 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg transition-all text-white"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-[10px] text-center text-slate-500 mt-2">
            Asisten AI dapat membuat kesalahan. Periksa informasi penting.
          </p>
        </footer>
      </div>
    </div>
  );
}

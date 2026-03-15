import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Loader2, Sparkles, Trash2, Volume2, VolumeX, Sun, Moon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/src/lib/utils';
import { sendMessageStream, generateSpeech } from '@/src/services/gemini';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('roger-theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('roger-theme', newTheme);
  };

  const playAudio = async (text: string) => {
    if (!isVoiceEnabled) return;
    try {
      const base64Audio = await generateSpeech(text);
      if (base64Audio) {
        const audioSrc = `data:audio/mp3;base64,${base64Audio}`;
        if (audioRef.current) {
          audioRef.current.src = audioSrc;
          audioRef.current.play();
        } else {
          const audio = new Audio(audioSrc);
          audioRef.current = audio;
          audio.play();
        }
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

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

      if (isVoiceEnabled) {
        playAudio(assistantContent);
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
    <div className={cn(
      "min-h-screen flex flex-col items-center p-4 md:p-8 transition-colors duration-300",
      theme === 'dark' ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    )}>
      <div className={cn(
        "w-full max-w-2xl flex flex-col h-[85vh] rounded-2xl border shadow-2xl overflow-hidden transition-colors duration-300",
        theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      )}>
        {/* Header */}
        <header className={cn(
          "p-4 border-b flex items-center justify-between backdrop-blur-sm transition-colors duration-300",
          theme === 'dark' ? "bg-slate-900/50 border-slate-800" : "bg-white/50 border-slate-200"
        )}>
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
              <p className={cn(
                "text-xs flex items-center gap-1",
                theme === 'dark' ? "text-slate-400" : "text-slate-500"
              )}>
                <Sparkles className="w-3 h-3 text-orange-400" />
                The Dire Wolf Hunter
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className={cn(
                "p-2 rounded-full transition-colors",
                theme === 'dark' ? "text-yellow-400 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"
              )}
              title={theme === 'dark' ? "Mode Terang" : "Mode Malam"}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
              className={cn(
                "p-2 rounded-full transition-colors",
                isVoiceEnabled ? "text-orange-400 bg-orange-400/10" : "text-slate-400 hover:bg-slate-800"
              )}
              title={isVoiceEnabled ? "Matikan Suara" : "Aktifkan Suara"}
            >
              {isVoiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button
              onClick={clearChat}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-red-400"
              title="Clear Chat"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className={cn(
            "flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth relative",
            theme === 'dark' ? "bg-slate-900" : "bg-white"
          )}
        >
          {/* Forest Theme Background Overlay */}
          <div className={cn(
            "absolute inset-0 pointer-events-none opacity-5 mix-blend-overlay transition-opacity duration-500",
            theme === 'dark' ? "opacity-[0.07]" : "opacity-[0.03]"
          )}>
            <img 
              src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=1000" 
              alt="Forest Background" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="relative z-10 space-y-6">
            {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
              <img 
                src="https://picsum.photos/seed/roger-mlbb-werewolf/200/200" 
                alt="Roger Large Avatar" 
                className={cn(
                  "w-24 h-24 rounded-full border-2 object-cover grayscale",
                  theme === 'dark' ? "border-orange-600/30" : "border-orange-600/50"
                )}
                referrerPolicy="no-referrer"
              />
              <p className={cn(
                "max-w-xs",
                theme === 'dark' ? "text-slate-400" : "text-slate-600"
              )}>
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
                  msg.role === 'user' 
                    ? (theme === 'dark' ? "bg-slate-700" : "bg-slate-200") 
                    : "bg-orange-600"
                )}>
                  {msg.role === 'user' ? (
                    <User className={cn("w-5 h-5", theme === 'dark' ? "text-slate-100" : "text-slate-600")} />
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
                  "max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed transition-colors duration-300",
                  msg.role === 'user' 
                    ? (theme === 'dark' ? "bg-slate-800 text-slate-100 rounded-tr-none" : "bg-slate-100 text-slate-900 rounded-tr-none")
                    : (theme === 'dark' ? "bg-slate-800/50 border border-slate-700 text-slate-200 rounded-tl-none" : "bg-orange-50 border border-orange-100 text-slate-800 rounded-tl-none")
                )}>
                  <div className={cn(
                    "prose prose-sm max-w-none",
                    theme === 'dark' ? "prose-invert" : ""
                  )}>
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
                <div className={cn(
                  "p-3 rounded-2xl rounded-tl-none border transition-colors duration-300",
                  theme === 'dark' ? "bg-slate-800/50 border-slate-700" : "bg-slate-100 border-slate-200"
                )}>
                  <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <footer className={cn(
          "p-4 border-t transition-colors duration-300",
          theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        )}>
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Tanya sesuatu..."
              className={cn(
                "w-full rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all text-sm",
                theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"
              )}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-2 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg transition-all text-white"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
          <p className={cn(
            "text-[10px] text-center mt-2",
            theme === 'dark' ? "text-slate-500" : "text-slate-400"
          )}>
            Asisten AI dapat membuat kesalahan. Periksa informasi penting.
          </p>
        </footer>
      </div>
    </div>
  );
}

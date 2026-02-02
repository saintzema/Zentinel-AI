import { Bot, Send, User, Sparkles, Terminal, Activity, Info } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface Message {
    id: string;
    role: 'ziva' | 'user';
    content: string;
    timestamp: Date;
}

const initialMessages: Message[] = [
    {
        id: '1',
        role: 'ziva',
        content: 'Greetings, Commander. I am ZIVA (Zentinel Intelligent Virtual Assistant). Systems are nominal. How can I assist with tactical operations today?',
        timestamp: new Date(),
    }
];

export default function AIAssistantPage() {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');

        // Mock ZIVA response
        setTimeout(() => {
            const zivaMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'ziva',
                content: `Processing tactical query: "${input}". Analyzing active data streams... Neural link established. Report: Current perimeter stability is at 94.2%. No anomalies detected in Sector 4.`,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, zivaMsg]);
        }, 1000);
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-8 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Bot className="text-emerald-500" />
                        ZIVA_CORE
                    </h2>
                    <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-mono">Neural Interface & Strategic Consultation</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2 text-[10px] font-mono text-emerald-500">
                        <Activity size={14} className="animate-pulse" />
                        LLM_LINK: STABLE
                    </div>
                </div>
            </div>

            <div className="flex-1 flex gap-6 min-h-0">
                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden relative backdrop-blur-md shadow-2xl">
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'ziva' ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-slate-700 text-slate-300'
                                    }`}>
                                    {msg.role === 'ziva' ? <Sparkles size={16} /> : <User size={16} />}
                                </div>
                                <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'ziva'
                                    ? 'bg-emerald-500/5 border border-emerald-500/20 text-slate-200 rounded-tl-none'
                                    : 'bg-slate-800 border border-slate-700 text-white rounded-tr-none'
                                    }`}>
                                    <div className="font-mono text-[10px] text-slate-500 mb-1 flex items-center gap-2">
                                        {msg.role === 'ziva' ? 'ZIVA_V2.0' : 'COMMANDER'} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-6 bg-slate-900/50 border-t border-slate-800">
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Consult ZIVA for strategic intel..."
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 pr-12 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-600 font-mono"
                            />
                            <button
                                onClick={handleSend}
                                className="absolute right-2 top-1.5 p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/10"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Info Sidebar */}
                <div className="w-80 space-y-6 hidden lg:block shrink-0 overflow-y-auto custom-scrollbar">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                        <h3 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Terminal size={12} />
                            Suggested Consultations
                        </h3>
                        <div className="space-y-2">
                            {[
                                "Analyze Sector 4 thermal spikes",
                                "Provide drone battery life forecast",
                                "Summary of intruder patterns (24h)",
                                "Recalibrate neural thresholds"
                            ].map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => setInput(q)}
                                    className="w-full text-left p-2.5 text-[11px] text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/5 border border-transparent hover:border-emerald-500/20 rounded-lg transition-all"
                                >
                                    "{q}"
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                        <h3 className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Activity size={12} />
                            System Awareness
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-slate-500 uppercase">Context Depth</span>
                                <span className="text-[11px] font-mono text-slate-300">4096 Tokens</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-slate-500 uppercase">Inference Speed</span>
                                <span className="text-[11px] font-mono text-slate-300">12ms</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-slate-500 uppercase">Decision Confidence</span>
                                <span className="text-[11px] font-mono text-emerald-500">99.2%</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                        <div className="flex gap-3 text-amber-500 mb-2">
                            <Info size={16} />
                            <span className="text-[10px] font-bold uppercase">Tactical Advisory</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono leading-relaxed italic">ZIVA operates as a strategic advisor. Final kill-chain decisions remain with the human operator.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Send, Bot, Activity } from 'lucide-react';
import { useSound } from '../hooks/useSound';
import { useDetections } from '../hooks/useDetections';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

interface ZivaProps {
    active?: boolean;
}

export default function ZivaAssistant({ active = false }: ZivaProps = {}) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [speaking, setSpeaking] = useState(false);
    const [initialized, setInitialized] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { playSound } = useSound();
    const { latestDetection } = useDetections();

    // Female AI Assistant Voice
    const speak = (text: string) => {
        if (!voiceEnabled || !('speechSynthesis' in window)) return;

        // Small delay to ensure voices are loaded (especially on first load)
        const runSpeak = () => {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.05; // Slightly faster for a "smart" feel
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            const voices = window.speechSynthesis.getVoices();

            // Prefer high-quality female voices across different platforms
            const preferredVoices = [
                'Samantha', 'Victoria', 'Karen', 'Tessa', 'Moira', 'Zira',
                'Google UK English Female', 'Microsoft Zira', 'English (United Kingdom)'
            ];

            let selectedVoice = null;
            for (const name of preferredVoices) {
                selectedVoice = voices.find(v => v.name.includes(name));
                if (selectedVoice) break;
            }

            if (!selectedVoice) {
                selectedVoice = voices.find(v => v.name.toLowerCase().includes('female')) || voices[0];
            }

            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }

            utterance.onstart = () => setSpeaking(true);
            utterance.onend = () => setSpeaking(false);
            window.speechSynthesis.speak(utterance);
        };

        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = () => runSpeak();
        } else {
            runSpeak();
        }
    };

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Load voices
    useEffect(() => {
        if ('speechSynthesis' in window) {
            const loadVoices = () => {
                window.speechSynthesis.getVoices();
            };
            loadVoices();
            if (window.speechSynthesis.onvoiceschanged !== undefined) {
                window.speechSynthesis.onvoiceschanged = loadVoices;
            }
        }
    }, []);

    // Initial greeting on mount
    useEffect(() => {
        if (!initialized) {
            const greeting = 'Zentinel AI Online. Systems ready.';
            setMessages([{
                role: 'assistant',
                content: greeting,
                timestamp: Date.now()
            }]);
            speak(greeting);
            playSound('activation');
            setInitialized(true);
        }
    }, []);

    // Announce detections
    useEffect(() => {
        if (latestDetection && latestDetection.should_announce) {
            const announcement = `Object detected: ${latestDetection.label}. Tracking ID ${latestDetection.persistent_id}.`;
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: announcement,
                timestamp: Date.now()
            }]);
            speak(announcement);
            playSound('detection');
        }
    }, [latestDetection?.id]);

    // System activation announcement
    useEffect(() => {
        if (!initialized) return;

        if (active) {
            const msg = "Video Activated";
            speak(msg);
            playSound('activation');
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: msg,
                timestamp: Date.now()
            }]);
        } else {
            const msg = "Disconnected";
            speak(msg);
            playSound('deactivation');
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: msg,
                timestamp: Date.now()
            }]);
        }
    }, [active]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage: Message = {
            role: 'user',
            content: input,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch(getApiUrl('/api/v1/ziva/chat'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: input })
            });

            const data = await response.json();

            const assistantMessage: Message = {
                role: 'assistant',
                content: data.response,
                timestamp: Date.now() // Use current time instead of server time
            };

            setMessages(prev => [...prev, assistantMessage]);
            speak(data.response);
            playSound('ui_beep');

        } catch (err) {
            console.error('ZIVA chat error:', err);
            const errorMessage: Message = {
                role: 'assistant',
                content: 'Communication error. Please try again.',
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="h-full bg-slate-900/50 backdrop-blur border border-slate-700 rounded-lg flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-700 bg-slate-900/80">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bot className="text-emerald-500" size={20} />
                        <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">ZIVA</h3>
                            <p className="text-[10px] text-slate-500 font-mono">Zentinel Intelligence Virtual Assistant</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {speaking && <Activity className="text-emerald-500 animate-pulse" size={16} />}
                        <button
                            onClick={() => setVoiceEnabled(!voiceEnabled)}
                            className={`p-1.5 rounded transition-colors ${voiceEnabled
                                ? 'text-emerald-500 hover:bg-emerald-500/20'
                                : 'text-slate-600 hover:bg-slate-800'
                                }`}
                            title={voiceEnabled ? 'Mute Voice' : 'Enable Voice'}
                        >
                            {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${msg.role === 'user'
                                ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/50'
                                : 'bg-slate-800/80 text-slate-200 border border-slate-700'
                                }`}
                        >
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                            <div className={`text-[10px] mt-1 font-mono ${msg.role === 'user' ? 'text-emerald-500/70' : 'text-slate-500'
                                }`}>
                                {new Date(msg.timestamp).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: true
                                })}
                            </div>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-800/80 text-slate-400 px-3 py-2 rounded-lg text-sm border border-slate-700">
                            <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                                <span className="text-xs font-mono">Processing...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-slate-700 bg-slate-900/80">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask ZIVA anything..."
                        disabled={loading}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={loading || !input.trim()}
                        className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/50 text-emerald-500 rounded hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <Send size={16} />
                    </button>
                </div>
                <div className="mt-2 text-[10px] text-slate-600 font-mono">
                    Voice: {voiceEnabled ? 'ENABLED' : 'DISABLED'} | Status: {speaking ? 'SPEAKING' : 'READY'}
                </div>
            </div>
        </div>
    );
}

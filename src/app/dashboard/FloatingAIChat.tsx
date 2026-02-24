// --- src/app/dashboard/FloatingAIChat.tsx ---

'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Zap, ArrowUpRight, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

type Message = { role: 'user' | 'assistant'; content: string; };
type OfferData = { name: string; price: number; oldPrice: number; category: string; link: string; };

function OfferCard({ offer }: { offer: OfferData }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 border border-emerald-500/30 rounded-3xl p-5 my-4 shadow-2xl relative group"
        >
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent shadow-[0_0_15px_rgba(16,185,129,0.5)]" />

            <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        {offer.category}
                    </span>
                    <h4 className="text-xl font-black text-white tracking-tight">{offer.name}</h4>
                </div>
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg border-4 border-gray-800 text-black">
                    <Zap className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                </div>
            </div>

            <div className="flex items-end gap-3 mb-6">
                <div className="space-y-0">
                    <span className="text-xs text-gray-500 line-through font-bold decoration-rose-500/50 decoration-2">
                        {formatCurrency(offer.oldPrice)}
                    </span>
                    <p className="text-4xl font-black text-white tracking-tighter">
                        {formatCurrency(offer.price)}
                    </p>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold mb-1.5 uppercase tracking-widest bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/20">
                    Súper Ahorro
                </span>
            </div>

            <a
                href={offer.link} target="_blank" rel="noopener noreferrer"
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-black text-sm uppercase tracking-widest rounded-2xl transition-all shadow-[0_10px_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 group/btn"
            >
                Contratar Ahora <ArrowUpRight className="w-5 h-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
            </a>
        </motion.div>
    );
}

export default function FloatingAIChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    useEffect(() => { if (isOpen) scrollToBottom(); }, [messages, isOpen]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: input,
                    history: messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }))
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Error de conexión");

            setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);

            // Avisamos al navegador para que recargue las Huchas y Presupuestos al instante
            if (data.action === 'GOAL_CREATED') window.dispatchEvent(new Event('goal-created'));
            if (data.action === 'BUDGET_CREATED') window.dispatchEvent(new Event('budget-created'));

        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "⚠️ Lo siento, no he podido conectar con la IA." }]);
        } finally {
            setLoading(false);
        }
    };

    const renderMessageContent = (content: string) => {
        return content.split(':::OFFER_CARD').map((part, i) => {
            if (i % 2 === 0) {
                return (
                    <div key={i} className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-strong:text-emerald-400">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{part}</ReactMarkdown>
                    </div>
                );
            } else {
                try {
                    return <OfferCard key={i} offer={JSON.parse(part.split(':::')[0])} />;
                } catch { return null; }
            }
        });
    };

    return (
        <div className="fixed bottom-6 right-6 z-[90] flex flex-col items-end gap-4">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20, transformOrigin: 'bottom right' }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        transition={{ type: "spring", bounce: 0.35, duration: 0.5 }}
                        className="w-[350px] md:w-[420px] h-[600px] bg-gray-900/90 backdrop-blur-3xl border border-gray-700/50 rounded-[2.5rem] shadow-[0_20px_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 bg-gradient-to-b from-gray-800/80 to-transparent border-b border-gray-800/50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl text-black">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-white font-black text-base tracking-tight">LifeFund Pro IA</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                        <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.2em]">En línea</p>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="bg-gray-800 p-2 hover:bg-gray-700 rounded-xl text-gray-400 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-black/10">
                            {messages.length === 0 && (
                                <div className="text-center py-20 space-y-6 max-w-[80%] mx-auto">
                                    <div className="w-20 h-20 bg-gray-800/50 rounded-[2rem] flex items-center justify-center mx-auto border border-gray-700/50">
                                        <Bot className="w-10 h-10 text-emerald-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-white text-lg font-black tracking-tight">¿En qué te ayudo hoy?</p>
                                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest leading-relaxed">Analizo tus gastos, creo huchas y fijo presupuestos.</p>
                                    </div>
                                </div>
                            )}
                            {messages.map((m, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[90%] rounded-[2rem] px-5 py-4 shadow-2xl ${m.role === 'user'
                                        ? 'bg-emerald-600 text-white rounded-tr-none'
                                        : 'bg-gray-800/80 text-gray-200 border border-gray-700/50 rounded-tl-none'
                                        }`}>
                                        {m.role === 'assistant' ? renderMessageContent(m.content) : <p className="text-sm font-medium">{m.content}</p>}
                                    </div>
                                </motion.div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-800/50 rounded-3xl rounded-tl-none px-6 py-4 flex gap-2">
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-100" />
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-200" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSendMessage} className="p-6 bg-gray-900/50 border-t border-gray-800/50 flex gap-3">
                            <input
                                type="text" value={input} onChange={e => setInput(e.target.value)}
                                placeholder="Tu asistente te escucha..."
                                className="flex-1 bg-gray-800/50 border border-gray-700/50 rounded-[1.5rem] px-5 py-3.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all placeholder:text-gray-600"
                            />
                            <button
                                type="submit" disabled={loading || !input.trim()}
                                className="p-3.5 bg-gradient-to-tr from-emerald-500 to-cyan-500 disabled:opacity-30 text-black rounded-2xl transition-all shadow-lg hover:scale-105 active:scale-95"
                            >
                                <Send className="w-6 h-6" />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-16 h-16 rounded-[2rem] shadow-2xl flex items-center justify-center border-4 z-20 transition-colors duration-300
                    ${isOpen ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gradient-to-tr from-emerald-500 to-cyan-500 border-white/10 text-black'}`}
            >
                {isOpen ? <X className="w-8 h-8" /> : <Sparkles className="w-8 h-8" />}
            </motion.button>
        </div>
    );
}
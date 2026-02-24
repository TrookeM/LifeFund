'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useToast } from './Toast';

export default function AIMatchmaker() {
    const { showToast } = useToast();
    const [suggestions, setSuggestions] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const getInspiration = async () => {
        setLoading(true);
        setSuggestions(null);
        try {
            const res = await fetch('/api/ai/matchmaker');
            const data = await res.json();
            if (data.suggestions) {
                setSuggestions(data.suggestions);
            } else {
                throw new Error();
            }
        } catch (error) {
            showToast("No se pudo conectar con el Matchmaker", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-gray-900 border border-purple-500/30 p-8 rounded-3xl shadow-[0_0_50px_rgba(168,85,247,0.15)] backdrop-blur-2xl relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full group-hover:bg-purple-500/20 transition-all duration-1000" />

            <div className="relative z-10 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                            <span className="text-3xl animate-pulse">✨</span>
                            AI Matchmaker
                        </h2>
                        <p className="text-purple-300/70 text-sm font-medium">¿Tienes salud financiera? ¡Date un capricho inteligente!</p>
                    </div>

                    <button
                        onClick={getInspiration}
                        disabled={loading}
                        className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-purple-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 overflow-hidden group/btn"
                    >
                        {loading && <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />}
                        <span className="relative group-hover/btn:translate-x-1 transition-transform">
                            {loading ? 'Consultando al Oráculo...' : 'Inspírame Hoy'}
                        </span>
                        {!loading && <svg className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.628.314a2 2 0 01-1.186.196l-3.074-.615a4 4 0 01-2.038-1.041l-2.146-2.146a4 4 0 00-5.656 0c-4.418 4.419-4.418 11.581 0 16a4 4 0 005.656 0l1.1-1.1" />
                        </svg>}
                    </button>
                </div>

                {suggestions ? (
                    <div className="bg-gray-900/60 border border-purple-500/20 rounded-2xl p-6 animate-in fade-in zoom-in-95 duration-500">
                        <div className="prose prose-invert prose-purple prose-sm max-w-none 
                            prose-headings:text-purple-400 prose-headings:font-black prose-headings:mb-4
                            prose-p:text-gray-200 prose-p:leading-relaxed
                            prose-strong:text-purple-300 prose-li:text-gray-300
                            prose-ul:bg-purple-950/20 prose-ul:p-4 prose-ul:rounded-xl prose-ul:border prose-ul:border-purple-500/10"
                        >
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {suggestions}
                            </ReactMarkdown>
                        </div>
                    </div>
                ) : !loading && (
                    <div className="py-12 flex flex-col items-center text-center space-y-4 border-2 border-dashed border-purple-500/10 rounded-2xl bg-purple-500/5">
                        <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-purple-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.364-6.364l-.707-.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <p className="text-purple-300/40 text-sm italic max-w-sm">Haz clic en el botón para que la IA escanee tu saldo y te proponga planes de vida irrechazables.</p>
                    </div>
                )}

                {loading && (
                    <div className="py-20 flex flex-col items-center justify-center space-y-6">
                        <div className="relative">
                            <div className="w-20 h-20 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl animate-bounce">🔮</span>
                            </div>
                        </div>
                        <p className="text-purple-400 font-bold animate-pulse tracking-widest text-xs uppercase">Analizando oportunidades...</p>
                    </div>
                )}
            </div>
        </div>
    );
}

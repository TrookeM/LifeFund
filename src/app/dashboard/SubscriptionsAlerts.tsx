// --- src/app/dashboard/SubscriptionsAlerts.tsx ---

'use client';

import { useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSearchParams } from 'next/navigation';
import { ShieldAlert, RefreshCw, Activity, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';

type SubscriptionsData = {
    totalMonthlyCost: number;
    subscriptions: Array<{ name: string; cost: number }>;
    aiRecommendations: string;
};

export default function SubscriptionsAlerts() {
    const [data, setData] = useState<SubscriptionsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const searchParams = useSearchParams();

    const fetchData = useCallback((analyze = false) => {
        setLoading(true); setError(false);
        const params = new URLSearchParams(searchParams.toString());
        if (analyze) params.append('analyze', 'true');
        fetch(`/api/insights/subscriptions?${params.toString()}`)
            .then(res => { if (!res.ok) throw new Error(); return res.json(); })
            .then(d => { setData(d); setLoading(false); })
            .catch(() => { setError(true); setLoading(false); });
    }, [searchParams]);

    useEffect(() => { fetchData(false); }, [fetchData]);

    if (loading) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gray-900/40 backdrop-blur-3xl border border-rose-500/20 p-8 rounded-[2rem] shadow-[0_0_50px_rgba(244,63,94,0.05)] h-full min-h-[400px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(244,63,94,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(244,63,94,0.03)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]" />
                <div className="flex flex-col items-center gap-6 text-center z-10">
                    <div className="relative flex items-center justify-center">
                        <Activity className="w-8 h-8 text-rose-500 absolute animate-pulse" />
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="w-20 h-20 border-2 border-dashed border-rose-500/40 rounded-full" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-white font-black text-xl tracking-tight">Escaneo Activo...</p>
                        <p className="text-rose-400 text-xs font-bold uppercase tracking-[0.2em] animate-pulse">Auditando fugas de capital</p>
                    </div>
                </div>
            </motion.div>
        );
    }

    if (error) {
        return (
            <div className="bg-gray-900/40 backdrop-blur-xl border border-rose-500/20 p-8 rounded-[2rem] h-full min-h-[300px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-6 text-center max-w-sm">
                    <div className="bg-rose-900/20 p-5 rounded-3xl border border-rose-500/20 text-rose-400">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-white font-black text-lg">Servidor IA Indispuesto</p>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest leading-relaxed">Ha habido un problema de conexión.</p>
                    </div>
                    <button onClick={() => fetchData(false)} className="px-6 py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-black text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" /> Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-gray-900/40 backdrop-blur-2xl border border-white/5 p-8 rounded-[2rem] shadow-2xl flex flex-col gap-8 relative overflow-hidden group">
            {/* Brillo de fondo sutil */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 blur-[80px] rounded-full group-hover:bg-rose-500/10 transition-colors duration-1000 z-0" />

            <div className="flex items-center gap-4 relative z-10">
                <div className="bg-rose-500/10 p-3 rounded-2xl border border-rose-500/20 shadow-inner">
                    <ShieldAlert className="w-6 h-6 text-rose-400" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-2xl font-black text-white tracking-tight">Auditoría IA</h2>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em]">Escudo Financiero</p>
                </div>
                <button onClick={() => fetchData(true)} className="ml-auto p-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-2xl transition-all border border-rose-500/20 flex items-center gap-2 group/btn text-xs font-black tracking-widest uppercase shadow-lg backdrop-blur-md">
                    <span className="hidden sm:inline">Ejecutar IA</span>
                    <RefreshCw className="w-4 h-4 group-hover/btn:rotate-180 transition-transform duration-500" />
                </button>
            </div>

            <div className="bg-black/30 rounded-[1.5rem] p-6 border border-white/5 overflow-auto custom-scrollbar max-h-[50vh] relative z-10 shadow-inner">
                <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-li:my-1 prose-ul:my-2 prose-strong:text-rose-400 prose-headings:text-white prose-headings:font-black">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {data?.aiRecommendations || "Suscripciones bajo control."}
                    </ReactMarkdown>
                </div>
            </div>

            {data?.subscriptions && data.subscriptions.length > 0 && (
                <div className="space-y-4 relative z-10">
                    <h3 className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Fugas Detectadas</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-52 overflow-y-auto pr-2 custom-scrollbar">
                        {data.subscriptions.map((sub, idx) => (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }} key={idx} className="flex justify-between items-center p-4 bg-gray-800/40 rounded-2xl border border-gray-700/50 hover:border-rose-500/30 transition-all group/item backdrop-blur-md">
                                <span className="text-gray-300 font-bold text-sm group-hover/item:text-white transition-colors truncate pr-4">{sub.name}</span>
                                <span className="text-rose-400 font-black text-sm shrink-0 bg-rose-500/10 px-3 py-1 rounded-lg border border-rose-500/20">{formatCurrency(sub.cost)}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
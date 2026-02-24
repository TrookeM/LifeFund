// --- src/app/dashboard/BudgetWidget.tsx ---

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, AlertTriangle, TrendingUp, CheckCircle2, HelpCircle } from 'lucide-react';
import { useToast } from './Toast';
import { formatCurrency } from '@/lib/utils';

type Budget = { id: string; category: string; limit: number; spent: number; projected: number; status: 'safe' | 'warning' | 'exceeded'; };

const CircularProgress = ({ spent, limit, status }: { spent: number; limit: number; status: string }) => {
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const percent = Math.min((spent / limit) * 100, 100);
    const offset = circumference - (percent / 100) * circumference;

    const colors = {
        safe: 'stroke-emerald-500',
        warning: 'stroke-amber-500',
        exceeded: 'stroke-rose-500'
    };

    return (
        <div className="relative flex items-center justify-center w-24 h-24">
            <svg className="transform -rotate-90 w-24 h-24">
                <circle cx="48" cy="48" r={radius} className="stroke-white/10 fill-none" strokeWidth="8" />
                <motion.circle
                    cx="48" cy="48" r={radius}
                    className={`${colors[status as keyof typeof colors]} fill-none drop-shadow-[0_0_8px_currentColor]`}
                    strokeWidth="8" strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
                <span className="text-xs font-black text-white">{percent.toFixed(0)}%</span>
            </div>
        </div>
    );
};

export default function BudgetWidget() {
    const { showToast } = useToast();
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form
    const [category, setCategory] = useState('Restaurantes');
    const [limit, setLimit] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchBudgets = async () => {
        try {
            const res = await fetch('/api/budgets');
            setBudgets(await res.json());
        } catch {
            showToast("Error al cargar presupuestos", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBudgets();
        // Escuchar cuando la IA crea un presupuesto para recargar
        const handleAiBudget = () => fetchBudgets();
        window.addEventListener('budget-created', handleAiBudget);
        return () => window.removeEventListener('budget-created', handleAiBudget);
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true);
        try {
            const res = await fetch('/api/budgets', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category, limit: Number(limit) })
            });
            if (res.ok) {
                showToast("Presupuesto fijado", "success");
                setShowForm(false); setLimit(''); fetchBudgets();
            } else throw new Error();
        } catch { showToast("Error al guardar", "error"); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="h-64 bg-white/5 rounded-[2.5rem] animate-pulse" />;

    return (
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />

            {/* --- CABECERA CON TOOLTIP --- */}
            <div className="flex justify-between items-center relative z-[50] mb-8">
                <div className="flex items-center gap-4 relative group/tooltip">
                    <div className="bg-blue-500/10 p-3 rounded-2xl border border-blue-500/20 shadow-inner">
                        <Target className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                            Presupuestos
                            <HelpCircle className="w-4 h-4 text-gray-500 cursor-help hover:text-white transition-colors" />
                        </h2>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em]">Control Inteligente de Gastos</p>
                    </div>

                    {/* Tooltip Explicativo (Flotante) */}
                    <div className="absolute left-0 top-full mt-2 w-72 p-5 bg-gray-900 border border-blue-500/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 z-[100] pointer-events-none">
                        <p className="text-xs text-gray-300 leading-relaxed">
                            <strong className="text-blue-400 font-black block mb-2">Tu Asesor Inteligente</strong>
                            Fija un límite de gasto mensual. Nuestra IA calcula tu ritmo de gasto diario ("Proyección") y te avisa en <span className="text-amber-400">Naranja</span> o <span className="text-rose-400">Rojo</span> si detecta que vas a superar el límite antes de que acabe el mes.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all border border-white/10 flex items-center gap-2 group"
                >
                    <Plus className={`w-4 h-4 transition-transform ${showForm ? 'rotate-45' : ''}`} />
                    <span className="hidden sm:inline text-xs font-black uppercase tracking-widest">Nuevo Límite</span>
                </button>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.form
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleSave} className="bg-black/40 p-6 rounded-3xl border border-white/5 mb-8 space-y-4"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Categoría a limitar</label>
                                <input value={category} onChange={e => setCategory(e.target.value)} required placeholder="Ej: Ocio, Restaurantes..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Límite Mensual (€)</label>
                                <input value={limit} onChange={e => setLimit(e.target.value)} required type="number" placeholder="Ej: 150" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm font-black" />
                            </div>
                        </div>
                        <button disabled={saving} type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] flex justify-center">
                            {saving ? 'Guardando...' : 'Fijar Presupuesto'}
                        </button>
                    </motion.form>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
                {budgets.map((budget) => (
                    <div key={budget.id} className="bg-black/20 border border-white/5 p-5 rounded-[2rem] flex items-center gap-6 hover:bg-white/5 transition-colors group">
                        <CircularProgress spent={budget.spent} limit={budget.limit} status={budget.status} />

                        <div className="flex-1 space-y-2">
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-black text-white">{budget.category}</h3>
                                {budget.status === 'safe' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                                {budget.status === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                                {budget.status === 'exceeded' && <TrendingUp className="w-5 h-5 text-rose-400" />}
                            </div>

                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-black text-white">{formatCurrency(budget.spent)}</span>
                                <span className="text-xs text-gray-500 font-bold">/ {formatCurrency(budget.limit)}</span>
                            </div>

                            <p className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md inline-block
                                ${budget.status === 'safe' ? 'bg-emerald-500/10 text-emerald-400' :
                                    budget.status === 'warning' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'}`}
                            >
                                {budget.status === 'safe' ? 'Ritmo Perfecto' :
                                    budget.status === 'warning' ? `Proyección: ${formatCurrency(budget.projected)}` : 'Límite Superado'}
                            </p>
                        </div>
                    </div>
                ))}

                {budgets.length === 0 && !showForm && (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-white/10 rounded-3xl bg-black/20">
                        <Target className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400 font-medium text-sm">No has fijado ningún presupuesto mensual.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
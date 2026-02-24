// --- src/app/dashboard/GoalsPanel.tsx ---

'use client';

import { useEffect, useState } from 'react';
import { useToast } from './Toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Pencil, Trash2, Zap, Euro, PiggyBank, HelpCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

type Goal = { id: string; name: string; category: string; targetAmount: number; currentAmount: number; deadline: string | null; roundUpEnabled: boolean; };

export default function GoalsPanel() {
    const { showToast } = useToast();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

    const [name, setName] = useState(''); const [category, setCategory] = useState('Ahorro');
    const [targetAmount, setTargetAmount] = useState(''); const [deadline, setDeadline] = useState('');
    const [roundUpEnabled, setRoundUpEnabled] = useState(false);
    const [addFundsId, setAddFundsId] = useState<string | null>(null); const [fundAmount, setFundAmount] = useState('');

    const fetchGoals = async () => {
        try {
            const res = await fetch('/api/goals');
            setGoals(await res.json());
        } catch { showToast("Error al cargar metas", "error"); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchGoals();
        const handleGlobalRefresh = () => fetchGoals();
        window.addEventListener('goal-created', handleGlobalRefresh);
        return () => window.removeEventListener('goal-created', handleGlobalRefresh);
    }, []);

    const resetForm = () => { setName(''); setCategory('Ahorro'); setTargetAmount(''); setDeadline(''); setRoundUpEnabled(false); setEditingGoal(null); setShowForm(false); };

    const handleSaveGoal = async (e: React.FormEvent) => {
        e.preventDefault(); setActionLoading('form');
        const method = editingGoal ? 'PATCH' : 'POST';
        const url = editingGoal ? `/api/goals/${editingGoal.id}` : '/api/goals';

        try {
            const res = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, category, targetAmount: Number(targetAmount), deadline: deadline || null, roundUpEnabled }),
            });
            if (res.ok) { showToast(editingGoal ? "Meta actualizada" : "Meta creada", "success"); resetForm(); fetchGoals(); }
            else throw new Error();
        } catch { showToast("Error al guardar la meta", "error"); }
        finally { setActionLoading(null); }
    };

    const handleDeleteGoal = async (id: string) => {
        if (!confirm("¿Seguro que quieres eliminar esta meta?")) return;
        setActionLoading(id);
        try {
            const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' });
            if (res.ok) { showToast("Meta eliminada", "success"); fetchGoals(); } else throw new Error();
        } catch { showToast("No se pudo eliminar", "error"); }
        finally { setActionLoading(null); }
    };

    const handleAddFunds = async (goal: Goal) => {
        if (!fundAmount || Number(fundAmount) <= 0) return;
        setActionLoading(`fund-${goal.id}`);
        try {
            const res = await fetch(`/api/goals/${goal.id}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentAmount: goal.currentAmount + Number(fundAmount) }),
            });
            if (res.ok) { showToast(`¡+${fundAmount}€ añadidos!`, "success"); setAddFundsId(null); setFundAmount(''); fetchGoals(); }
            else throw new Error();
        } catch { showToast("Error al añadir fondos", "error"); }
        finally { setActionLoading(null); }
    };

    const toggleRoundUp = async (goal: Goal) => {
        setActionLoading(`roundup-${goal.id}`);
        try {
            const res = await fetch(`/api/goals/${goal.id}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roundUpEnabled: !goal.roundUpEnabled }),
            });
            if (res.ok) { showToast(goal.roundUpEnabled ? "Redondeo desactivado" : "¡Redondeo activado!", "success"); fetchGoals(); }
            else throw new Error();
        } catch { showToast("Error al cambiar ajuste", "error"); }
        finally { setActionLoading(null); }
    };

    const startEditing = (goal: Goal) => {
        setEditingGoal(goal); setName(goal.name); setCategory(goal.category); setTargetAmount(goal.targetAmount.toString());
        setDeadline(goal.deadline ? goal.deadline.split('T')[0] : ''); setRoundUpEnabled(goal.roundUpEnabled); setShowForm(true);
    };

    if (loading) return <div className="h-64 animate-pulse bg-gray-900/40 rounded-3xl border border-white/5" />;

    return (
        <div className="bg-gray-900/40 backdrop-blur-3xl border border-white/5 p-8 rounded-[2.5rem] shadow-2xl space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

            {/* --- CABECERA CON TOOLTIP --- */}
            <div className="flex justify-between items-center relative z-[50]">
                <div className="flex items-center gap-4 relative group/tooltip">
                    <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 shadow-inner">
                        <Target className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
                            Objetivos de Vida
                            <HelpCircle className="w-4 h-4 text-gray-500 cursor-help hover:text-white transition-colors" />
                        </h2>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] pl-1">Planifica tu libertad financiera</p>
                    </div>

                    {/* Tooltip Explicativo (Flotante) */}
                    <div className="absolute left-0 top-full mt-2 w-80 p-5 bg-gray-900 border border-emerald-500/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 z-[100] pointer-events-none">
                        <div className="space-y-3">
                            <div>
                                <strong className="text-emerald-400 font-black flex items-center gap-2 mb-1">
                                    <PiggyBank className="w-4 h-4" /> Simulador de Micro-Ahorro
                                </strong>
                                <p className="text-xs text-gray-300 leading-relaxed">
                                    Actuamos como tu <strong>Coach Financiero</strong>. Al activar el rayo verde, simulamos el redondeo de tus compras reales (ej: de 2,30€ a 3,00€) y acumulamos esos 0,70€ en esta hucha virtual.
                                </p>
                            </div>
                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                                <p className="text-[11px] text-emerald-400/90 leading-relaxed font-medium">
                                    <span className="font-black text-emerald-400">Tu turno:</span> Nosotros llevamos la cuenta para que ahorrar sea un juego. Cuando alcances tu meta aquí, entra en la app de tu banco real y transfiere ese dinero a tu cuenta de ahorros. ¡Hazlo tuyo!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => showForm ? resetForm() : setShowForm(true)}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-[0_10px_20px_rgba(16,185,129,0.2)] active:scale-95 flex items-center gap-2 group"
                >
                    <Plus className={`w-4 h-4 transition-transform duration-300 ${showForm ? 'rotate-45' : ''}`} />
                    <span className="hidden sm:inline">{showForm ? 'Cerrar Panel' : 'Nueva Meta'}</span>
                </button>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.form
                        initial={{ opacity: 0, height: 0, scale: 0.95 }} animate={{ opacity: 1, height: 'auto', scale: 1 }} exit={{ opacity: 0, height: 0, scale: 0.95 }}
                        onSubmit={handleSaveGoal}
                        className="bg-black/40 p-8 rounded-[2rem] border border-white/10 space-y-6 relative z-10 backdrop-blur-md overflow-hidden"
                    >
                        <h3 className="text-xl font-black text-white">{editingGoal ? 'Editar Meta' : 'Configura tu nueva aventura'}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Nombre</label>
                                <input value={name} onChange={e => setName(e.target.value)} required placeholder="Ej: Viaje a Japón" className="w-full bg-gray-900/60 border border-gray-700/50 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors font-medium" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Categoría</label>
                                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-gray-900/60 border border-gray-700/50 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors font-medium">
                                    <option>Ahorro</option><option>Viaje</option><option>Vivienda</option><option>Vehículo</option><option>Inversión</option><option>Otro</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Objetivo (€)</label>
                                <input value={targetAmount} onChange={e => setTargetAmount(e.target.value)} required placeholder="5000" type="number" className="w-full bg-gray-900/60 border border-gray-700/50 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors font-black text-lg" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Fecha Límite</label>
                                <input value={deadline} onChange={e => setDeadline(e.target.value)} type="date" className="w-full bg-gray-900/60 border border-gray-700/50 rounded-2xl px-5 py-3 text-gray-400 focus:text-white focus:outline-none focus:border-emerald-500 transition-colors font-medium" />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 py-4 px-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl cursor-pointer" onClick={() => setRoundUpEnabled(!roundUpEnabled)}>
                            <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${roundUpEnabled ? 'bg-emerald-500' : 'bg-gray-700'}`}>
                                <motion.div animate={{ x: roundUpEnabled ? 24 : 0 }} className="w-4 h-4 bg-white rounded-full shadow-sm" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-white flex items-center gap-2"><PiggyBank className="w-4 h-4 text-emerald-400" /> Redondeo Automático</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Ahorra los céntimos de cada gasto</p>
                            </div>
                        </div>

                        <button disabled={actionLoading === 'form'} type="submit" className="w-full py-4 bg-white hover:bg-gray-200 disabled:bg-gray-700 text-black font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-3">
                            {actionLoading === 'form' ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : (editingGoal ? 'Guardar Cambios' : 'Crear Meta')}
                        </button>
                    </motion.form>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                {goals.map((goal) => {
                    const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                    return (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={goal.id} className="group bg-black/40 border border-white/5 p-7 rounded-[2rem] space-y-6 hover:border-emerald-500/30 transition-all duration-500 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{goal.category}</span>
                                        {goal.roundUpEnabled && <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md uppercase tracking-widest flex items-center gap-1"><Zap className="w-3 h-3" /> Activo</span>}
                                    </div>
                                    <h3 className="text-xl font-black text-white tracking-tight truncate pr-4">{goal.name}</h3>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => startEditing(goal)} className="p-2 hover:bg-gray-800 text-gray-500 hover:text-cyan-400 rounded-xl transition-colors"><Pencil className="w-4 h-4" /></button>
                                    <button onClick={() => handleDeleteGoal(goal.id)} className="p-2 hover:bg-rose-900/20 text-gray-500 hover:text-rose-400 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-3xl font-black text-white tracking-tighter">{formatCurrency(goal.currentAmount)}</span>
                                    <span className="text-xs text-gray-500 font-bold tracking-widest uppercase">/ {formatCurrency(goal.targetAmount)}</span>
                                </div>
                                <div className="h-4 w-full bg-gray-900 rounded-full overflow-hidden border border-white/5 p-0.5">
                                    <motion.div
                                        initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: "easeOut" }}
                                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <button onClick={() => toggleRoundUp(goal)} className={`flex items-center gap-2 group/btn ${actionLoading === `roundup-${goal.id}` ? 'opacity-50' : ''}`}>
                                    <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${goal.roundUpEnabled ? 'bg-emerald-500' : 'bg-gray-700'}`}>
                                        <motion.div animate={{ x: goal.roundUpEnabled ? 16 : 0 }} className="w-3 h-3 bg-white rounded-full" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover/btn:text-gray-300">Redondeo</span>
                                </button>

                                {addFundsId === goal.id ? (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
                                        <input autoFocus type="number" value={fundAmount} onChange={e => setFundAmount(e.target.value)} placeholder="€" className="w-20 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white font-black text-center focus:border-emerald-500 outline-none" onKeyDown={e => e.key === 'Enter' && handleAddFunds(goal)} />
                                        <button onClick={() => handleAddFunds(goal)} className="p-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg transition-colors"><Plus className="w-4 h-4" /></button>
                                        <button onClick={() => { setAddFundsId(null); setFundAmount(''); }} className="p-1.5 text-gray-500 hover:text-white"><Target className="w-4 h-4" /></button>
                                    </motion.div>
                                ) : (
                                    <button onClick={() => setAddFundsId(goal.id)} className="py-2 px-4 bg-white/5 hover:bg-white/10 text-[10px] uppercase font-black text-white flex items-center gap-2 transition-colors rounded-xl border border-white/10">
                                        <Euro className="w-3 h-3" /> Ingresar
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    );
                })}

                {goals.length === 0 && !showForm && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-white/10 rounded-[3rem] bg-black/20">
                        <PiggyBank className="w-16 h-16 text-emerald-500/50 mx-auto mb-4" />
                        <p className="text-white text-xl font-black tracking-tight mb-2">Sin Objetivos a la vista</p>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest max-w-xs mx-auto">Crea tu primera hucha y deja que el micro-ahorro haga la magia.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
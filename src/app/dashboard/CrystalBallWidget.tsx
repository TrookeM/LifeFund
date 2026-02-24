// --- src/app/dashboard/CrystalBallWidget.tsx ---

'use client';

import { motion } from 'framer-motion';
import { Sparkles, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

type CrystalBallProps = {
    currentBalance: number;
    monthlyExpenses: number;
    monthlyIncome: number;
};

export default function CrystalBallWidget({ currentBalance, monthlyExpenses, monthlyIncome }: CrystalBallProps) {
    // Matemáticas Predictivas
    const now = new Date();
    const today = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const remainingDays = daysInMonth - today;

    // Calculamos a qué ritmo gasta dinero al día
    const dailyBurnRate = monthlyExpenses / Math.max(1, today);

    // Proyectamos cuánto gastará en lo que queda de mes si sigue a este ritmo
    const projectedFutureExpenses = dailyBurnRate * remainingDays;

    // Calculamos el balance con el que terminará el mes
    const projectedEndBalance = currentBalance - projectedFutureExpenses;

    // Determinamos la salud financiera de la predicción
    const isHealthy = projectedEndBalance > (currentBalance * 0.2); // Sano si le sobra al menos un 20%
    const isDanger = projectedEndBalance < 0; // Peligro si acaba en números rojos

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
            className="relative bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-gray-900 border border-purple-500/30 p-8 rounded-[2.5rem] shadow-[0_0_50px_rgba(168,85,247,0.15)] backdrop-blur-2xl overflow-hidden group"
        >
            {/* Animación del Orbe Mágico de fondo */}
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className={`absolute -top-20 -right-20 w-64 h-64 blur-[100px] rounded-full pointer-events-none
                    ${isDanger ? 'bg-rose-500/40' : isHealthy ? 'bg-emerald-500/30' : 'bg-purple-500/30'}`}
            />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-500/20 rounded-xl border border-purple-500/30 shadow-inner">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                        </div>
                        <h2 className="text-xl font-black text-white tracking-tight">Bola de Cristal IA</h2>
                    </div>
                    <p className="text-purple-300/70 text-xs font-medium max-w-sm leading-relaxed">
                        Analizando tu ritmo de gasto actual de {formatCurrency(dailyBurnRate)} al día, esta es la predicción para el día {daysInMonth} de este mes.
                    </p>
                </div>

                <div className="text-left md:text-right">
                    <p className="text-[10px] text-purple-400 font-black uppercase tracking-[0.2em] mb-1">Terminarás el mes con</p>
                    <p className={`text-5xl font-black tracking-tighter ${isDanger ? 'text-rose-400' : 'text-white'}`}>
                        {formatCurrency(projectedEndBalance)}
                    </p>

                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/5">
                        {isDanger ? (
                            <><AlertCircle className="w-4 h-4 text-rose-500" /><span className="text-xs text-rose-400 font-bold">¡Peligro de números rojos!</span></>
                        ) : isHealthy ? (
                            <><TrendingUp className="w-4 h-4 text-emerald-500" /><span className="text-xs text-emerald-400 font-bold">Ahorro garantizado</span></>
                        ) : (
                            <><TrendingDown className="w-4 h-4 text-amber-500" /><span className="text-xs text-amber-400 font-bold">Vas un poco justo</span></>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
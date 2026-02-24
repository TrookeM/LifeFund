// --- src/app/dashboard/ExpenseChart.tsx ---

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';
import { BarChart3, PieChart } from 'lucide-react';

type ChartItem = { cat: string; val: number; };

const COLORS = [
    '#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444',
    '#ec4899', '#3b82f6', '#84cc16', '#f97316', '#14b8a6'
];

function PremiumDonutChart({ data, total }: { data: ChartItem[]; total: number }) {
    const [hovered, setHovered] = useState<number | null>(null);

    let cumulative = 0;
    const radius = 80; const cx = 110; const cy = 110; const innerRadius = 55;

    const slices = data.map((item, i) => {
        const pct = total > 0 ? item.val / total : 0;
        const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
        cumulative += pct;
        const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;

        const x1 = cx + radius * Math.cos(startAngle); const y1 = cy + radius * Math.sin(startAngle);
        const x2 = cx + radius * Math.cos(endAngle); const y2 = cy + radius * Math.sin(endAngle);
        const ix1 = cx + innerRadius * Math.cos(startAngle); const iy1 = cy + innerRadius * Math.sin(startAngle);
        const ix2 = cx + innerRadius * Math.cos(endAngle); const iy2 = cy + innerRadius * Math.sin(endAngle);

        const largeArc = pct > 0.5 ? 1 : 0;
        const d = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;

        return { d, color: COLORS[i % COLORS.length], item, pct, i };
    });

    const hoveredItem = hovered !== null ? data[hovered] : null;

    return (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col lg:flex-row items-center gap-10">
            {/* SVG Donut */}
            <div className="relative shrink-0 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                <svg width="220" height="220" viewBox="0 0 220 220">
                    {slices.map(({ d, color, i }) => (
                        <path
                            key={i} d={d} fill={color}
                            opacity={hovered === null || hovered === i ? 1 : 0.3}
                            className="cursor-pointer transition-all duration-300 ease-out"
                            style={{ transform: hovered === i ? `scale(1.05)` : 'scale(1)', transformOrigin: `${cx}px ${cy}px` }}
                            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
                        />
                    ))}
                    <text x={cx} y={cy - 10} textAnchor="middle" className="fill-gray-400 font-bold tracking-[0.2em] uppercase text-[10px]">
                        {hoveredItem ? hoveredItem.cat.slice(0, 12) : 'Total Gastos'}
                    </text>
                    <text x={cx} y={cy + 15} textAnchor="middle" className="fill-white font-black text-xl tracking-tight">
                        {hoveredItem ? formatCurrency(hoveredItem.val).replace(',00', '') : formatCurrency(total).replace(',00', '')}
                    </text>
                    {hoveredItem && (
                        <text x={cx} y={cy + 35} textAnchor="middle" className="fill-emerald-400 font-black text-[10px] tracking-widest">
                            {(slices[hovered!].pct * 100).toFixed(1)}%
                        </text>
                    )}
                </svg>
            </div>

            {/* Leyenda Premium */}
            <div className="flex-1 space-y-3 w-full">
                {data.map((item, i) => {
                    const pct = total > 0 ? ((item.val / total) * 100).toFixed(1) : '0';
                    return (
                        <div
                            key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
                            className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all duration-300 border border-transparent ${hovered === i ? 'bg-white/5 border-white/10 scale-[1.02]' : 'hover:bg-white/5'}`}
                        >
                            <div className={`shrink-0 w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]`} style={{ backgroundColor: COLORS[i % COLORS.length], color: COLORS[i % COLORS.length] }} />
                            <span className={`flex-1 text-xs font-bold uppercase tracking-widest transition-colors ${hovered === i ? 'text-white' : 'text-gray-400'}`}>
                                {item.cat}
                            </span>
                            <span className="text-xs font-black text-gray-500">{pct}%</span>
                            <span className={`text-sm font-black tracking-tight ${hovered === i ? 'text-white' : 'text-gray-300'}`}>
                                {formatCurrency(item.val)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}

function PremiumBarChart({ data, maxExpense }: { data: ChartItem[]; maxExpense: number }) {
    const [hovered, setHovered] = useState<number | null>(null);

    return (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            {data.map((item, idx) => (
                <div key={idx} className="relative group cursor-default" onMouseEnter={() => setHovered(idx)} onMouseLeave={() => setHovered(null)}>
                    <div className="flex justify-between items-end mb-2">
                        <span className={`text-xs font-black uppercase tracking-widest transition-colors duration-300 ${hovered === idx ? 'text-emerald-400' : 'text-gray-400'}`}>
                            {item.cat}
                        </span>
                        <span className="text-white font-black text-base tracking-tight tabular-nums">
                            {formatCurrency(item.val)}
                        </span>
                    </div>
                    <div className="h-5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 p-[3px] group-hover:border-emerald-500/30 transition-colors shadow-inner">
                        <motion.div
                            initial={{ width: 0 }} animate={{ width: `${maxExpense > 0 ? (item.val / maxExpense) * 100 : 0}%` }}
                            transition={{ duration: 1, ease: "easeOut", delay: idx * 0.1 }}
                            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] group-hover:brightness-125 transition-all"
                        />
                    </div>
                </div>
            ))}
        </motion.div>
    );
}

type ExpenseChartProps = { chartData: ChartItem[]; maxExpense: number; totalExpenses: number; };

export default function ExpenseChart({ chartData, maxExpense, totalExpenses }: ExpenseChartProps) {
    const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

    if (chartData.length === 0) {
        return (
            <div className="py-20 text-center border-2 border-dashed border-white/10 rounded-3xl bg-black/20">
                <BarChart3 className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Aún no hay gastos registrados.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 relative z-10 min-h-[400px]">
            <div className="flex items-center justify-between">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                    {chartData.length} categorías
                </p>
                <div className="flex items-center p-1 bg-black/40 border border-white/10 rounded-xl relative">
                    <button
                        onClick={() => setChartType('bar')}
                        className={`relative px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors flex items-center gap-2 z-10 ${chartType === 'bar' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        {chartType === 'bar' && <motion.div layoutId="chartToggle" className="absolute inset-0 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-[-1]" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                        <BarChart3 className={`w-3.5 h-3.5 ${chartType === 'bar' ? 'text-emerald-400' : ''}`} /> Barras
                    </button>
                    <button
                        onClick={() => setChartType('pie')}
                        className={`relative px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors flex items-center gap-2 z-10 ${chartType === 'pie' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        {chartType === 'pie' && <motion.div layoutId="chartToggle" className="absolute inset-0 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-[-1]" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                        <PieChart className={`w-3.5 h-3.5 ${chartType === 'pie' ? 'text-emerald-400' : ''}`} /> Circular
                    </button>
                </div>
            </div>

            {chartType === 'bar'
                ? <PremiumBarChart data={chartData.slice(0, 7)} maxExpense={maxExpense} />
                : <PremiumDonutChart data={chartData} total={totalExpenses} />
            }
        </div>
    );
}
// --- src/app/dashboard/transactions/TransactionsTable.tsx ---

'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { ArrowLeft, Search, TrendingDown, TrendingUp, Filter, Wallet, Building2, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type Transaction = {
    id: string; date: Date; description: string; amount: number; type: string; category: string | null; aiCategory: string | null;
    BankAccount: { name: string; mask: string | null; type: string; institutionName: string | null };
};

// 💎 COMPONENTE DROPDOWN PREMIUM CORREGIDO 💎
function CustomSelect({ value, onChange, options, placeholder, icon: Icon }: { value: string, onChange: (val: string) => void, options: string[], placeholder: string, icon: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative min-w-[200px] z-[70]" ref={ref}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-white/5 border ${isOpen ? 'border-cyan-500' : 'border-white/5'} hover:border-white/10 rounded-2xl py-3 pl-11 pr-4 text-white text-sm font-bold flex items-center justify-between transition-all`}
            >
                <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <span className="truncate">{value === 'ALL' ? placeholder : value}</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        // bg-[#1A1A1A] y z-[100] para que no se vea el fondo y flote sobre todo
                        className="absolute top-full left-0 w-full mt-2 bg-[#1A1A1A] border border-white/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,1)] max-h-64 overflow-y-auto z-[100] backdrop-blur-xl ring-1 ring-black"
                    >
                        <button onClick={() => { onChange('ALL'); setIsOpen(false); }} className={`w-full text-left px-4 py-3 text-sm font-bold transition-colors ${value === 'ALL' ? 'bg-cyan-500/10 text-cyan-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                            {placeholder}
                        </button>
                        {options.map(opt => (
                            <button key={opt} onClick={() => { onChange(opt); setIsOpen(false); }} className={`w-full text-left px-4 py-3 text-sm font-bold transition-colors ${value === opt ? 'bg-cyan-500/10 text-cyan-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                                {opt}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function TransactionsTable({ initialTransactions }: { initialTransactions: Transaction[] }) {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
    const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
    const [bankFilter, setBankFilter] = useState<string>('ALL');
    const [accountFilter, setAccountFilter] = useState<string>('ALL');

    const uniqueCategories = useMemo(() => Array.from(new Set(initialTransactions.map(t => t.aiCategory || t.category).filter(Boolean) as string[])).sort(), [initialTransactions]);
    const uniqueBanks = useMemo(() => Array.from(new Set(initialTransactions.map(t => t.BankAccount.institutionName || 'Efectivo / Manual').filter(Boolean) as string[])).sort(), [initialTransactions]);
    const uniqueAccounts = useMemo(() => Array.from(new Set(initialTransactions.map(t => t.BankAccount.name).filter(Boolean) as string[])).sort(), [initialTransactions]);

    const filteredTransactions = useMemo(() => {
        return initialTransactions.filter(t => {
            const finalCat = t.aiCategory || t.category || '';
            const bankName = t.BankAccount.institutionName || 'Efectivo / Manual';
            const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase()) || finalCat.toLowerCase().includes(search.toLowerCase());
            const matchesType = typeFilter === 'ALL' || t.type === typeFilter;
            const matchesCategory = categoryFilter === 'ALL' || finalCat === categoryFilter;
            const matchesBank = bankFilter === 'ALL' || bankName === bankFilter;
            const matchesAccount = accountFilter === 'ALL' || t.BankAccount.name === accountFilter;
            return matchesSearch && matchesType && matchesCategory && matchesBank && matchesAccount;
        });
    }, [initialTransactions, search, typeFilter, categoryFilter, bankFilter, accountFilter]);

    return (
        <div className="space-y-8 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard" className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-gray-400 hover:text-white border border-white/5 shadow-xl group">
                        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-white">Movimientos</h1>
                        <p className="text-gray-500 mt-1 font-medium text-sm tracking-wide">Tu historial financiero completo y detallado.</p>
                    </div>
                </div>
            </header>

            {/* Barra de Filtros: z-40 para estar bajo el dropdown pero sobre la tabla */}
            <div className="bg-black/40 backdrop-blur-2xl border border-white/10 p-4 rounded-[2rem] shadow-2xl flex flex-col gap-4 relative z-40">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por comercio, concepto o categoría..."
                            className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-gray-600 font-medium"
                        />
                    </div>
                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 w-full lg:w-auto">
                        <button onClick={() => setTypeFilter('ALL')} className={`flex-1 lg:flex-none px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${typeFilter === 'ALL' ? 'bg-gray-700 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>Todos</button>
                        <button onClick={() => setTypeFilter('INCOME')} className={`flex-1 lg:flex-none px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${typeFilter === 'INCOME' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 shadow-lg' : 'text-gray-500 hover:text-cyan-500/50'}`}>
                            <TrendingUp className="w-3 h-3" /> <span className="hidden sm:inline">Ingresos</span>
                        </button>
                        <button onClick={() => setTypeFilter('EXPENSE')} className={`flex-1 lg:flex-none px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${typeFilter === 'EXPENSE' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20 shadow-lg' : 'text-gray-500 hover:text-rose-500/50'}`}>
                            <TrendingDown className="w-3 h-3" /> <span className="hidden sm:inline">Gastos</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <CustomSelect value={categoryFilter} onChange={setCategoryFilter} options={uniqueCategories} placeholder="Todas las categorías" icon={Filter} />
                    <CustomSelect value={bankFilter} onChange={setBankFilter} options={uniqueBanks} placeholder="Todos los Bancos" icon={Building2} />
                    <CustomSelect value={accountFilter} onChange={setAccountFilter} options={uniqueAccounts} placeholder="Todas las Cuentas" icon={Wallet} />
                </div>
            </div>

            {/* Tabla: quitamos overflow-hidden y usamos overflow-x-visible para que el dropdown no se corte */}
            <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl relative z-10">
                <div className="overflow-x-auto lg:overflow-x-visible">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                                <th className="p-6 font-medium">Fecha</th>
                                <th className="p-6 font-medium w-1/3">Concepto</th>
                                <th className="p-6 font-medium">Categoría</th>
                                <th className="p-6 font-medium">Origen / Banco</th>
                                <th className="p-6 font-medium text-right">Importe</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            <AnimatePresence>
                                {filteredTransactions.map((tx) => {
                                    const finalCat = tx.aiCategory || tx.category || 'Sin clasificar';
                                    const bankName = tx.BankAccount.institutionName || 'Efectivo / Manual';
                                    return (
                                        <motion.tr
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            key={tx.id} className="hover:bg-white/[0.02] transition-colors group"
                                        >
                                            <td className="p-6 text-sm text-gray-400 font-mono whitespace-nowrap">
                                                {new Date(tx.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="p-6 text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                                                {tx.description}
                                            </td>
                                            <td className="p-6">
                                                <span className={`px-3 py-1.5 border rounded-lg text-xs font-bold whitespace-nowrap
                                                    ${tx.aiCategory ? 'bg-purple-500/10 border-purple-500/20 text-purple-300' : 'bg-white/5 border-white/10 text-gray-300'}
                                                `}>
                                                    {tx.aiCategory && <SparkleIcon className="inline w-3 h-3 mr-1 -mt-0.5" />}
                                                    {finalCat}
                                                </span>
                                            </td>
                                            <td className="p-6">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-300 font-bold">
                                                        <Building2 className="w-3.5 h-3.5 text-gray-500" /> {bankName}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                                        <Wallet className="w-3 h-3" /> {tx.BankAccount.name} {tx.BankAccount.mask && `(••${tx.BankAccount.mask})`}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={`p-6 text-right font-black text-lg whitespace-nowrap ${tx.type === 'INCOME' ? 'text-cyan-400' : 'text-white'}`}>
                                                {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </AnimatePresence>
                        </tbody>
                    </table>

                    {filteredTransactions.length === 0 && (
                        <div className="p-16 text-center text-gray-500">
                            <Search className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p className="font-bold text-xl text-gray-400 mb-2">No hay resultados</p>
                            <p className="text-sm">Prueba a cambiar o limpiar los filtros de búsqueda.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function SparkleIcon(props: any) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
            <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
        </svg>
    );
}
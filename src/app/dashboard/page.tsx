// --- src/app/dashboard/page.tsx ---

import prisma from '@/lib/prisma';
import SubscriptionsAlerts from './SubscriptionsAlerts';
import GoalsSection from './GoalsSection';
import { ToastContainer } from './Toast';
import AIMatchmaker from './AIMatchmaker';
import PlaidLinkButton from './PlaidLinkButton';
import SyncTransactionsButton from './SyncTransactionsButton';
import { TimeFilter } from './TimeFilter';
import { AccountFilter } from './AccountFilter';
import { DashboardTabs } from './DashboardTabs';
import { Suspense } from 'react';
import FloatingAIChat from './FloatingAIChat';
import ExpenseChart from './ExpenseChart';
import BudgetWidget from './BudgetWidget';
import CrystalBallWidget from './CrystalBallWidget';
import ScanReceiptButton from './ScanReceiptButton';

// Force dynamic rendering since we are reading from DB
export const dynamic = 'force-dynamic';

export default async function DashboardPage({
    searchParams: searchParamsPromise
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const searchParams = await searchParamsPromise;
    const period = typeof searchParams.period === 'string' ? searchParams.period : 'month';
    const institutionId = typeof searchParams.institution === 'string' ? searchParams.institution : null;
    const accountId = typeof searchParams.account === 'string' ? searchParams.account : null;
    const currentTab = typeof searchParams.tab === 'string' ? searchParams.tab : 'graph';

    const now = new Date();

    // Calculate start date based on period
    let startDate: Date | undefined = undefined;
    if (period === 'week') startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    else if (period === 'month') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (period === 'year') startDate = new Date(now.getFullYear(), 0, 1);

    // Account filtering logic
    let accountWhere: any = {};
    if (accountId) {
        accountWhere = { accountId: accountId };
    } else if (institutionId) {
        accountWhere = { BankAccount: { institutionId: institutionId } };
    }

    const globalWhere = {
        ...accountWhere,
        ...(startDate ? { date: { gte: startDate } } : {})
    };

    const [
        bankAccounts,
        typeAggregations,
        categoryGroups,
        manualBalanceAgg
    ] = await Promise.all([
        prisma.bankAccount.findMany({
            select: { id: true, name: true, mask: true, institutionName: true, institutionId: true, isManual: true, balance: true, type: true }
        }),
        prisma.transaction.groupBy({
            by: ['type'],
            where: globalWhere,
            _sum: { amount: true }
        }),
        prisma.transaction.groupBy({
            by: ['aiCategory'],
            where: { ...globalWhere, type: 'EXPENSE' },
            _sum: { amount: true },
            orderBy: { _sum: { amount: 'desc' } }
        }),
        prisma.transaction.groupBy({
            by: ['type'],
            where: { BankAccount: { isManual: true }, ...accountWhere },
            _sum: { amount: true }
        })
    ]);

    let income = 0;
    let expenses = 0;
    typeAggregations.forEach(agg => {
        if (agg.type === 'INCOME') income += (agg._sum.amount || 0);
        if (agg.type === 'EXPENSE') expenses += (agg._sum.amount || 0);
    });

    const chartData = categoryGroups.map(c => ({
        cat: c.aiCategory || 'Otros',
        val: c._sum.amount || 0
    }));
    const maxExpense = Math.max(...chartData.map(c => c.val), 1);

    let manualBalance = 0;
    manualBalanceAgg.forEach(agg => {
        if (agg.type === 'INCOME') manualBalance += (agg._sum.amount || 0);
        if (agg.type === 'EXPENSE') manualBalance -= (agg._sum.amount || 0);
    });

    const zeroBalanceAccounts = bankAccounts.filter(a => !a.isManual && (!a.balance || a.balance === 0)).map(a => a.id);
    const zeroBalancesMap = new Map();
    if (zeroBalanceAccounts.length > 0) {
        const zeroBals = await prisma.transaction.groupBy({
            by: ['accountId', 'type'],
            where: { accountId: { in: zeroBalanceAccounts } },
            _sum: { amount: true }
        });
        zeroBals.forEach(z => {
            const current = zeroBalancesMap.get(z.accountId) || 0;
            const amt = z._sum.amount || 0;
            zeroBalancesMap.set(z.accountId, current + (z.type === 'INCOME' ? amt : -amt));
        });
    }

    let linkedBalance = 0;
    bankAccounts.forEach(acc => {
        if (acc.isManual) return;
        if (accountId && acc.id !== accountId) return;
        if (institutionId && acc.institutionId !== institutionId) return;

        const isCredit = acc.type?.toLowerCase().includes('credit');
        if (isCredit && !accountId) return;

        let bal = acc.balance;
        if (isCredit) {
            bal = -Math.abs(acc.balance);
        } else if (!bal || bal === 0) {
            bal = zeroBalancesMap.get(acc.id) || 0;
        }
        linkedBalance += bal;
    });

    const balance = linkedBalance + manualBalance;
    const hasLinkedAccounts = bankAccounts.some(b => !b.isManual);

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white p-8 font-sans selection:bg-emerald-500/30">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header Options */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-white/5">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent leading-tight">
                            Salud Financiera
                        </h1>
                        <p className="text-gray-500 mt-1 font-medium text-sm tracking-wide">Panel de control LifeFund v1.0</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
                        <Suspense fallback={<div className="h-12 w-48 bg-white/5 rounded-2xl animate-pulse" />}>
                            <AccountFilter accounts={bankAccounts} />
                        </Suspense>
                        <Suspense fallback={<div className="h-12 w-48 bg-white/5 rounded-2xl animate-pulse" />}>
                            <TimeFilter />
                        </Suspense>

                        <div className="flex items-center gap-3">
                            {/* Botón hacia el Historial */}
                            <a
                                href="/dashboard/transactions"
                                className="px-5 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all border border-white/10 shadow-xl flex items-center gap-2 group"
                            >
                                <svg className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                </svg>
                                <span className="hidden sm:inline text-xs font-black uppercase tracking-widest">Historial</span>
                            </a>
                            <a
                                href="/dashboard/settings"
                                className="p-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-2xl transition-all border border-white/10 shadow-xl"
                                title="Configuración"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </a>
                            <a
                                href="/"
                                className="p-3 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-gray-500 rounded-2xl transition-all border border-white/10 shadow-xl group flex items-center gap-2"
                                title="Cerrar Sesión"
                            >
                                <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Salir</span>
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </header>

                {/* --- Cápsula de Control Superior (NUEVA MEJORA DE DISEÑO) --- */}
                <div className="flex justify-end pt-2">
                    <div className="flex flex-wrap items-center gap-3 bg-white/5 backdrop-blur-2xl p-2 rounded-[2.5rem] border border-white/10 shadow-2xl shadow-black/50">
                        {hasLinkedAccounts ? (
                            <>
                                {/* Indicador de Estado Elegante */}
                                <div className="flex px-5 py-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-full items-center gap-3 ml-2 group transition-all hover:bg-emerald-500/10">
                                    <div className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400/70 group-hover:text-emerald-400 transition-colors">
                                        Sistema En Línea
                                    </span>
                                </div>

                                {/* Separador Vertical */}
                                <div className="hidden sm:block w-[1px] h-6 bg-white/10 mx-1"></div>
                                <ScanReceiptButton />
                                <SyncTransactionsButton />
                            </>
                        ) : (
                            <div className="px-2">
                                <PlaidLinkButton />
                            </div>
                        )}
                    </div>
                </div>

                {/* Top KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="relative bg-gradient-to-br from-emerald-900/10 to-transparent border border-white/5 p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-md group hover:border-emerald-500/20 transition-all overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <svg className="w-16 h-16 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="text-emerald-500/50 text-[10px] font-black uppercase tracking-[0.25em]">Balance Total</h3>
                        <p className="text-5xl font-black mt-3 text-white tracking-tighter">
                            {balance.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </p>
                    </div>

                    <div className="relative bg-gradient-to-br from-rose-900/10 to-transparent border border-white/5 p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-md group hover:border-rose-500/20 transition-all overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <svg className="w-16 h-16 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
                        </div>
                        <h3 className="text-rose-500/50 text-[10px] font-black uppercase tracking-[0.25em]">Gastos Totales</h3>
                        <p className="text-5xl font-black mt-3 text-rose-400 tracking-tighter">
                            {expenses.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </p>
                    </div>

                    <div className="relative bg-gradient-to-br from-cyan-900/10 to-transparent border border-white/5 p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-md group hover:border-cyan-500/20 transition-all overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <svg className="w-16 h-16 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        </div>
                        <h3 className="text-cyan-500/50 text-[10px] font-black uppercase tracking-[0.25em]">Ingresos</h3>
                        <p className="text-5xl font-black mt-3 text-cyan-400 tracking-tighter">
                            {income.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </p>
                    </div>
                </div>

                {/* --- LA BOLA DE CRISTAL (Solo visible en vista mensual) --- */}
                {period === 'month' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <CrystalBallWidget
                            currentBalance={balance}
                            monthlyExpenses={expenses}
                            monthlyIncome={income}
                        />
                    </div>
                )}

                {/* AI Matchmaker Section */}
                <AIMatchmaker />

                {/* Dashboard Tabs and Analysis */}
                <div className="space-y-6">
                    <DashboardTabs />

                    {currentTab === 'graph' ? (
                        <section className="bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[3rem] shadow-2xl animate-in fade-in zoom-in-95 duration-500">
                            <div className="flex items-center gap-5 mb-12">
                                <div className="bg-emerald-500/10 p-4 rounded-3xl border border-emerald-500/20">
                                    <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                                    </svg>
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black text-white tracking-tight">Análisis de Gastos</h2>
                                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">Categorización asistida por IA</p>
                                </div>
                            </div>
                            <ExpenseChart
                                chartData={chartData}
                                maxExpense={maxExpense}
                                totalExpenses={expenses}
                            />
                        </section>
                    ) : (
                        <div className="animate-in slide-in-from-right-10 fade-in duration-500">
                            <Suspense fallback={<div className="h-96 w-full bg-white/5 rounded-[3rem] animate-pulse" />}>
                                <SubscriptionsAlerts />
                            </Suspense>
                        </div>
                    )}
                </div>

                {/* Goals Section */}
                <GoalsSection />

                {/* Budget Section */}
                <BudgetWidget />

                <div className="h-24" /> {/* Spacer */}
            </div>

            {/* Floating Chat */}
            <FloatingAIChat />

            <ToastContainer />
        </div>
    );
}
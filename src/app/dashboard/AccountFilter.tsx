'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition, useState, useRef, useEffect } from 'react';

type BankAccount = {
    id: string;
    name: string;
    mask: string | null;
    institutionName: string | null;
    institutionId: string | null;
    isManual: boolean;
};

// Helper for bank colors/logos
const getBankStyle = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('bbva')) return { color: 'bg-[#004481]', icon: '🏦', border: 'border-blue-500/30' };
    if (n.includes('santander')) return { color: 'bg-[#EC0000]', icon: '🔴', border: 'border-red-500/30' };
    if (n.includes('caixa')) return { color: 'bg-[#00AEEF]', icon: '⭐', border: 'border-cyan-500/30' };
    if (n.includes('revolut')) return { color: 'bg-white', icon: '💎', border: 'border-gray-200/30' };
    if (n.includes('n26')) return { color: 'bg-[#00A7A1]', icon: '🌿', border: 'border-teal-500/30' };
    if (n.includes('ing')) return { color: 'bg-[#FF6200]', icon: '🦁', border: 'border-orange-500/30' };
    return { color: 'bg-gray-700', icon: '💳', border: 'border-gray-500/30' };
};

export function AccountFilter({ accounts }: { accounts: BankAccount[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentAccountId = searchParams.get('account');
    const currentInstitutionId = searchParams.get('institution');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleFilter = (type: 'all' | 'institution' | 'account', id?: string) => {
        setIsOpen(false);
        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString());
            params.delete('account');
            params.delete('institution');

            if (type === 'institution' && id) {
                params.set('institution', id);
            } else if (type === 'account' && id) {
                params.set('account', id);
            }

            router.push(`/dashboard?${params.toString()}`);
        });
    };

    // Group accounts by institution
    const institutions = new Map<string, { id: string, name: string, accounts: BankAccount[] }>();
    const manualAccounts: BankAccount[] = [];

    accounts.forEach(acc => {
        if (acc.isManual) {
            manualAccounts.push(acc);
        } else if (acc.institutionId && acc.institutionName) {
            if (!institutions.has(acc.institutionId)) {
                institutions.set(acc.institutionId, { id: acc.institutionId, name: acc.institutionName, accounts: [] });
            }
            institutions.get(acc.institutionId)!.accounts.push(acc);
        }
    });

    // Active label logic
    let activeLabel = 'Todas las Entidades';
    let activeIcon = '🌍';
    if (currentAccountId) {
        const acc = accounts.find(a => a.id === currentAccountId);
        if (acc) {
            activeLabel = acc.name;
            activeIcon = getBankStyle(acc.institutionName || 'Manual').icon;
        }
    } else if (currentInstitutionId) {
        const inst = institutions.get(currentInstitutionId);
        if (inst) {
            activeLabel = inst.name;
            activeIcon = getBankStyle(inst.name).icon;
        }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isPending}
                className={`
                    flex items-center gap-3 px-5 py-2.5 bg-gray-900/50 border rounded-2xl transition-all duration-300 group
                    ${isOpen ? 'border-emerald-500/50 ring-4 ring-emerald-500/10' : 'border-gray-800 hover:border-gray-600'}
                `}
            >
                <span className="text-lg group-hover:scale-110 transition-transform">{activeIcon}</span>
                <span className="text-xs font-black uppercase tracking-widest text-gray-300 group-hover:text-white">
                    {activeLabel}
                </span>
                <svg className={`w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute left-0 mt-3 w-72 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[100] animate-in slide-in-from-top-4 duration-300">
                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
                        <button
                            onClick={() => handleFilter('all')}
                            className={`
                                w-full text-left px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 mb-2
                                ${!currentAccountId && !currentInstitutionId
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}
                            `}
                        >
                            <span className="text-lg">🌍</span>
                            Visión Global
                        </button>

                        <div className="space-y-1">
                            {Array.from(institutions.values()).map(inst => {
                                const style = getBankStyle(inst.name);
                                return (
                                    <div key={inst.id} className={`rounded-2xl border ${style.border} bg-black/20 overflow-hidden`}>
                                        <button
                                            onClick={() => handleFilter('institution', inst.id)}
                                            className={`
                                                w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 border-b ${style.border} transition-colors
                                                ${currentInstitutionId === inst.id ? 'text-emerald-400 bg-emerald-500/5' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/30'}
                                            `}
                                        >
                                            <span>{style.icon}</span>
                                            {inst.name}
                                        </button>
                                        <div className="p-1 space-y-0.5">
                                            {inst.accounts.map(acc => (
                                                <button
                                                    key={acc.id}
                                                    onClick={() => handleFilter('account', acc.id)}
                                                    className={`
                                                        w-full text-left px-4 py-2 rounded-xl text-sm transition-all flex items-center justify-between group/acc
                                                        ${currentAccountId === acc.id ? 'bg-emerald-500/10 text-white font-bold' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}
                                                    `}
                                                >
                                                    <span className="truncate pr-2">{acc.name}</span>
                                                    {acc.mask && (
                                                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md transition-colors ${currentAccountId === acc.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-600 group-hover/acc:text-gray-400'}`}>
                                                            *{acc.mask}
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            {manualAccounts.length > 0 && (
                                <div className="rounded-2xl border border-gray-800 bg-black/20 overflow-hidden">
                                    <div className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-3 border-b border-gray-800">
                                        <span>💰</span>
                                        Cuentas Manuales
                                    </div>
                                    <div className="p-1 space-y-0.5">
                                        {manualAccounts.map(acc => (
                                            <button
                                                key={acc.id}
                                                onClick={() => handleFilter('account', acc.id)}
                                                className={`
                                                    w-full text-left px-4 py-2 rounded-xl text-sm transition-all
                                                    ${currentAccountId === acc.id ? 'bg-emerald-500/10 text-white font-bold' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}
                                                `}
                                            >
                                                {acc.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

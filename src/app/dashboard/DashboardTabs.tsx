// --- src/app/dashboard/DashboardTabs.tsx ---

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Bot } from 'lucide-react';

export function DashboardTabs() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const currentTab = searchParams.get('tab') || 'graph';

    const handleTabChange = (tabId: string) => {
        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (tabId === 'graph') params.delete('tab');
            else params.set('tab', tabId);
            router.push(`/dashboard?${params.toString()}`, { scroll: false });
        });
    };

    const tabs = [
        { id: 'graph', label: 'Gráfico de Gastos', icon: BarChart3 },
        { id: 'audit', label: 'Auditoría IA', icon: Bot }
    ];

    return (
        <div className="flex items-center p-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-[1.25rem] w-full sm:w-fit mb-8 shadow-inner relative">
            {tabs.map(tab => {
                const isActive = currentTab === tab.id;
                const Icon = tab.icon;

                return (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        disabled={isPending}
                        className={`relative flex-1 sm:flex-none px-6 py-3 text-xs font-black rounded-xl transition-colors duration-300 uppercase tracking-widest flex items-center justify-center gap-2 z-10 
                            ${isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        {/* La píldora que se desliza mágicamente */}
                        {isActive && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-gray-800 border border-gray-700 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] z-[-1]"
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            />
                        )}
                        <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-gray-500'}`} />
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}
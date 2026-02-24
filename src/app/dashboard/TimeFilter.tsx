'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

const periods = [
    { id: 'week', label: 'Semanal' },
    { id: 'month', label: 'Mensual' },
    { id: 'year', label: 'Anual' },
    { id: 'all', label: 'Todo' }
];

export function TimeFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const currentPeriod = searchParams.get('period') || 'month';

    const handleFilter = (periodId: string) => {
        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (periodId === 'month') {
                params.delete('period'); // Default
            } else {
                params.set('period', periodId);
            }
            router.push(`/dashboard?${params.toString()}`);
        });
    };

    return (
        <div className="flex items-center p-1 bg-gray-900/50 border border-gray-800 rounded-2xl w-fit shadow-inner">
            {periods.map(period => (
                <button
                    key={period.id}
                    type="button"
                    onClick={() => handleFilter(period.id)}
                    disabled={isPending}
                    className={`
                        px-4 py-2 text-xs font-black rounded-xl transition-all duration-300 uppercase tracking-widest
                        ${currentPeriod === period.id
                            ? 'bg-gradient-to-tr from-emerald-500 to-cyan-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-105 z-10'
                            : 'text-gray-500 hover:text-white hover:bg-gray-800/50'}
                    `}
                >
                    {period.label}
                </button>
            ))}
        </div>
    );
}

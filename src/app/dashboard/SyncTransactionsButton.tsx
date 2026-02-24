// --- src/app/dashboard/SyncTransactionsButton.tsx ---

'use client';

import { useState } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { useToast } from './Toast';

export default function SyncTransactionsButton() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'idle' | 'syncing' | 'categorizing'>('idle');

    const handleSync = async () => {
        setLoading(true);
        setStep('syncing');

        try {
            // 1. Descargamos las transacciones nuevas de Plaid
            const syncRes = await fetch('/api/plaid/sync-transactions', { method: 'POST' });
            const syncData = await syncRes.json();

            if (!syncRes.ok) throw new Error(syncData.error || "Error al sincronizar");

            if (syncData.count > 0) {
                showToast(`¡${syncData.count} transacciones nuevas! Clasificando con IA...`, "info");

                // 2. Automáticamente llamamos al categorizador de IA
                setStep('categorizing');
                const aiRes = await fetch('/api/run-ai-categorization');

                if (aiRes.status === 429) {
                    showToast("Límite de IA agotado. Se clasificarán más tarde.", "error");
                } else if (!aiRes.ok) {
                    showToast("Gastos guardados, pero falló la IA.", "error");
                } else {
                    showToast("¡Sincronización y Auditoría IA completadas!", "success");
                }
            } else {
                // Si Plaid dice que no hay gastos nuevos, no gastamos peticiones de IA
                showToast("Estás al día. No hay transacciones nuevas.", "success");
            }

            // Recargamos la página para ver los gráficos actualizados
            setTimeout(() => window.location.reload(), 1500);

        } catch (error) {
            console.error(error);
            showToast("Error de conexión con el banco", "error");
        } finally {
            setLoading(false);
            setStep('idle');
        }
    };

    return (
        <button
            onClick={handleSync}
            disabled={loading}
            className={`px-5 py-2.5 rounded-2xl transition-all border shadow-lg flex items-center gap-2 group active:scale-95 disabled:opacity-80 backdrop-blur-md
                ${step === 'categorizing'
                    ? 'bg-purple-900/40 border-purple-500/30 text-purple-300'
                    : 'bg-gray-900/80 hover:bg-gray-800 border-cyan-500/20 text-cyan-400'}`}
        >
            {step === 'categorizing' ? (
                <Sparkles className="w-4 h-4 animate-pulse text-purple-400" />
            ) : (
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            )}

            <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                {step === 'idle' && 'Sincronizar Banco'}
                {step === 'syncing' && 'Descargando...'}
                {step === 'categorizing' && 'Magia IA...'}
            </span>
        </button>
    );
}
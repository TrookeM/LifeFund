// --- src/app/dashboard/settings/DisconnectBankButton.tsx ---

'use client';

import { useState } from 'react';
import { useToast } from '../Toast';
import { Unplug, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function DisconnectBankButton({
    institutionName, accountId, accountName
}: {
    institutionName: string; accountId?: string; accountName?: string;
}) {
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const displayName = accountName || institutionName;

    const handleDisconnect = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/plaid/disconnect', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ institutionName, accountId })
            });

            if (res.ok) {
                showToast(`${displayName} desconectada.`, 'success');
                window.location.reload();
            } else throw new Error();
        } catch (e) {
            showToast('Error al intentar desconectar.', 'error');
            setShowConfirm(false);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="relative flex items-center justify-end mt-4 sm:mt-0 min-w-[160px]">
            <AnimatePresence mode="wait">
                {showConfirm ? (
                    <motion.div
                        key="confirm"
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                        className="flex items-center gap-2"
                    >
                        <button
                            type="button" onClick={() => setShowConfirm(false)} disabled={isLoading}
                            className="p-2 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-xl transition-all disabled:opacity-50"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <button
                            type="button" onClick={handleDisconnect} disabled={isLoading}
                            className="px-4 py-2 text-xs font-black text-white uppercase tracking-widest bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 rounded-xl transition-all shadow-[0_0_15px_rgba(225,29,72,0.3)] disabled:opacity-50 flex items-center gap-2"
                        >
                            {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                            {isLoading ? 'Borrando...' : 'Confirmar'}
                        </button>
                    </motion.div>
                ) : (
                    <motion.button
                        key="disconnect"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        type="button" onClick={() => setShowConfirm(true)}
                        className="px-4 py-2 text-xs font-black uppercase tracking-widest text-rose-400 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 rounded-xl transition-all flex items-center gap-2 group"
                    >
                        <Unplug className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                        Desvincular
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}
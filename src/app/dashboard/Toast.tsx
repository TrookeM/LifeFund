'use client';

import { useState, useEffect } from 'react';

export type ToastMessage = {
    id: number;
    text: string;
    type: 'success' | 'error' | 'info';
};

let toastCount = 0;
let setGlobalToasts: React.Dispatch<React.SetStateAction<ToastMessage[]>>;

export function useToast() {
    const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
        const id = ++toastCount;
        setGlobalToasts(prev => [...prev, { id, text, type }]);
        setTimeout(() => {
            setGlobalToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    return { showToast };
}

export function ToastContainer() {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    useEffect(() => {
        setGlobalToasts = setToasts;
    }, []);

    return (
        <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`
                        px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 animate-in slide-in-from-right-full duration-300
                        ${toast.type === 'success' ? 'bg-emerald-900/80 border-emerald-500/50 text-emerald-100' : ''}
                        ${toast.type === 'error' ? 'bg-rose-900/80 border-rose-500/50 text-rose-100' : ''}
                        ${toast.type === 'info' ? 'bg-cyan-900/80 border-cyan-500/50 text-cyan-100' : ''}
                    `}
                >
                    {toast.type === 'success' && (
                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                    {toast.type === 'error' && (
                        <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    )}
                    {toast.text}
                </div>
            ))}
        </div>
    );
}

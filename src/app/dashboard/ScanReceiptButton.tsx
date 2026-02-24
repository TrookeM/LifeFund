// --- src/app/dashboard/ScanReceiptButton.tsx ---

'use client';

import { useState, useRef } from 'react';
import { Camera, ScanLine, CheckCircle2 } from 'lucide-react';
import { useToast } from './Toast';

export default function ScanReceiptButton() {
    const { showToast } = useToast();
    const [status, setStatus] = useState<'idle' | 'scanning' | 'success'>('idle');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setStatus('scanning');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/ai/scan-receipt', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            setStatus('success');
            showToast(`¡Ticket de ${data.parsed.merchant} (${data.parsed.amount}€) guardado!`, "success");

            // Recargar la página después de un segundo para ver el gasto en las gráficas
            setTimeout(() => {
                window.location.reload();
            }, 1500);

        } catch (error: any) {
            console.error(error);
            showToast("La IA no pudo leer el ticket de forma clara.", "error");
            setStatus('idle');
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <>
            <input
                type="file"
                accept="image/*"
                capture="environment" // Si está en móvil, abre la cámara trasera directamente
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
            />

            <button
                onClick={() => status === 'idle' && fileInputRef.current?.click()}
                disabled={status !== 'idle'}
                className={`relative px-4 py-2.5 rounded-2xl transition-all border shadow-lg flex items-center gap-2 group disabled:opacity-90 backdrop-blur-md overflow-hidden
                    ${status === 'scanning' ? 'bg-indigo-900/40 border-indigo-500/50 text-indigo-300 w-36 justify-center' :
                        status === 'success' ? 'bg-emerald-900/40 border-emerald-500/50 text-emerald-400 w-36 justify-center' :
                            'bg-white/5 hover:bg-white/10 border-white/10 text-white'}`}
            >
                {/* Animación del láser escaneando */}
                {status === 'scanning' && (
                    <div className="absolute inset-0 w-full h-full bg-indigo-500/20 animate-pulse">
                        <div className="w-full h-[2px] bg-indigo-400 shadow-[0_0_10px_#818cf8] animate-[scan_1.5s_ease-in-out_infinite]" />
                    </div>
                )}

                {status === 'idle' && <Camera className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                {status === 'scanning' && <ScanLine className="w-4 h-4 animate-pulse relative z-10" />}
                {status === 'success' && <CheckCircle2 className="w-4 h-4 relative z-10" />}

                <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap relative z-10">
                    {status === 'idle' && 'Escanear Ticket'}
                    {status === 'scanning' && 'Leyendo...'}
                    {status === 'success' && '¡Guardado!'}
                </span>
            </button>

            {/* Añadimos keyframes para el láser en CSS inline por comodidad */}
            <style jsx>{`
                @keyframes scan {
                    0% { transform: translateY(0); }
                    50% { transform: translateY(36px); }
                    100% { transform: translateY(0); }
                }
            `}</style>
        </>
    );
}
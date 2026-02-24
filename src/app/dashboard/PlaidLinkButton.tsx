'use client';

import { useState, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { useToast } from './Toast';

export default function PlaidLinkButton() {
    const { showToast } = useToast();
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const generateToken = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/plaid/create-link-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: 'demo_user' })
            });
            const data = await response.json();
            if (data.link_token) {
                setToken(data.link_token);
            } else {
                throw new Error('No link_token received');
            }
        } catch (error) {
            console.error(error);
            showToast("Error al inicializar la conexión bancaria", "error");
        } finally {
            setLoading(false);
        }
    };

    const onSuccess = useCallback(async (public_token: string, metadata: any) => {
        try {
            showToast("Buscando cuentas... esto puede tardar unos segundos", "info");

            const response = await fetch('/api/plaid/exchange-public-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    publicToken: public_token,
                    institutionId: metadata.institution.institution_id,
                    institutionName: metadata.institution.name
                }),
            });

            if (response.ok) {
                showToast(`¡Conexión exitosa con ${metadata.institution.name}!`, "success");
                // Refresh dashboard or data here
                window.location.reload();
            } else {
                showToast("Error al sincronizar cuentas bancarias", "error");
            }
        } catch (error) {
            console.error(error);
            showToast("Error en el servidor al sincronizar la cuenta", "error");
        }
    }, [showToast]);

    const { open, ready } = usePlaidLink({
        token,
        onSuccess,
    });

    if (!token) {
        return (
            <button
                onClick={generateToken}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
                {loading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Conectar Banco
            </button>
        );
    }

    return (
        <button
            onClick={() => open()}
            disabled={!ready}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
            Proceder con Plaid
        </button>
    );
}

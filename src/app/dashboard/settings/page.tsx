// --- src/app/dashboard/settings/page.tsx ---

'use client';

import { useState, useEffect } from 'react';
import { useToast } from '../Toast';
import { DisconnectBankButton } from './DisconnectBankButton';
import PlaidLinkButton from '../PlaidLinkButton';
import { motion } from 'framer-motion';
import { User, Settings, CreditCard, ArrowLeft, Bell, Globe, Download, Save, ShieldCheck, Database } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [name, setName] = useState(''); const [email, setEmail] = useState('');
    const [currency, setCurrency] = useState('EUR'); const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
    const [notifications, setNotifications] = useState(true);
    const [connectedBanks, setConnectedBanks] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/user/settings')
            .then(res => res.json())
            .then(data => {
                if (data.id) {
                    setName(data.name || ''); setEmail(data.email || '');
                    setCurrency(data.preferredCurrency || 'EUR'); setDateFormat(data.dateFormat || 'DD/MM/YYYY');
                    setNotifications(data.notificationsEnabled); setConnectedBanks(data.connectedBanks || []);
                }
                setLoading(false);
            })
            .catch(() => { showToast("Error al cargar configuración", "error"); setLoading(false); });
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true);
        try {
            const res = await fetch('/api/user/settings', {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, preferredCurrency: currency, dateFormat, notificationsEnabled: notifications }),
            });
            if (res.ok) showToast("Configuración guardada correctamente", "success");
            else throw new Error();
        } catch { showToast("No se pudo guardar la configuración", "error"); }
        finally { setSaving(false); }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white p-6 md:p-12 font-sans selection:bg-emerald-500/30 relative overflow-hidden">
            {/* Luces de fondo estilo layout */}
            <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[40vw] h-[40vw] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />

            <div className="max-w-5xl mx-auto space-y-10 relative z-10">
                {/* Header */}
                <header className="flex items-center gap-6 pb-8 border-b border-white/5">
                    <Link href="/dashboard" className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-gray-400 hover:text-white border border-white/5 shadow-xl group">
                        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-white">Centro de Control</h1>
                        <p className="text-gray-500 mt-1 font-medium text-sm tracking-wide">Gestiona tus preferencias, bancos y privacidad.</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Menú Lateral */}
                    <div className="lg:col-span-4 space-y-3">
                        <button className="w-full text-left px-5 py-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl font-bold flex items-center gap-4 transition-all shadow-[0_0_20px_rgba(16,185,129,0.05)]">
                            <Settings className="w-5 h-5" /> Perfil y Preferencias
                        </button>
                        <button disabled className="w-full text-left px-5 py-4 bg-white/5 text-gray-500 rounded-2xl font-bold flex items-center gap-4 border border-transparent opacity-60 cursor-not-allowed">
                            <CreditCard className="w-5 h-5" /> Suscripción Pro <span className="ml-auto text-[9px] bg-gray-800 px-2 py-1 rounded-md uppercase tracking-widest">Pronto</span>
                        </button>
                        <button disabled className="w-full text-left px-5 py-4 bg-white/5 text-gray-500 rounded-2xl font-bold flex items-center gap-4 border border-transparent opacity-60 cursor-not-allowed">
                            <ShieldCheck className="w-5 h-5" /> Seguridad
                        </button>
                    </div>

                    {/* Contenido Principal */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-8">
                        <form onSubmit={handleSave} className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-8 md:p-10 shadow-2xl space-y-10">

                            {/* Info Personal */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20"><User className="w-5 h-5 text-emerald-400" /></div>
                                    <h3 className="text-xl font-black text-white tracking-tight">Identidad</h3>
                                </div>
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Nombre Público</label>
                                        <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-emerald-500 transition-all font-medium" placeholder="Tu nombre" />
                                    </div>
                                    <div className="space-y-2 opacity-60">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Correo Electrónico (Solo Lectura)</label>
                                        <input value={email} readOnly disabled className="w-full bg-black/20 border border-white/5 rounded-2xl px-5 py-4 text-gray-400 cursor-not-allowed font-medium" />
                                    </div>
                                </div>
                            </section>

                            <hr className="border-white/5" />

                            {/* Preferencias */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20"><Globe className="w-5 h-5 text-cyan-400" /></div>
                                    <h3 className="text-xl font-black text-white tracking-tight">Configuración General</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Moneda Base</label>
                                        <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-cyan-500 transition-all font-medium appearance-none">
                                            <option value="EUR">Euro (€)</option><option value="USD">Dólar ($)</option><option value="GBP">Libra (£)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Formato de Fecha</label>
                                        <select value={dateFormat} onChange={e => setDateFormat(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-cyan-500 transition-all font-medium appearance-none">
                                            <option value="DD/MM/YYYY">DD/MM/YYYY</option><option value="MM/DD/YYYY">MM/DD/YYYY</option><option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                        </select>
                                    </div>
                                </div>
                            </section>

                            <hr className="border-white/5" />

                            {/* Bancos */}
                            <section className="space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20"><Database className="w-5 h-5 text-purple-400" /></div>
                                        <h3 className="text-xl font-black text-white tracking-tight">Open Banking</h3>
                                    </div>
                                    <PlaidLinkButton />
                                </div>

                                {connectedBanks.length > 0 ? (
                                    <div className="space-y-4">
                                        {connectedBanks.map((bank, i) => (
                                            <div key={i} className="bg-black/40 rounded-[2rem] border border-white/5 overflow-hidden group hover:border-purple-500/30 transition-colors">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white/5 border-b border-white/5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-xl shadow-inner border border-purple-500/20">🏦</div>
                                                        <div>
                                                            <p className="text-base font-black text-white tracking-tight">{bank.name}</p>
                                                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Sincronizado</p>
                                                        </div>
                                                    </div>
                                                    <DisconnectBankButton institutionName={bank.name} />
                                                </div>
                                                <div className="p-3">
                                                    {bank.accounts.map((acc: any) => (
                                                        <div key={acc.id} className="flex items-center justify-between p-4 bg-transparent hover:bg-white/5 rounded-2xl transition-colors">
                                                            <div className="flex items-center gap-4">
                                                                <div className="text-lg opacity-60">{acc.type === 'depository' ? '💵' : '💳'}</div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-gray-200">{acc.name}</p>
                                                                    <p className="text-xs text-gray-500 font-mono mt-0.5">•••• {acc.mask || '****'}</p>
                                                                </div>
                                                            </div>
                                                            <DisconnectBankButton institutionName={bank.name} accountId={acc.id} accountName={acc.name} />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 bg-black/40 rounded-[2rem] border border-dashed border-white/10 text-center">
                                        <Database className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                                        <p className="text-gray-400 font-medium">No hay cuentas bancarias vinculadas.</p>
                                    </div>
                                )}
                            </section>

                            <hr className="border-white/5" />

                            {/* Notificaciones y Datos */}
                            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-black/40 border border-white/5 rounded-3xl p-6 flex flex-col justify-between hover:border-white/10 transition-colors">
                                    <div className="space-y-4 mb-6">
                                        <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center border border-rose-500/20"><Bell className="w-5 h-5 text-rose-400" /></div>
                                        <div>
                                            <p className="text-base font-black text-white tracking-tight">Asistente IA</p>
                                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">Permitir que la IA analice mis datos y sugiera ahorros.</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setNotifications(!notifications)} className={`w-14 h-7 rounded-full transition-colors relative flex items-center px-1 ${notifications ? 'bg-emerald-500' : 'bg-gray-700'}`}>
                                        <motion.div animate={{ x: notifications ? 28 : 0 }} className="w-5 h-5 bg-white rounded-full shadow-sm" />
                                    </button>
                                </div>

                                <div className="bg-black/40 border border-white/5 rounded-3xl p-6 flex flex-col justify-between hover:border-white/10 transition-colors">
                                    <div className="space-y-4 mb-6">
                                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20"><Download className="w-5 h-5 text-blue-400" /></div>
                                        <div>
                                            <p className="text-base font-black text-white tracking-tight">Tus Datos</p>
                                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">Exporta un archivo CSV con todo tu historial financiero.</p>
                                        </div>
                                    </div>
                                    <a href="/api/user/export" className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2">
                                        Descargar CSV
                                    </a>
                                </div>
                            </section>

                            <div className="pt-6">
                                <button type="submit" disabled={saving} className="w-full py-5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-black uppercase tracking-[0.2em] text-sm rounded-2xl transition-all shadow-[0_10px_30px_rgba(16,185,129,0.3)] active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50">
                                    {saving ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
                                    {saving ? "Guardando..." : "Guardar Preferencias"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
// --- src/app/page.tsx ---

'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Bot, TrendingUp, ShieldCheck, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col relative z-10 selection:bg-emerald-500/30">
      {/* Navbar Minimalista */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-4 h-4 text-black" />
          </div>
          <span className="text-xl font-black tracking-tight text-white">LifeFund</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all backdrop-blur-md"
          >
            Iniciar Sesión
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center mt-[-4rem]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            LifeFund v1.0 Ya Disponible
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-white leading-[1.1]">
            Tu libertad financiera, <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x">
              impulsada por IA.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed">
            Conecta tus bancos, deja que la Inteligencia Artificial audite tus gastos y alcanza tus metas de vida con nuestro sistema de micro-ahorro automático.
          </p>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="pt-4"
          >
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black text-sm font-black uppercase tracking-widest rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-all group"
            >
              Entrar al Dashboard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full mt-24"
        >
          {/* Card 1 */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] text-left hover:bg-white/10 transition-colors group">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Bot className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">Auditoría IA</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Nuestra IA analiza tus suscripciones y encuentra fugas de capital para que ahorres cientos de euros al año sin esfuerzo.</p>
          </div>

          {/* Card 2 */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] text-left hover:bg-white/10 transition-colors group">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">Micro-Ahorro</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Redondeamos cada gasto que haces al euro más cercano y lo enviamos automáticamente a tu hucha de metas.</p>
          </div>

          {/* Card 3 */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] text-left hover:bg-white/10 transition-colors group">
            <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">Open Banking</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Conéctate con tu banco de forma 100% segura mediante Plaid. Visión global de todas tus finanzas en un solo lugar.</p>
          </div>
        </motion.div>
      </main>

      <footer className="w-full text-center py-8 text-gray-600 text-xs font-bold uppercase tracking-widest mt-12 border-t border-white/5">
        <p>© {new Date().getFullYear()} LifeFund. Diseñado para el futuro.</p>
      </footer>
    </div>
  );
}
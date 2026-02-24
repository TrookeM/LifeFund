// --- src/app/dashboard/transactions/page.tsx ---

import prisma from '@/lib/prisma';
import TransactionsTable from './TransactionsTable';

export const dynamic = 'force-dynamic';

export default async function TransactionsPage() {
    const transactions = await prisma.transaction.findMany({
        orderBy: { date: 'desc' },
        take: 500,
        include: {
            BankAccount: {
                // AQUÍ AÑADIMOS institutionName PARA EL FILTRO DE BANCOS
                select: { name: true, mask: true, type: true, institutionName: true }
            }
        }
    });

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white p-6 md:p-12 font-sans selection:bg-cyan-500/30 relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[40vw] h-[40vw] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <TransactionsTable initialTransactions={transactions as any} />
            </div>
        </div>
    );
}
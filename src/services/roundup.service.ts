// --- src/services/roundup.service.ts ---

import prisma from '@/lib/prisma';

export class RoundUpService {
    /**
     * Calcula los céntimos a redondear (ej: 14.30 -> 0.70)
     */
    static calculateRoundUp(amount: number): number {
        if (amount <= 0) return 0;
        const ceil = Math.ceil(amount);
        const diff = ceil - amount;
        return parseFloat(diff.toFixed(2));
    }

    /**
     * Procesa los gastos y distribuye el ahorro entre TODAS las metas activas
     */
    static async processTransactionsForRoundUp(transactions: any[]) {
        const expenses = transactions.filter(t => t.type === 'EXPENSE' && t.amount > 0);
        if (expenses.length === 0) return 0;

        // Buscamos TODAS las metas con el redondeo activado
        const activeGoals = await prisma.goal.findMany({
            where: { roundUpEnabled: true }
        });

        if (activeGoals.length === 0) return 0;

        let totalRoundUp = 0;
        expenses.forEach(t => {
            totalRoundUp += this.calculateRoundUp(t.amount);
        });

        if (totalRoundUp > 0) {
            // Dividimos los céntimos a partes iguales entre las huchas activas
            const splitAmount = parseFloat((totalRoundUp / activeGoals.length).toFixed(2));

            // Actualizamos todas las metas en paralelo (¡Mucho más rápido!)
            await Promise.all(
                activeGoals.map(goal =>
                    prisma.goal.update({
                        where: { id: goal.id },
                        data: {
                            currentAmount: { increment: splitAmount }
                        }
                    })
                )
            );
        }

        return totalRoundUp;
    }
}
// --- src/app/api/ai/chat/route.ts ---

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AIService } from '@/services/ai.service';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { message, history } = body;

        // 1. Obtener Cuentas
        const bankAccounts = await prisma.bankAccount.findMany();
        let realBalance = 0;
        for (const acc of bankAccounts) {
            if (acc.isManual) continue;
            const isCredit = acc.type?.toLowerCase().includes('credit');
            if (isCredit) realBalance -= Math.abs(acc.balance);
            else realBalance += acc.balance;
        }

        const manualTxs = await prisma.transaction.groupBy({
            by: ['type'],
            where: { BankAccount: { isManual: true } },
            _sum: { amount: true }
        });
        manualTxs.forEach(agg => {
            if (agg.type === 'INCOME') realBalance += (agg._sum.amount || 0);
            if (agg.type === 'EXPENSE') realBalance -= (agg._sum.amount || 0);
        });

        // 2. Mes actual
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyAgg = await prisma.transaction.groupBy({
            by: ['type'],
            where: { date: { gte: firstDayOfMonth } },
            _sum: { amount: true }
        });

        let monthlyIncome = 0; let monthlyExpenses = 0;
        monthlyAgg.forEach(agg => {
            if (agg.type === 'INCOME') monthlyIncome += (agg._sum.amount || 0);
            if (agg.type === 'EXPENSE') monthlyExpenses += (agg._sum.amount || 0);
        });

        // 3. Metas y Presupuestos
        const goals = await prisma.goal.findMany();
        const goalsText = goals.map(g => `- ${g.name}: Llevas ${g.currentAmount.toFixed(2)}€ de ${g.targetAmount.toFixed(2)}€`).join('\n');

        const budgets = await prisma.budget.findMany();
        const budgetsText = budgets.map(b => `- ${b.category}: Límite ${b.limit}€`).join('\n');

        // 4. CONTEXTO PARA LA IA
        const context = `
        - Balance Total Real: ${realBalance.toFixed(2)}€
        - Ingresos este mes: ${monthlyIncome.toFixed(2)}€
        - Gastos este mes: ${monthlyExpenses.toFixed(2)}€
        - Metas Activas: \n${goalsText || 'Ninguna'}
        - Presupuestos Activos: \n${budgetsText || 'Ninguno'}

        INSTRUCCIÓN ESPECIAL PARA PRESUPUESTOS:
        Si el usuario te pide crear, fijar o poner un presupuesto o límite de gasto, respóndele amigablemente confirmando la acción y AÑADE AL FINAL de tu respuesta esta etiqueta exacta: :::CREATE_BUDGET[Categoría|Límite]:::.
        Ejemplo si pide 150€ para Restaurantes: ¡Claro! He fijado tu presupuesto para restaurantes en 150€. :::CREATE_BUDGET[Restaurantes|150]:::
        `;

        const aiRawResponse = await AIService.chatWithAI(message, history, context);
        let text = typeof aiRawResponse === 'string' ? aiRawResponse : aiRawResponse.text;
        let action = null;

        // 5. CAZAR LA ETIQUETA SECRETA DE LA IA
        const budgetMatch = text.match(/:::CREATE_BUDGET\[(.*?)\|(.*?)\]:::/);
        if (budgetMatch) {
            const category = budgetMatch[1].trim();
            const limit = Number(budgetMatch[2].trim());
            const user = await prisma.user.findFirst(); // Usuario principal

            if (user && limit > 0) {
                await prisma.budget.create({
                    data: {
                        id: crypto.randomUUID(),
                        userId: user.id,
                        category,
                        limit,
                        period: 'MONTHLY',
                        updatedAt: new Date()
                    }
                });
                action = 'BUDGET_CREATED';
            }
            // Borramos la etiqueta para que el usuario no la vea en el chat
            text = text.replace(budgetMatch[0], '').trim();
        }

        return NextResponse.json({ text, action });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
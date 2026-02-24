// --- src/app/api/budgets/route.ts ---

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// ----------------------------------------------------------------------
// OBTENER PRESUPUESTOS Y CALCULAR PREDICCIÓN
// ----------------------------------------------------------------------
export async function GET() {
    try {
        const budgets = await prisma.budget.findMany();

        // Obtenemos los gastos del mes actual para ver cómo vamos
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const monthlyExpenses = await prisma.transaction.groupBy({
            by: ['category'],
            where: {
                type: 'EXPENSE',
                date: { gte: firstDayOfMonth }
            },
            _sum: { amount: true }
        });

        // Lógica de Predicción: ¿A qué ritmo estamos gastando?
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const currentDay = now.getDate();
        const progressRatio = currentDay / daysInMonth;

        const enhancedBudgets = budgets.map(budget => {
            const spent = monthlyExpenses.find(e => e.category === budget.category)?._sum.amount || 0;
            const projected = spent / progressRatio; // Predicción matemática de fin de mes

            return {
                ...budget,
                spent,
                projected,
                status: spent > budget.limit ? 'exceeded' : (projected > budget.limit ? 'warning' : 'safe')
            };
        });

        return NextResponse.json(enhancedBudgets);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ----------------------------------------------------------------------
// CREAR UN NUEVO PRESUPUESTO
// ----------------------------------------------------------------------
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { category, limit } = body;

        // Buscamos al usuario principal (Asumiendo que es entorno demo/single-user)
        const user = await prisma.user.findFirst();
        if (!user) throw new Error("Usuario no encontrado");

        const budget = await prisma.budget.create({
            data: {
                id: crypto.randomUUID(), // Generamos el ID manualmente para calmar a TypeScript
                userId: user.id,
                category,
                limit: Number(limit),
                period: 'MONTHLY',
                updatedAt: new Date()    // Le pasamos la fecha exacta ahora
            }
        });

        return NextResponse.json(budget);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        // For now, we fetch all goals as the app seems to be in a single-user testing state or 
        // lacks session-based filtering in the current dashboard.
        // In a real app, we'd filter by userId from the session.
        const goals = await prisma.goal.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(goals);
    } catch (error: any) {
        console.error("Error API Goals GET:", error);
        return NextResponse.json({ error: "No se pudieron obtener las metas" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, category, targetAmount, currentAmount, deadline, roundUpEnabled } = body;

        if (!name || !category || !targetAmount) {
            return NextResponse.json({ error: "Faltan campos obligatorios (nombre, categoría, monto objetivo)" }, { status: 400 });
        }

        // Attempt to find the first user in the DB to link the goal to.
        // This is a workaround since next-auth is not currently active in this environment.
        const firstUser = await prisma.user.findFirst();
        if (!firstUser) {
            return NextResponse.json({ error: "No hay usuarios en la base de datos para asignar la meta" }, { status: 404 });
        }

        console.log("Creating goal with data:", {
            name, category, targetAmount, currentAmount, deadline, roundUpEnabled
        });

        const goal = await prisma.goal.create({
            data: {
                name,
                category,
                targetAmount: parseFloat(targetAmount),
                currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
                deadline: (deadline && deadline.trim() !== '') ? new Date(deadline) : null,
                roundUpEnabled: Boolean(roundUpEnabled),
                userId: firstUser.id,
            },
        });

        return NextResponse.json(goal, { status: 201 });
    } catch (error: any) {
        console.error("❌ Error API Goals POST:", error);
        return NextResponse.json({
            error: "No se pudo crear la meta",
            details: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}

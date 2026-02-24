import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    let goalId = "unknown";
    try {
        const { id } = await context.params;
        goalId = id;
        const body = await request.json();
        const { name, category, targetAmount, currentAmount, deadline, roundUpEnabled } = body;

        console.log(`Updating goal ${goalId} with data:`, { name, category, targetAmount, currentAmount, deadline, roundUpEnabled });

        const updatedGoal = await prisma.goal.update({
            where: { id: goalId },
            data: {
                ...(name && { name }),
                ...(category && { category }),
                ...(targetAmount !== undefined && { targetAmount: parseFloat(targetAmount) }),
                ...(currentAmount !== undefined && { currentAmount: parseFloat(currentAmount) }),
                ...(deadline !== undefined && { deadline: (deadline && deadline.trim() !== '') ? new Date(deadline) : null }),
                ...(roundUpEnabled !== undefined && { roundUpEnabled: Boolean(roundUpEnabled) }),
            },
        });

        return NextResponse.json(updatedGoal);
    } catch (error: any) {
        console.error(`❌ Error API Goals PATCH (${goalId}):`, error);
        return NextResponse.json({
            error: "No se pudo actualizar la meta",
            details: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    let goalId = "unknown";
    try {
        const { id } = await context.params;
        goalId = id;

        await prisma.goal.delete({
            where: { id: goalId },
        });

        return NextResponse.json({ message: "Meta eliminada correctamente" });
    } catch (error: any) {
        console.error(`❌ Error API Goals DELETE (${goalId}):`, error);
        return NextResponse.json({ error: "No se pudo eliminar la meta", details: error.message }, { status: 500 });
    }
}

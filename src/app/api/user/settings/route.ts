import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const user = await prisma.user.findFirst({
            include: { BankAccount: true }
        });
        if (!user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        const activeAccounts = user.BankAccount.filter(b => b.accessToken && !b.isManual);

        // Group by institutionName
        const banksMap = new Map<string, any[]>();
        activeAccounts.forEach(acc => {
            const instName = acc.institutionName || 'Banco Desconocido';
            if (!banksMap.has(instName)) {
                banksMap.set(instName, []);
            }
            banksMap.get(instName)?.push({
                id: acc.id,
                name: acc.name,
                mask: acc.mask,
                type: acc.type
            });
        });

        const connectedBanks = Array.from(banksMap.entries()).map(([name, accounts]) => ({
            name,
            accounts
        }));

        return NextResponse.json({
            ...user,
            connectedBanks
        });
    } catch (error) {
        console.error("Error fetching user settings:", error);
        return NextResponse.json({ error: "Error al obtener configuración" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { name, preferredCurrency, dateFormat, notificationsEnabled } = body;

        const firstUser = await prisma.user.findFirst();
        if (!firstUser) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: firstUser.id },
            data: {
                ...(name && { name }),
                ...(preferredCurrency && { preferredCurrency }),
                ...(dateFormat && { dateFormat }),
                ...(notificationsEnabled !== undefined && { notificationsEnabled }),
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Error updating user settings:", error);
        return NextResponse.json({ error: "Error al actualizar configuración" }, { status: 500 });
    }
}

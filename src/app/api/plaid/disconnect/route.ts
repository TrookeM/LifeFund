import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { plaidClient } from '@/services/plaid.service';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { institutionName, accountId } = body;

        if (!institutionName && !accountId) {
            return NextResponse.json({ error: "Parámetros insuficientes" }, { status: 400 });
        }

        const user = await prisma.user.findFirst();
        if (!user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        if (accountId) {
            // Option A: Disconnect a single account
            const accountToDisconnect = await prisma.bankAccount.findFirst({
                where: { id: accountId, userId: user.id }
            });

            if (!accountToDisconnect) {
                return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
            }

            await prisma.bankAccount.delete({
                where: { id: accountId }
            });

            return NextResponse.json({ success: true, message: `Cuenta desconectada correctamente.` });

        } else {
            // Option B: Disconnect the entire institution
            const plaidAccounts = await prisma.bankAccount.findMany({
                where: {
                    userId: user.id,
                    institutionName: institutionName,
                    accessToken: { not: null }
                }
            });

            // Remove Items from Plaid API (Best effort)
            const uniqueTokens = new Set(plaidAccounts.map(a => a.accessToken));
            for (const token of uniqueTokens) {
                if (token) {
                    try {
                        await plaidClient.itemRemove({ access_token: token });
                    } catch (e) {
                        console.error("Failed to remove item from Plaid SDK:", e);
                    }
                }
            }

            await prisma.bankAccount.deleteMany({
                where: {
                    userId: user.id,
                    institutionName: institutionName,
                    isManual: false
                }
            });

            return NextResponse.json({ success: true, message: `Institución ${institutionName} desconectada correctamente.` });
        }

    } catch (error: any) {
        console.error("Error desconectando banco:", error);
        return NextResponse.json({ error: "Fallo al desconectar la cuenta bancaria" }, { status: 500 });
    }
}

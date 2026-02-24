import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { plaidClient } from '@/services/plaid.service';

export async function GET() {
    try {
        const accs = await prisma.bankAccount.findMany({
            include: { Transaction: true }
        });

        const tokens = accs.map(a => ({
            name: a.name,
            institution: a.institutionName,
            cursor: a.lastCursor,
            txCount: a.Transaction.length,
            hasToken: !!a.accessToken,
            itemId: a.itemId,
            transactions: a.Transaction.map(t => ({
                id: t.id,
                description: t.description,
                amount: t.amount,
                aiCategory: t.aiCategory,
                isSubscription: t.isSubscription
            }))
        }));

        let syncTest = null;
        const firstTokenAcc = accs.find(a => a.accessToken);
        if (firstTokenAcc?.accessToken) {
            try {
                const response = await plaidClient.transactionsSync({
                    access_token: firstTokenAcc.accessToken,
                    cursor: accs[0].lastCursor || undefined,
                });
                syncTest = {
                    added: response.data.added.length,
                    modified: response.data.modified.length,
                    removed: response.data.removed.length,
                    nextCursor: response.data.next_cursor
                };
            } catch (e: any) {
                syncTest = { error: e.message || 'Plaid API error' };
            }
        }

        return NextResponse.json({
            bankAccounts: tokens,
            firstTokenSyncTest: syncTest
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

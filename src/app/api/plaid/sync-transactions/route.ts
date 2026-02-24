import { NextResponse } from 'next/server';
import { plaidClient } from '@/services/plaid.service';
import prisma from '@/lib/prisma';
import { RoundUpService } from '@/services/roundup.service';

export async function POST(request: Request) {
    try {
        // Find the user context
        const user = await prisma.user.findFirst();
        if (!user) {
            return NextResponse.json({ error: "No user found." }, { status: 404 });
        }

        const accountsWithTokens = await prisma.bankAccount.findMany({
            where: { accessToken: { not: null } },
            select: { accessToken: true, lastCursor: true, itemId: true }
        });

        // Group by accessToken to avoid syncing the same item multiple times
        const uniqueTokens = new Map<string, { lastCursor: string | null }>();
        for (const acc of accountsWithTokens) {
            if (acc.accessToken && !uniqueTokens.has(acc.accessToken)) {
                uniqueTokens.set(acc.accessToken, { lastCursor: acc.lastCursor });
            }
        }

        let totalAdded = 0;

        // Sync for each Plaid Item (AccessToken)
        for (const [accessToken, data] of Array.from(uniqueTokens.entries())) {
            let cursor = data.lastCursor || undefined;
            let added: any[] = [];
            let modified: any[] = [];
            let removed: any[] = [];
            let hasMore = true;

            // Follow Plaid's pagination cursor logic
            while (hasMore) {
                const response = await plaidClient.transactionsSync({
                    access_token: accessToken,
                    cursor: cursor,
                });
                const resData = response.data;
                added = added.concat(resData.added);
                modified = modified.concat(resData.modified); // Not processing modified for now
                removed = removed.concat(resData.removed);   // Not processing removed for now
                hasMore = resData.has_more;
                cursor = resData.next_cursor;
            }

            // To map transactions to our BankAccounts
            const accountsForThisToken = await prisma.bankAccount.findMany({
                where: { accessToken: accessToken }
            });
            const accountIdMap = new Map();
            for (const acc of accountsForThisToken) {
                accountIdMap.set(acc.providerAccountId, acc.id);
            }

            // Process added transactions
            for (const txn of added) {
                const bankAccountId = accountIdMap.get(txn.account_id);
                if (!bankAccountId) continue;

                // Plaid amounts: positive = expense/withdrawal, negative = income/deposit
                const isIncome = txn.amount < 0;
                const absAmount = Math.abs(txn.amount);

                await prisma.transaction.upsert({
                    where: { id: txn.transaction_id },
                    update: {
                        amount: absAmount,
                        date: new Date(txn.date),
                        description: txn.name || txn.merchant_name || 'Transaction',
                        category: txn.category ? txn.category[0] : 'Otros',
                        type: isIncome ? 'INCOME' : 'EXPENSE',
                        updatedAt: new Date()
                    },
                    create: {
                        id: txn.transaction_id,
                        accountId: bankAccountId,
                        userId: user.id,
                        amount: absAmount,
                        date: new Date(txn.date),
                        description: txn.name || txn.merchant_name || 'Transaction',
                        category: txn.category ? txn.category[0] : 'Otros',
                        type: isIncome ? 'INCOME' : 'EXPENSE',
                        updatedAt: new Date()
                    }
                });
                totalAdded++;
            }

            // Update the cursor for all accounts sharing this token so we don't refetch the same next time
            if (cursor) {
                await prisma.bankAccount.updateMany({
                    where: { accessToken: accessToken },
                    data: { lastCursor: cursor }
                });
            }
        }

        // After all items are synced, calculate and apply round-ups for the new transactions
        if (totalAdded > 0) {
            // Fetch the newly added transactions to calculate the round-up
            const latestTransactions = await prisma.transaction.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' },
                take: totalAdded
            });
            await RoundUpService.processTransactionsForRoundUp(latestTransactions);
        }

        return NextResponse.json({ success: true, count: totalAdded, message: `Sincronizadas ${totalAdded} transacciones.` });
    } catch (error: any) {
        console.error("Error syncing transactions:", error.response?.data || error);
        try {
            const fs = require('fs');
            fs.appendFileSync('sync_error.log', new Date().toISOString() + '\\n' + (error.stack || error.message || JSON.stringify(error)) + '\\n\\n');
            if (error.response?.data) fs.appendFileSync('sync_error.log', JSON.stringify(error.response.data) + '\\n\\n');
        } catch (e) { }
        return NextResponse.json({ error: "Falló la sincronización de transacciones" }, { status: 500 });
    }
}

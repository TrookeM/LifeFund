import { NextResponse } from 'next/server';
import { plaidClient } from '@/services/plaid.service';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { publicToken, institutionId, institutionName, userId = 'user_demo' } = body;

        // 1. Exchange the public token for an access token
        const exchangeResponse = await plaidClient.itemPublicTokenExchange({
            public_token: publicToken,
        });

        const accessToken = exchangeResponse.data.access_token;
        const itemId = exchangeResponse.data.item_id;

        // 2. Fetch the accounts associated with this item
        const accountsResponse = await plaidClient.accountsGet({
            access_token: accessToken,
        });

        const accounts = accountsResponse.data.accounts;

        // 3. Save each bank account to our database
        // We will find the user first
        const user = await prisma.user.findFirst();
        if (!user) {
            throw new Error("No user found in the system to link accounts to.");
        }

        const savedAccounts = [];
        for (const acc of accounts) {
            const newAccount = await prisma.bankAccount.upsert({
                where: { providerAccountId: acc.account_id },
                update: {
                    balance: acc.type === 'depository' ? (acc.balances.available ?? acc.balances.current ?? 0) : (acc.balances.current ?? 0),
                    name: acc.name,
                    institutionName,
                    mask: acc.mask,
                    accessToken: accessToken,
                    itemId: itemId,
                    updatedAt: new Date()
                },
                create: {
                    id: uuidv4(),
                    userId: user.id,
                    providerAccountId: acc.account_id,
                    name: acc.name,
                    type: acc.subtype || acc.type,
                    balance: acc.type === 'depository' ? (acc.balances.available ?? acc.balances.current ?? 0) : (acc.balances.current ?? 0),
                    currency: acc.balances.iso_currency_code || 'EUR',
                    isManual: false,
                    institutionId,
                    institutionName,
                    mask: acc.mask,
                    accessToken: accessToken,
                    itemId: itemId,
                    updatedAt: new Date()
                }
            });
            savedAccounts.push(newAccount);
        }

        // We should ideally store the access_token securely (e.g., encrypted)
        // For LifeFund MVP we can store it in the Account model (NextAuth model structure) or a dedicated PlaidItem model.
        // For now, we'll associate it with the generic Account if possible, or we might need a PlaidItem model later.
        // As a simplification, returning the success string.

        return NextResponse.json({
            success: true,
            message: "Cuentas vinculadas exitosamente",
            accountsLinked: savedAccounts.length
        });

    } catch (error: any) {
        console.error("Error exchanging public token:", error.response?.data || error);
        return NextResponse.json({ error: "Fallo al vincular la cuenta bancaria" }, { status: 500 });
    }
}

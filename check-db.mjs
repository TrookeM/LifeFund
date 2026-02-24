import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const bankAccounts = await prisma.bankAccount.findMany({
        include: { Transaction: true }
    });

    console.log("=== Bank Accounts ===");
    bankAccounts.forEach(b => {
        console.log(`- ${b.name} (${b.institutionName}):`);
        console.log(`  AccessToken: ${b.accessToken ? 'Yes' : 'No'}`);
        console.log(`  Cursor: ${b.lastCursor || 'None'}`);
        console.log(`  Transactions: ${b.Transaction.length}`);
    });

    const allTxs = await prisma.transaction.findMany();
    console.log(`\n=== Total Transactions in DB: ${allTxs.length} ===`);
    const nullCat = allTxs.filter(t => !t.aiCategory).length;
    console.log(`Pending AI Categorization: ${nullCat}`);
    const subs = allTxs.filter(t => t.isSubscription).length;
    console.log(`Total Subscriptions: ${subs}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

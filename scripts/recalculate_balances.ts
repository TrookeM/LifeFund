import { PrismaClient, TransactionType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const accounts = await prisma.bankAccount.findMany({
        select: { id: true, type: true },
    });

    for (const acc of accounts) {
        // Skip credit accounts – they represent debt.
        if (acc.type?.toLowerCase().includes('credit')) continue;

        const txs = await prisma.transaction.findMany({
            where: { accountId: acc.id },
            select: { amount: true, type: true },
        });

        const balance = txs.reduce((sum, t) => {
            return sum + (t.type === TransactionType.INCOME ? t.amount : -t.amount);
        }, 0);

        await prisma.bankAccount.update({
            where: { id: acc.id },
            data: { balance },
        });
        console.log(`Updated ${acc.id} → ${balance}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());

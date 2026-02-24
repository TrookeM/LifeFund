import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const accs = await prisma.bankAccount.findMany({
        select: { name: true, accessToken: true, lastCursor: true, _count: { select: { Transaction: true } } }
    });
    console.log(JSON.stringify(accs, null, 2));
}

main().finally(() => prisma.$disconnect());

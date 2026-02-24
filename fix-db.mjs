import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const deleted = await prisma.transaction.deleteMany({
        where: { description: { contains: 'Automatic Payment', mode: 'insensitive' } }
    });
    console.log(`Deleted ${deleted.count} anomaly transactions.`);
}

main().finally(() => prisma.$disconnect());

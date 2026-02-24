import prisma from '../src/lib/prisma';

async function main() {
    try {
        console.log("Testing Goal fetch...");
        const goals = await prisma.goal.findMany();
        console.log("Goals found:", goals.length);
        if (goals.length > 0) {
            console.log("First goal roundUpEnabled:", goals[0].roundUpEnabled);
        }

        const firstUser = await prisma.user.findFirst();
        if (firstUser) {
            console.log("Creating test goal...");
            const newGoal = await prisma.goal.create({
                data: {
                    name: "Test Goal",
                    category: "Test",
                    targetAmount: 100,
                    currentAmount: 0,
                    roundUpEnabled: true,
                    userId: firstUser.id
                }
            });
            console.log("Created goal ID:", newGoal.id);

            console.log("Deleting test goal...");
            await prisma.goal.delete({ where: { id: newGoal.id } });
            console.log("Success!");
        }
    } catch (e) {
        console.error("Error in test script:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AIService } from '@/services/ai.service';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log("Iniciando procesamiento de transacciones vía API...");

        // Buscar transacciones que aún no tienen aiCategory
        const transactions = await prisma.transaction.findMany({
            where: {
                aiCategory: null,
            },
            select: {
                id: true,
                description: true,
                amount: true,
                date: true,
            }
        });

        console.log(`Se encontraron ${transactions.length} transacciones pendientes.`);

        if (transactions.length === 0) {
            return NextResponse.json({ message: "Todas las transacciones ya están categorizadas." });
        }

        const batchSize = 50;
        const stats = { processed: 0, errors: 0 };

        for (let i = 0; i < transactions.length; i += batchSize) {
            const batch = transactions.slice(i, i + batchSize);
            const batchNum = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(transactions.length / batchSize);
            console.log(`Procesando Lote ${batchNum} de ${totalBatches}...`);

            try {
                const payload = batch.map(t => ({
                    id: t.id,
                    raw_name: t.description,
                }));

                const aiResults = await AIService.analyzeTransactions(payload);

                for (const result of aiResults) {
                    await prisma.transaction.update({
                        where: { id: result.id },
                        data: {
                            description: result.clean_name,
                            aiCategory: result.category,
                            isSubscription: Boolean(result.is_subscription),
                        }
                    });
                    stats.processed++;
                }
                console.log(`✅ Lote ${batchNum} procesado exitosamente.`);
            } catch (error: any) {
                console.error(`❌ Error procesando el lote ${batchNum}:`, error);
                stats.errors++;
                // If the first batch fails, we should just abort and tell the user they are out of quota
                if (batchNum === 1) {
                    return NextResponse.json({ error: "Límite de la API de IA excedido (429). Por favor, espera 1 minuto." }, { status: 429 });
                }
            }

            if (batchNum < totalBatches) {
                // Delay para no saturar API Rate Limits
                await new Promise(resolve => setTimeout(resolve, 2500));
            }
        }

        return NextResponse.json({
            message: "Procesamiento completo",
            stats
        });
    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

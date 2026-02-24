import * as dotenv from 'dotenv';
dotenv.config({ path: '.env', override: true });

import { Client } from 'pg';
import { AIService } from '../src/services/ai.service';

async function main() {
    console.log("Iniciando procesamiento de transacciones vía PostgreSQL Driver directo...");

    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    await client.connect();

    try {
        // Buscar transacciones que aún no tienen aiCategory
        const result = await client.query(`
      SELECT id, description, amount, date 
      FROM "Transaction" 
      WHERE "aiCategory" IS NULL
    `);

        const transactions = result.rows;

        console.log(`Se encontraron ${transactions.length} transacciones pendientes de categorizar.`);

        if (transactions.length === 0) {
            console.log("✅ Todas las transacciones ya están categorizadas.");
            return;
        }

        const batchSize = 50;
        for (let i = 0; i < transactions.length; i += batchSize) {
            const batch = transactions.slice(i, i + batchSize);
            const batchNum = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(transactions.length / batchSize);
            console.log(`\n⏳ Procesando Lote ${batchNum} de ${totalBatches}...`);

            try {
                const payload = batch.map(t => ({
                    id: t.id,
                    raw_name: t.description,
                }));

                const aiResults = await AIService.analyzeTransactions(payload, process.env.GEMINI_API_KEY);

                for (const res of aiResults) {
                    await client.query(`
            UPDATE "Transaction"
            SET description = $1, category = $2, "aiCategory" = $2, "isSubscription" = $3
            WHERE id = $4
          `, [res.clean_name, res.category, Boolean(res.is_subscription), res.id]);
                }
                console.log(`✅ Lote ${batchNum} procesado y base de datos actualizada.`);
            } catch (error) {
                console.error(`❌ Error procesando el lote ${batchNum}:`, error);
            }

            if (batchNum < totalBatches) {
                await new Promise(resolve => setTimeout(resolve, 2500));
            }
        }

        console.log("\n🎉 Procesamiento completo de todas las transacciones.");
    } finally {
        await client.end();
    }
}

main()
    .catch((e) => {
        console.error("Error fatal en el script:", e);
        process.exit(1);
    });

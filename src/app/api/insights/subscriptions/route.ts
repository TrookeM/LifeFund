import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AIService } from '@/services/ai.service';

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const accountId = url.searchParams.get('account');
        const institutionId = url.searchParams.get('institution');

        const user = await prisma.user.findFirst();
        if (!user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        let accountWhere: any = {};
        if (accountId) {
            accountWhere = { accountId: accountId };
        } else if (institutionId) {
            accountWhere = { BankAccount: { institutionId: institutionId } };
        }

        // 1. Fetch all EXPENSE transactions marked as subscriptions
        const subscriptions = await prisma.transaction.findMany({
            where: {
                userId: user.id,
                isSubscription: true,
                type: 'EXPENSE',
                ...accountWhere
            },
            orderBy: {
                date: 'desc'
            }
        });

        if (!subscriptions || subscriptions.length === 0) {
            return NextResponse.json({
                totalMonthlyCost: 0,
                subscriptions: [],
                aiRecommendations: "No se han detectado suscripciones activas para analizar."
            });
        }

        // 2. Group by clean_name (stored in description) and calculate monthly cost
        const subMap = new Map<string, number>();

        subscriptions.forEach(sub => {
            const name = sub.description || "Desconocido";
            if (!subMap.has(name)) {
                subMap.set(name, Math.abs(sub.amount));
            }
        });

        let totalMonthlyCost = 0;
        const activeSubscriptions: Array<{ name: string, cost: number }> = [];

        subMap.forEach((cost, name) => {
            totalMonthlyCost += cost;
            activeSubscriptions.push({ name, cost });
        });

        activeSubscriptions.sort((a, b) => b.cost - a.cost);

        const analyze = url.searchParams.get('analyze') === 'true';

        // 3. Call AI for Dynamic Analysis only if requested
        let aiRecommendations = "Haz clic en 'Analizar con IA' para auditar tus suscripciones.";
        if (analyze) {
            try {
                aiRecommendations = await AIService.analyzeSubscriptionPortfolio(activeSubscriptions);
            } catch (err: any) {
                console.error("AI Analysis failed:", err);
                aiRecommendations = "⚠️ La IA está saturada. Inténtalo en un minuto.";
            }
        }

        return NextResponse.json({
            totalMonthlyCost,
            subscriptions: activeSubscriptions,
            aiRecommendations
        });

    } catch (error: any) {
        console.error("Error API Subscriptions Insights:", error);
        return NextResponse.json({ error: "No se pudieron obtener los insights" }, { status: 500 });
    }
}

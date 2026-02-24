import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AIService } from '@/services/ai.service';

export async function GET() {
    try {
        // Fetch all transactions to calculate actual balance
        const transactions = await prisma.transaction.findMany();
        let income = 0;
        let expenses = 0;

        transactions.forEach(t => {
            if (t.type === 'INCOME') income += t.amount;
            else expenses += t.amount;
        });

        const balance = income - expenses;

        // Call AI for suggestions
        const suggestions = await AIService.getInspiringSuggestions(balance);

        return NextResponse.json({ suggestions });
    } catch (error: any) {
        console.error("Error API Matchmaker:", error);
        return NextResponse.json({ error: "Fallo al inspirar" }, { status: 500 });
    }
}

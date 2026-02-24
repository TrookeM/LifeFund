import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const transactions = await prisma.transaction.findMany({
            orderBy: { date: 'desc' }
        });

        const goals = await prisma.goal.findMany();

        // Build CSV Content
        let csv = "--- TRANSACCIONES ---\n";
        csv += "ID,Fecha,Descripcion,Monto,Tipo,Categoria\n";

        transactions.forEach(t => {
            csv += `${t.id},${t.date.toISOString().split('T')[0]},"${t.description.replace(/"/g, '""')}",${t.amount},${t.type},${t.aiCategory || ''}\n`;
        });

        csv += "\n--- METAS DE AHORRO ---\n";
        csv += "ID,Nombre,Categoria,Meta,Actual,Fecha Limite\n";

        goals.forEach(g => {
            csv += `${g.id},"${g.name.replace(/"/g, '""')}",${g.category},${g.targetAmount},${g.currentAmount},${g.deadline ? g.deadline.toISOString().split('T')[0] : ''}\n`;
        });

        const response = new NextResponse(csv);
        response.headers.set('Content-Type', 'text/csv');
        response.headers.set('Content-Disposition', `attachment; filename=LifeFund_Export_${new Date().toISOString().split('T')[0]}.csv`);

        return response;
    } catch (error) {
        console.error("Error exporting data:", error);
        return NextResponse.json({ error: "Error al exportar datos" }, { status: 500 });
    }
}

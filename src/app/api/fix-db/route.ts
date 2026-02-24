import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const deleted = await prisma.transaction.deleteMany({
            where: { description: { contains: 'Automatic Payment', mode: 'insensitive' } }
        });
        return NextResponse.json({ message: `Deleted ${deleted.count} anomaly transactions.` });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

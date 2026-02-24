// --- src/app/api/ai/scan-receipt/route.ts ---

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) throw new Error('No se subió ninguna imagen.');

        // Convertir la imagen a Base64 para Gemini
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Data = buffer.toString('base64');

        // 1. Buscar al usuario
        const user = await prisma.user.findFirst();
        if (!user) throw new Error("Usuario no encontrado");

        // 2. BUSCAR TUS PRESUPUESTOS ACTUALES
        const budgets = await prisma.budget.findMany({ where: { userId: user.id } });
        const budgetCategories = budgets.map(b => b.category).join(', ');
        const fallbackCategories = "Comida, Transporte, Ocio, Compras, Salud, Hogar, Otros";

        const availableCategories = budgetCategories.length > 0
            ? `${budgetCategories}, Otros`
            : fallbackCategories;

        // Inicializar Gemini Vision
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        // LE OBLIGAMOS A USAR TUS CATEGORÍAS
        const prompt = `Eres un contable experto. Analiza la imagen de este ticket de compra.
        Extrae la información y devuélvela ESTRICTAMENTE como un objeto JSON válido, sin comillas invertidas ni formato markdown.
        Estructura obligatoria:
        {
            "merchant": "Nombre del comercio (ej: Mercadona, Repsol)",
            "amount": número total con decimales (ej: 15.50),
            "date": "fecha en formato YYYY-MM-DD (si no se ve, pon la de hoy)",
            "category": "DEBES ELEGIR OBLIGATORIAMENTE UNA DE ESTAS CATEGORÍAS EXACTAS: [${availableCategories}]",
            "description": "Breve resumen de lo comprado (ej: 2 cafés y tostadas)"
        }`;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Data, mimeType: file.type } }
        ]);

        const responseText = result.response.text().replace(/```json/gi, '').replace(/```/g, '').trim();
        const data = JSON.parse(responseText);

        // 3. Buscar o crear una "Cartera de Efectivo" (Cuenta Manual)
        let cashAccount = await prisma.bankAccount.findFirst({
            where: { userId: user.id, isManual: true, type: 'cash' }
        });

        if (!cashAccount) {
            cashAccount = await prisma.bankAccount.create({
                data: {
                    id: crypto.randomUUID(),
                    userId: user.id,
                    name: 'Billetera (Efectivo)',
                    type: 'cash',
                    balance: 0,
                    isManual: true,
                    updatedAt: new Date()
                }
            });
        }

        // 4. Crear la transacción en la base de datos
        const newTx = await prisma.transaction.create({
            data: {
                id: crypto.randomUUID(),
                accountId: cashAccount.id,
                userId: user.id,
                amount: Number(data.amount),
                date: new Date(data.date || new Date()),
                description: `${data.merchant} - ${data.description}`,
                category: data.category, // Ahora coincidirá con tu presupuesto
                type: 'EXPENSE',
                aiCategory: data.category,
                updatedAt: new Date()
            }
        });

        return NextResponse.json({ success: true, transaction: newTx, parsed: data });

    } catch (error: any) {
        console.error("Error en Scanner IA:", error);
        return NextResponse.json({ error: "No se pudo leer el ticket. " + error.message }, { status: 500 });
    }
}
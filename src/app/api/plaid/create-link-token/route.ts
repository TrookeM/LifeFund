import { NextResponse } from 'next/server';
import { plaidClient } from '@/services/plaid.service';
import { Products, CountryCode } from 'plaid';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const userId = body.userId || 'user_demo'; // Fallback for testing

        const tokenResponse = await plaidClient.linkTokenCreate({
            user: { client_user_id: userId },
            client_name: 'LifeFund',
            products: [Products.Transactions],
            country_codes: [CountryCode.Es, CountryCode.Gb, CountryCode.Us],
            language: 'es',
        });

        return NextResponse.json(tokenResponse.data);
    } catch (error: any) {
        console.error("Error creating Plaid Link Token:", error.response?.data || error);
        return NextResponse.json({ error: "No se pudo generar el token bancario", details: error.response?.data }, { status: 500 });
    }
}

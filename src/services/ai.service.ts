import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export class AIService {
    private static genAI: GoogleGenerativeAI;

    // Fallback chain: try each model in order if one is quota-exhausted
    private static readonly MODELS = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
    ];

    private static getGenAI(rawApiKey?: string) {
        if (!this.genAI) {
            const key = (rawApiKey || process.env.GEMINI_API_KEY)?.replace(/['"]/g, '').trim();
            if (!key) {
                throw new Error("Missing GEMINI_API_KEY environment variable. Please add it to your .env file.");
            }
            this.genAI = new GoogleGenerativeAI(key);
        }
        return this.genAI;
    }

    // Try to get a working model, falling back through the list on quota errors
    private static async getWorkingModel(apiKey?: string, extraConfig: object = {}) {
        const genAI = this.getGenAI(apiKey);
        let lastError: any;
        for (const modelName of this.MODELS) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName, ...extraConfig });
                // Quick probe: just instantiate (errors surface on actual call)
                console.log(`[AIService] Attempting model: ${modelName}`);
                return { model, modelName };
            } catch (err: any) {
                lastError = err;
            }
        }
        throw lastError || new Error("No AI models available");
    }

    private static readonly SYSTEM_PROMPT = `Eres el motor de inteligencia artificial de 'LifeFund', un gestor financiero avanzado. Tu tarea es analizar un array de transacciones bancarias crudas (en formato JSON), limpiar los nombres comerciales, asignar una categoría estandarizada y detectar posibles suscripciones recurrentes.
REGLAS ESTRICTAS:
1. Limpieza de nombres: Convierte descripciones feas como "CRV*AMZN MKTP ES MADRID" a "Amazon".
2. Categorización: DEBES clasificar cada gasto ÚNICAMENTE en: [Vivienda, Supermercado, Transporte, Ocio y Restaurantes, Suscripciones, Salud, Compras, Ingresos, Transferencias, Otros].
3. Suscripciones: Si es un servicio de pago recurrente, marca "is_subscription" como true.
Devuelve ÚNICAMENTE un array en formato JSON válido de objetos con este formato: { "id": "...", "clean_name": "...", "category": "...", "is_subscription": true/false }`;

    static async analyzeTransactions(transactions: any[], apiKey?: string): Promise<any[]> {
        const genAI = this.getGenAI(apiKey);

        // Usamos directamente el modelo más rápido y barato
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                // FORZAMOS a que devuelva un Array, así NUNCA falla el parseo
                responseSchema: {
                    type: SchemaType.ARRAY,
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            id: { type: SchemaType.STRING },
                            clean_name: { type: SchemaType.STRING },
                            category: { type: SchemaType.STRING },
                            is_subscription: { type: SchemaType.BOOLEAN }
                        },
                        required: ["id", "clean_name", "category", "is_subscription"]
                    }
                }
            }
        });

        const prompt = `${this.SYSTEM_PROMPT}\n\nA continuación tienes el array de transacciones bancarias a procesar:\n${JSON.stringify(transactions)}`;

        try {
            console.log(`[AIService] Enviando lote de ${transactions.length} transacciones a Gemini...`);
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            // Como forzamos el Schema, esto siempre será un JSON válido
            return JSON.parse(responseText);

        } catch (err: any) {
            console.error("❌ Error categorizando el lote con IA:", err);

            // Si da error de cuota (429), lanzamos un error claro para que la ruta route.ts lo atrape
            if (err?.message?.includes('429') || err?.message?.includes('quota') || err?.message?.includes('RESOURCE_EXHAUSTED')) {
                throw new Error("429");
            }
            throw err;
        }
    }

    static async chatWithAI(message: string, history: any[] = [], context: string, apiKey?: string) {
        try {
            const systemContent = `Eres el Asistente de Metas de 'LifeFund'. 
            Tu objetivo es ayudar al usuario a planificar sus ahorros de forma visual y motivadora.
            
            CONTEXTO FINANCIERO ACTUAL DEL USUARIO (Balances, Gastos y METAS ACTIVAS):
            ${context}
            
            REGLAS DE RESPUESTA:
            1. Analiza si la meta es realista según su balance y gastos.
            2. Calcula cuánto debería ahorrar al mes de forma clara.
            3. Si el usuario está de acuerdo con el plan, utiliza la herramienta 'createGoalToDatabase' para guardar la meta automáticamente.
            4. Responde siempre en ESPAÑOL.
            5. USA FORMATO ENRIQUECIDO (Markdown): Usa negritas para cifras importantes, listas con viñetas para recomendaciones y EMOJIS para que sea más amigable y visual.
            6. Estructura la respuesta con párrafos claros y espacios.
            
            REGLA ESPECIAL OPTIMIZADOR DE FACTURAS (AFILIADOS):
            Si detectas facturas altas (Luz, Internet, Seguros) o el usuario busca ahorrar, usa la herramienta 'searchAffiliateOffers'. 
            Cuando recibas la oferta más barata de vuelta, haz esta fórmula: (Gasto_Actual - Nueva_Oferta) * 12 meses.
            Luego, revisa las METAS ACTIVAS del usuario en tu contexto. Encuentra la meta que más se beneficie de este ahorro y dile exactamente: 'Cambiando a [oferta], vas a ahorrar [X]€ al año. ¡Con ese dinero extra podrías llenar tu hucha para tu [Nombre Meta] [Y] meses antes de lo previsto!'
            
            IMPORTANTE: Para mostrar la oferta de forma visual, DEBES incluir al final de tu respuesta el siguiente bloque exactamente así:
            :::OFFER_CARD
            {
              "name": "Nombre de la Compañía",
              "price": 29.95,
              "oldPrice": 39.95,
              "category": "Internet",
              "link": "https://..."
            }
            :::
            (Sustituye los datos por los de la oferta real encontrada). No te olvides de preguntar si quiere que le pases el enlace o si prefiere que le ayudes con el cambio.`;

            const toolConfig: any[] = [{
                functionDeclarations: [
                    {
                        name: "createGoalToDatabase",
                        description: "Crea una nueva meta de ahorro (hucha) en la base de datos del usuario.",
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                name: { type: SchemaType.STRING, description: "Nombre de la meta (ej: Viaje a Japón)" },
                                category: { type: SchemaType.STRING, description: "Categoría (Viaje, Vivienda, Vehículo, Ocio, Otros)" },
                                targetAmount: { type: SchemaType.NUMBER, description: "Monto total a ahorrar" },
                                deadline: { type: SchemaType.STRING, description: "Fecha límite opcional en formato YYYY-MM-DD" }
                            },
                            required: ["name", "category", "targetAmount"]
                        }
                    },
                    {
                        name: "searchAffiliateOffers",
                        description: "Busca alternativas más baratas en la base de datos de afiliados para servicios recurrentes como Internet, Luz o Seguros.",
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                category: { type: SchemaType.STRING, description: "El tipo de servicio a buscar (ej: 'Internet', 'Luz', 'Seguros')" },
                                currentCost: { type: SchemaType.NUMBER, description: "El coste mensual actual que paga el usuario por este servicio." }
                            },
                            required: ["category", "currentCost"]
                        }
                    }
                ]
            }];

            // Try each model in order until one works
            let lastQuotaError: any;
            for (const modelName of this.MODELS) {
                try {
                    const model = this.getGenAI(apiKey).getGenerativeModel({
                        model: modelName,
                        systemInstruction: systemContent,
                        tools: toolConfig
                    });

                    const chat = model.startChat({
                        history: history,
                        generationConfig: { maxOutputTokens: 4096, temperature: 0.7 }
                    });

                    const result = await chat.sendMessage(message);
                    const response = result.response;

                    const calls = response.functionCalls();
                    let responseText: string | undefined;
                    try { responseText = response.text(); } catch { responseText = undefined; }

                    console.log(`[AIService] Chat OK on model: ${modelName}`);
                    console.log("Function Calls:", calls?.map(c => c.name));

                    if (calls && calls.length > 0) {
                        const call = calls[0];

                        if (call.name === "searchAffiliateOffers") {
                            const args = call.args as any;
                            const cat = (args.category || "").toLowerCase();

                            let mockOffer = { name: "Genérico 15% Descuento", price: (args.currentCost || 50) * 0.85, oldPrice: (args.currentCost || 50), affiliateLink: "https://lifefund.app/offer/generic" };
                            if (cat.includes('internet') || cat.includes('wifi') || cat.includes('fibra') || cat.includes('telef')) {
                                mockOffer = { name: "Lowi Fibra + Móvil", price: 29.95, oldPrice: 39.95, affiliateLink: "https://lowi.es/lifefund" };
                            } else if (cat.includes('luz') || cat.includes('electricidad') || cat.includes('energia')) {
                                mockOffer = { name: "Octopus Energy", price: 35.00, oldPrice: 45.00, affiliateLink: "https://octopus.energy/lifefund" };
                            } else if (cat.includes('seguro')) {
                                mockOffer = { name: "Seguro Tuio", price: 9.99, oldPrice: 15.00, affiliateLink: "https://tuio.com/lifefund" };
                            }

                            const functionResult = await chat.sendMessage([{ functionResponse: { name: "searchAffiliateOffers", response: mockOffer } }]);
                            let affiliateText: string;
                            try { affiliateText = functionResult.response.text(); } catch { affiliateText = "He encontrado una oferta mejor para ti. Consulta la tarjeta de abajo."; }
                            return { text: affiliateText, history: await chat.getHistory() };
                        }

                        return { text: responseText || "Procesando creación de meta...", functionCall: call };
                    }

                    return {
                        text: responseText ?? "Lo siento, no pude generar una respuesta. Inténtalo de nuevo.",
                        history: await chat.getHistory()
                    };

                } catch (modelErr: any) {
                    const isQuota = modelErr?.message?.includes('429') || modelErr?.message?.includes('quota') || modelErr?.message?.includes('RESOURCE_EXHAUSTED');
                    if (isQuota) {
                        console.warn(`[AIService] Chat model ${modelName} quota exceeded, trying next...`);
                        lastQuotaError = modelErr;
                        continue;
                    }
                    throw modelErr;
                }
            }

            // All models exhausted
            console.error("❌ All AI models quota exceeded");
            throw new Error("QUOTA_EXCEEDED: La IA está temporalmente saturada. Por favor, espera un minuto e inténtalo de nuevo.");
        } catch (error: any) {
            console.error("❌ Error en AIService Chat:", error);
            // Propagate the specific error message if available
            const errorMessage = error.message || "Error en la conversación con la IA";
            throw new Error(`Error en la conversación con la IA: ${errorMessage}`);
        }
    }

    static async getInspiringSuggestions(balance: number, apiKey?: string): Promise<string> {
        try {
            const systemContent = `Eres el 'Inspirador Financiero' de LifeFund. 
            Tu tarea es motivar al usuario basándote en su balance actual.
            Balance actual: ${balance.toFixed(2)}€
            
            REGLAS:
            1. Sugiere 3 planes realistas basados en su dinero.
            2. Divide las sugerencias en: 'Plan Low-Cost', 'Experiencia Recomendada' y 'Ahorro Inteligente'.
            3. Sé muy motivador y usa un tono premium/exclusivo.
            4. Responde en ESPAÑOL y usa Markdown (negritas y emojis).`;

            // Ojo: Usamos el flash normal, que suele tener límites más altos que el lite
            const model = this.getGenAI(apiKey).getGenerativeModel({
                model: "gemini-2.5-flash",
                systemInstruction: systemContent,
            });

            const result = await model.generateContent("Dime qué puedo hacer hoy con mi dinero de forma inspiradora.");
            return result.response.text();
        } catch (error: any) {
            console.error("❌ Error en Matchmaker IA:", error);

            // Si Google nos bloquea por límite de peticiones (Error 429)
            if (error?.message?.includes('429') || error?.status === 429 || error?.message?.includes('quota')) {
                return `### 🔋 La IA está recargando energía\n\nHas agotado tu límite de consultas gratuitas por hoy. ¡Aprovecha para descansar y disfrutar de tu dinero en el mundo real!\n\n**¿Qué puedes hacer?**\n* 🧘‍♂️ Relájate y vuelve a intentarlo en un rato.\n* 🔑 Si tienes prisa, añade una nueva clave API en tu configuración.`;
            }

            // Para cualquier otro error
            throw new Error("No he podido generar sugerencias en este momento.");
        }
    }

    static async analyzeSubscriptionPortfolio(subscriptions: any[], apiKey?: string): Promise<string> {
        try {
            const systemContent = `Eres el 'Auditor Financiero Implacable' de LifeFund.
            Tu objetivo es analizar el portafolio de suscripciones del usuario y encontrar fugas de capital urgentes. No tengas piedad con los gastos innecesarios, pero sé profesional e irónico.

            REGLAS CRÍTICAS:
            1. Analiza la lista de suscripciones proporcionada. Suma los importes e identifica nombres exactos.
            2. Busca duplicidades evidentes (ej. Netflix y Prime Video). Sugiere elegir uno.
            3. REGLA DE PLAID SANDBOX: Si ves una suscripción llamada "Automatic Payment", DEBES advertir: "⚠️ He detectado un *Pago Automático* de [importe]. Parece un recibo fantasma. ¡Revisa con urgencia a qué corresponde!".
            4. Responde SIEMPRE en ESPAÑOL y usa formato Markdown (negritas, emojis, listas).`;

            const model = this.getGenAI(apiKey).getGenerativeModel({
                model: "gemini-2.5-flash", // Usamos flash que tiene más límite
                systemInstruction: systemContent,
            });

            const prompt = `Aquí tienes mi lista actual de suscripciones mensuales activas:\n${JSON.stringify(subscriptions, null, 2)}\nAnalízalas y dime qué opinas sin filtros.`;

            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (error: any) {
            console.error("❌ Error en Auditor de Suscripciones IA:", error);

            if (error?.message?.includes('429') || error?.status === 429 || error?.message?.includes('quota')) {
                return `### 🛡️ Escudo en modo reposo\n\nEl sistema de auditoría inteligente ha superado el **límite de escaneos por minuto**.\n\nPor favor, **espera 60 segundos** y vuelve a pulsar el botón "Ejecutar IA" para reanudar la búsqueda de fugas de capital en tus cuentas.`;
            }

            return "### ⚠️ Error de Conexión\n\nEl núcleo de IA no responde en este momento. Reinténtalo más tarde.";
        }
    }
}

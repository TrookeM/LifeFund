// --- src/lib/utils.ts ---

/**
 * Formatea cualquier número a la moneda deseada (por defecto EUR)
 * Así, si mañana cambias a dólares, solo tocas esta línea.
 */
export function formatCurrency(amount: number, currency: string = 'EUR') {
    return amount.toLocaleString('es-ES', {
        style: 'currency',
        currency: currency,
    });
}
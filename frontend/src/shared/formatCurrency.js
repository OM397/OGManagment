/**
 * Formatea un número como moneda en euros, usando el formato español.
 * Ejemplo: 36231.5 => "€ 36.231"
 */
export function formatCurrency(amount, currency = 'EUR', locale = 'es-ES') {
  const num = Number(amount);
  if (isNaN(num)) return '';
  return num.toLocaleString(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2, // Fuerza siempre dos decimales
    maximumFractionDigits: 2,
  });
}

export default formatCurrency;
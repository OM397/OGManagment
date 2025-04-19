const yahooFinance = require('yahoo-finance2').default;

(async () => {
  const result = await yahooFinance.chart('ibcx.as', {
    period1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    interval: '1d'
  });

  const dates = result?.quotes?.map(p => new Date(p.date).toISOString().split('T')[0]);

  console.log('Fechas devueltas por Yahoo:', dates);
  console.log('Última fecha disponible:', dates[dates.length - 1]);
})();

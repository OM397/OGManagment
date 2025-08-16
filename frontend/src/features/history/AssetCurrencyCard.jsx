import React from 'react';

export default function AssetCurrencyCard({ asset }) {
  if (!asset) return null;
  const {
    name,
    initialCurrency,
    actualCurrency,
    fxRateInitial,
    fxRateActual,
    initialValue,
    initialValueEUR,
    actualValue,
    actualValueEUR,
    group,
    type
  } = asset;

  return (
    <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 12, background: '#fafbfc' }}>
      <h4 style={{ margin: 0, fontWeight: 600 }}>{name} <span style={{ fontSize: 12, color: '#888' }}>({type})</span></h4>
      <div style={{ fontSize: 13, marginTop: 4 }}>
        <strong>Grupo:</strong> {group}<br />
        <strong>Moneda inicial:</strong> {initialCurrency} <br />
        <strong>Moneda actual:</strong> {actualCurrency} <br />
  <strong>Tipo de cambio inicial:</strong> {fxRateInitial != null ? Number(fxRateInitial).toFixed(8) : ''} <br />
  <strong>Tipo de cambio actual:</strong> {fxRateActual != null ? Number(fxRateActual).toFixed(8) : ''} <br />
        <strong>Precio inicial:</strong> {initialValue} ({initialCurrency})<br />
        <strong>Precio inicial convertido:</strong> {initialValueEUR} (EUR)<br />
        <strong>Precio actual:</strong> {actualValue} ({actualCurrency})<br />
        <strong>Precio actual convertido:</strong> {actualValueEUR} (EUR)<br />
      </div>
    </div>
  );
}

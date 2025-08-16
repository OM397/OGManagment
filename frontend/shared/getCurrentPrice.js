// getCurrentPrice.js - Utilidad para obtener el precio actual de un activo
export function getCurrentPrice(asset, marketData) {
  const rawKey = asset.id?.toLowerCase?.();
  const mappedKey = marketData?.idMap?.[rawKey];
  // Meta-based resolvedId fallback (backend may report resolvedId different from original, e.g. ripple for xrp)
  let resolvedMetaId = null;
  try {
    const metaEntry = marketData?._meta?.find(m => m.id?.toLowerCase() === rawKey && m.type === 'crypto');
    if (metaEntry?.resolvedId) resolvedMetaId = metaEntry.resolvedId.toLowerCase();
  } catch {}
  const preferredCryptoKey = resolvedMetaId && marketData?.cryptos?.[resolvedMetaId] ? resolvedMetaId : mappedKey;
  const idKey = (preferredCryptoKey && (asset.type === 'crypto')) ? (marketData?.cryptos?.[preferredCryptoKey] ? preferredCryptoKey : rawKey) : rawKey;

  if (asset.type === 'stock' && marketData?.stocks?.[idKey]) {
    const stockData = marketData.stocks[idKey];
    return (typeof stockData.eur === 'number' ? stockData.eur : undefined) ?? asset.manualValue ?? asset.actualCost ?? 0;
  } else if (asset.type === 'crypto' && marketData?.cryptos?.[idKey]) {
    return (typeof marketData.cryptos[idKey].eur === 'number' ? marketData.cryptos[idKey].eur : undefined) ?? asset.manualValue ?? asset.actualCost ?? 0;
  } else if (asset.type === 'crypto') {
    // Si no hay precio, usar 0 como fallback
    return 0;
  }
  return asset.manualValue ?? asset.actualCost ?? 0;
}

// � Refactor: This page is now a temporary Asset Lookup & Projection tool (no persistence)
// Allows searching an asset (crypto or stock), viewing current price, recent price history
// and a simple projection of future value based on expected or historical annual return.

import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE } from '../shared/config';
import AssetSearchInput from '../features/investment/AssetSearchInput';
import { useAssetSearch } from '../features/investment/useAssetSearch';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatCurrency } from '../shared/formatCurrency';

export default function History() {
  // Selected asset info (id required)
  const [selectedAsset, setSelectedAsset] = useState(null); // react-select option
  const [assetType, setAssetType] = useState('Cryptos'); // 'Cryptos' | 'Stocks' | 'Others'
  // Fixed days window (API solo soporta <=30d actualmente)
  const days = 30;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [price, setPrice] = useState(null);
  const [history, setHistory] = useState([]); // [{date, price}]
  const [amount, setAmount] = useState(1000);
  const [years, setYears] = useState(5);
  const [expectedAnnualPct, setExpectedAnnualPct] = useState(''); // optional override
  const [performance, setPerformance] = useState(null); // {changes: { '24h':0.1, ... }} fractional
  const [cryptos, setCryptos] = useState([]); // for local fuzzy search

  // Load cryptos list (CoinGecko tickers) once
  useEffect(() => {
    fetch(`${API_BASE}/tickers`)
      .then(r => r.json())
      .then(data => setCryptos(data.cryptos || []))
      .catch(() => {});
  }, []);

  const {
    inputValue,
    filteredOptions,
    handleInputChange,
    setInputValue
  } = useAssetSearch(assetType, cryptos);

  // Clear selection when switching type
  useEffect(() => {
    setSelectedAsset(null);
    setInputValue('');
  }, [assetType, setInputValue]);

  // Derived metrics from history
  const { firstPrice, lastPrice, histAnnualReturn } = useMemo(() => {
    if (!history.length) return { firstPrice: null, lastPrice: null, histAnnualReturn: null };
    const first = history.find(p => p.price != null)?.price;
    const last = [...history].reverse().find(p => p.price != null)?.price;
    if (!first || !last) return { firstPrice: null, lastPrice: null, histAnnualReturn: null };
    const elapsedDays = history.filter(p => p.price != null).length; // approximate
    if (elapsedDays < 2) return { firstPrice: first, lastPrice: last, histAnnualReturn: null };
    const dailyFactor = Math.pow(last / first, 1 / (elapsedDays - 1));
    const annual = Math.pow(dailyFactor, 365) - 1;
    return { firstPrice: first, lastPrice: last, histAnnualReturn: annual };
  }, [history]);

  const effectiveAnnual = useMemo(() => {
    if (expectedAnnualPct !== '' && !isNaN(expectedAnnualPct)) return Number(expectedAnnualPct) / 100;
    return histAnnualReturn ?? 0;
  }, [expectedAnnualPct, histAnnualReturn]);

  const projectedValue = useMemo(() => {
    if (!amount || !years) return null;
    return amount * Math.pow(1 + effectiveAnnual, years);
  }, [amount, years, effectiveAnnual]);

  // Dynamic Y scale (adds padding around min/max; handles flat series)
  const yDomain = useMemo(() => {
    const prices = history.map(h => h.price).filter(v => v != null && !isNaN(v));
    if (!prices.length) return ['auto', 'auto'];
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) {
      const pad = min === 0 ? 1 : min * 0.02; // small pad
      return [min - pad, max + pad];
    }
  const range = max - min;
  // If very low volatility (<3% of price level), padding 1% del rango; si no 3%.
  const lowVol = (range / Math.max(1, min)) < 0.035;
  const padding = range === 0 ? (min === 0 ? 1 : min*0.01) : (lowVol ? range * 0.01 : range * 0.5);
  const lower = Math.max(0, min - padding);
  const upper = max + padding;
  return [lower, upper];
  }, [history]);

  async function fetchData() {
    if (!selectedAsset?.id) return;
    setLoading(true);
    setError(null);
    try {
      const backendType = assetType === 'Cryptos' ? 'crypto' : 'stock';
  // Crypto IDs must stay lowercase (CoinGecko). Stock symbols are case-sensitive; preserve original.
  const assetId = backendType === 'crypto' ? selectedAsset.id.toLowerCase() : selectedAsset.id;
      // 1. Current price via /market-data (POST expects array)
      const mdRes = await fetch(`${API_BASE}/market-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify([{ id: assetId, type: backendType }])
      });
  if (!mdRes.ok) throw new Error(`market-data error (${mdRes.status})`);
      const md = await mdRes.json();
  const group = backendType === 'crypto' ? md.cryptos : md.stocks;
  // For stocks we stored lowercase keys earlier; try both forms
  const entry = group?.[assetId] || group?.[assetId.toLowerCase?.()] || group?.[selectedAsset.id.toLowerCase?.()];
  // ...existing code...
      setPrice(entry?.eur ?? null);

      // 2. History
  // ...existing code...
  // Append bypass=1 to ensure backend doesn't accidentally route through protected middleware in future refactors
  const hRes = await fetch(`${API_BASE}/history?id=${encodeURIComponent(assetId)}&type=${backendType}&days=${days}&bypass=1`, { credentials: 'include', headers: { 'Accept': 'application/json' } });
  if (!hRes.ok) throw new Error(`history error (${hRes.status})`);
      const hd = await hRes.json();
      const hist = (hd.history || []).map(p => ({ date: p.date, price: p.price }));
      setHistory(hist);

      // 3. Performance metrics (parallelizable, but sequential here for simplicity)
      try {
  const pRes = await fetch(`${API_BASE}/performance?id=${encodeURIComponent(assetId)}&type=${backendType}`, { credentials: 'include' });
        if (pRes.ok) {
          const perf = await pRes.json();
          setPerformance(perf);
          // Autocomplete expected annual % only if empty (user hasn't typed) and 1y available
          if (perf?.changes?.['1y'] != null && expectedAnnualPct === '') {
            setExpectedAnnualPct((perf.changes['1y'] * 100).toFixed(2));
          }
        } else {
          setPerformance(null);
        }
      } catch { setPerformance(null); }
    } catch (e) {
  //    console.error(e);
      setError(e.message);
      setHistory([]);
      setPrice(null);
      setPerformance(null);
    } finally {
      setLoading(false);
    }
  }

  // Auto-fetch when selection changes (and we have enough info)
  useEffect(() => {
    if (selectedAsset?.id) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAsset, assetType]);

  // Manual search button removed: fetch occurs automatically when se selecciona un activo.

  function handleSelect(option) {
    if (!option) return;
  // Reset projection overrides so new asset can auto-populate its own 1y %
  setExpectedAnnualPct('');
  setPerformance(null);
  setHistory([]);
  setPrice(null);
  setSelectedAsset(option);
  }

  return (
    <div className="px-2 sm:px-4 py-3 sm:py-5 w-full max-w-none space-y-8">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Asset Lookup & Projection</h1>
        <p className="text-sm sm:text-base text-gray-600 mb-2">Consulta temporal de un activo y calcula una proyección.</p>
      </div>

  {/* Moved Market Summary to the top as requested */}
  <MarketSummary />

  <div className="grid gap-4 md:grid-cols-5 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
  <div className="md:col-span-2 lg:col-span-3 flex flex-col min-w-0">
          <label className="text-xs font-medium text-gray-600 mb-1">Buscar Activo</label>
          <AssetSearchInput
            assetType={assetType}
            setAssetType={setAssetType}
            inputValue={inputValue}
            filteredOptions={filteredOptions}
            handleInputChange={handleInputChange}
            onSelect={handleSelect}
          />
          {selectedAsset && (
            <p className="text-[11px] text-gray-500 mt-1">Seleccionado: {selectedAsset.label}</p>
          )}
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-600 mb-1">Amount (€)</label>
          <input type="number" min={0} value={amount} onChange={e => setAmount(Number(e.target.value))} className="px-3 py-2 rounded border" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-600 mb-1">Years</label>
            <input type="number" min={1} value={years} onChange={e => setYears(Number(e.target.value))} className="px-3 py-2 rounded border" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-600 mb-1">Expected Annual % (optional)</label>
          <input type="number" step="0.1" value={expectedAnnualPct} onChange={e => setExpectedAnnualPct(e.target.value)} className="px-3 py-2 rounded border" placeholder={histAnnualReturn ? (histAnnualReturn*100).toFixed(2) : ''} />
        </div>
      </div>

      {error && <div className="p-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>}

  <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm space-y-3 md:col-span-2 min-w-0">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Price History (30d)</h2>
            {loading && <span className="text-xs text-gray-500">Cargando...</span>}
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="date" hide={history.length > 60} tickFormatter={d => d.slice(5)} />
                <YAxis 
                  domain={yDomain}
                  width={70}
                  tickFormatter={v => {
                    if (v == null || isNaN(v)) return '';
                    // Use compact formatting for large values, more precision for small ranges
                    if (v >= 1000000) return '€' + (v/1_000_000).toFixed(2) + 'M';
                    if (v >= 1000) return '€' + (v/1000).toFixed(1) + 'K';
                    if (v >= 100) return '€' + v.toFixed(0);
                    if (v >= 10) return '€' + v.toFixed(2);
                    if (v >= 1) return '€' + v.toFixed(3);
                    return '€' + v.toExponential(2);
                  }}
                  allowDecimals
                />
                {/* <Tooltip formatter={v => formatCurrency(v)} labelFormatter={l => l} /> */}
                <Line type="monotone" dataKey="price" stroke="#2563eb" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Info label="First" value={formatCurrency(firstPrice)} />
            <Info label="Last" value={formatCurrency(lastPrice)} />
            <Info label="Hist. Annual" value={histAnnualReturn != null ? (histAnnualReturn*100).toFixed(2)+'%' : '-'} />
            <Info label="Current Price" value={formatCurrency(price)} />
          </div>
          {performance?.changes && (
            <div className="mt-3 border-t pt-3">
              <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-2">Performance</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
                {['24h','7d','30d','1y'].map(k => (
                  <PerfBadge key={k} label={k} value={performance.changes[k]} />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm space-y-3">
          <h2 className="font-semibold text-gray-800">Projection</h2>
          <ul className="text-sm space-y-1">
            <li><span className="text-gray-500">Effective Annual Return:</span> { (effectiveAnnual*100).toFixed(2) }%</li>
            <li><span className="text-gray-500">Initial Amount:</span> {formatCurrency(amount)}</li>
            <li><span className="text-gray-500">Years:</span> {years}</li>
            <li><span className="text-gray-500">Projected Value:</span> {projectedValue!=null? formatCurrency(projectedValue): '-'}</li>
          </ul>
          {histAnnualReturn!=null && expectedAnnualPct===''
            && <p className="text-xs text-gray-500">Usando retorno anual derivado del histórico mostrado (puedes sobrescribir).</p>}
        </div>
      </section>

      <section className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded text-xs text-gray-600 leading-relaxed">
        <p><strong>Nota:</strong> Esta página no guarda nada en tu cuenta. Todos los cálculos son simulaciones y se basan en datos recientes. La proyección es simplificada (capital único, compuesto anual).</p>
      </section>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
      <p className="font-medium text-gray-800 text-sm truncate">{value}</p>
    </div>
  );
}

function PerfBadge({ label, value }) {
  if (value == null) return <div className="px-2 py-1 rounded bg-gray-100 text-gray-400 text-center">{label}: -</div>;
  const pct = (value*100).toFixed(2);
  const positive = value >= 0;
  return (
    <div className={`px-2 py-1 rounded text-center font-medium ${positive? 'bg-green-50 text-green-700':'bg-red-50 text-red-600'}`}>
      {label}: {pct}%
    </div>
  );
}

// --- Market Summary Table ---
function MarketSummary() {
  const [rows, setRows] = React.useState([]);
  const [updatedAt, setUpdatedAt] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const load = React.useCallback(async (force = false) => {
    let url = `${API_BASE}/market-summary`;
    if (force) url += '?force=1';
    setLoading(true); setError(null);
    try {
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(`summary ${res.status}`);
      const json = await res.json();
      setUpdatedAt(json.updatedAt || null);
     // console.log('DEBUG MarketSummary API response:', json);
      const mapped = (json.assets||[]).map(a => ({
        segment: a.type,
        id: a.id,
        label: a.label || a.id,
        price: a.price,
        priceMeta: a.priceMeta || null,
        marketCap: a.marketCap,
        p7d: a.changes?.['7d'],
        p30d: a.changes?.['30d'],
        p1y: a.changes?.['1y']
      }));
    //  console.log('DEBUG MarketSummary mapped rows:', mapped);
      setRows(mapped);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => { load(false); }, [load]);

  return (
    <section className="space-y-3">
  <h3 className="text-sm font-semibold text-gray-800">Market Summary {updatedAt && <span className="ml-2 text-xs font-normal text-gray-400">(updated {new Date(updatedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})})</span>}</h3>
      {error && <div className="text-xs text-red-600">Error: {error}</div>}
      <div className="overflow-auto border rounded-lg bg-white shadow-sm">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50 border-b text-[11px] uppercase tracking-wide text-gray-500">
            <tr>
              <th className="text-left py-2 px-3 font-medium">Asset</th>
              <th className="text-right py-2 px-3 font-medium">Price</th>
              <th className="text-right py-2 px-3 font-medium">Market Cap</th>
              <th className="text-right py-2 px-3 font-medium">7d</th>
              <th className="text-right py-2 px-3 font-medium">30d</th>
              <th className="text-right py-2 px-3 font-medium">1y</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length===0 && (
              <tr><td colSpan={6} className="py-6 text-center text-gray-400">Cargando...</td></tr>
            )}
            {rows.map(r => (
              <tr key={r.segment + r.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="py-2 px-3 whitespace-nowrap">
                  <span className="text-gray-700 font-medium">{r.label}</span>
                  <span className="ml-1 text-[10px] text-gray-400">{r.segment}</span>
                </td>
                <td className="py-2 px-3 text-right font-medium tabular-nums">
                  {r.price!=null? (
                    <div className="flex flex-col items-end">
                      <div>{formatSummaryPrice(r.id, r.price)}</div>
                      {r.priceMeta?.provider && (
                        <span className="text-[10px] text-gray-400">{r.priceMeta.source==='cache'?'cache / ':''}{r.priceMeta.provider}</span>
                      )}
                    </div>
                  ) : '–'}
                </td>
                <td className="py-2 px-3 text-right tabular-nums text-gray-700">{r.marketCap!=null? formatMarketCap(r.marketCap): '–'}</td>
                <PctCell value={r.p7d} />
                <PctCell value={r.p30d} />
                <PctCell value={r.p1y} bold />
              </tr>
            ))}
            {!loading && rows.length===0 && (
              <tr><td colSpan={6} className="py-6 text-center text-gray-400">Sin datos</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatShortCurrency(v){
  if (v==null || isNaN(v)) return '–';
  if (v>=1_000_000) return '€'+(v/1_000_000).toFixed(2)+'M';
  if (v>=1000) return '€'+(v/1000).toFixed(1)+'K';
  if (v>=100) return '€'+v.toFixed(0);
  if (v>=10) return '€'+v.toFixed(2);
  if (v>=1) return '€'+v.toFixed(3);
  return '€'+v.toFixed(5);
}

// Summary price formatting: all assets with 2 decimals, except Cardano (very small) with 5
function formatSummaryPrice(id, v) {
  if (v == null || isNaN(v)) return '–';
  const decimals = id && id.toLowerCase() === 'cardano' ? 5 : 2;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(v);
}

function formatMarketCap(v){
  if (v==null || isNaN(v)) return '–';
  if (v >= 1_000_000_000_000) return '€'+(v/1_000_000_000_000).toFixed(2)+'T';
  if (v >= 1_000_000_000) return '€'+(v/1_000_000_000).toFixed(2)+'B';
  if (v >= 1_000_000) return '€'+(v/1_000_000).toFixed(2)+'M';
  if (v >= 1_000) return '€'+(v/1000).toFixed(1)+'K';
  return '€'+v.toFixed(2);
}

function PctCell({ value, bold }) {
  const cls = value==null ? 'text-gray-400' : value>=0 ? 'text-green-600' : 'text-red-600';
  const fw = bold ? ' font-semibold' : '';
  return <td className={`py-2 px-3 text-right tabular-nums ${cls}${fw}`}>{value==null? '–' : (value*100).toFixed(2)+'%'}</td>;
}

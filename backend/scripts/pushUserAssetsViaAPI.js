// Script para cargar activos en el usuario usando el endpoint /user-data

const fetch = require('node-fetch');

const API_URL = 'http://localhost:3001/api/user-data'; // Cambia si tu backend está en otro puerto o dominio
const userEmail = 'oliver-marque@hotmail.com';
const userPassword = 'Oliver123';

// Utilidad para buscar nombre de cripto en coingecko-tickers.json
const fs = require('fs');
const path = require('path');
const coingeckoTickers = JSON.parse(fs.readFileSync(path.join(__dirname, '../coingecko-tickers.json'), 'utf8'));

function getCryptoName(symbol) {
  symbol = symbol.toLowerCase();
  const found = coingeckoTickers.find(t => t.symbol.toLowerCase() === symbol);
  return found ? found.name : symbol.toUpperCase();
}

// Utilidad para stocks: usar ISIN como nombre si no hay fuente
function getStockName(isin) {
  // Si tienes un archivo de fondos/acciones, puedes integrar una búsqueda real aquí
  return isin;
}

const investments = [
  { name: 'Vanguard Glb Stk Idx Ins Pl € Acc', id: '0P00011HBM.F', symbol: '0P00011HBM.F', initialQty: 15.87, initialCost: 367.505356, type: 'stock', initialDate: '2025-03-01', group: 'INDEXA', initialCurrency: 'EUR' },
  { name: 'iShares Physical Gold ETC (IGLN.L)', id: 'IGLN.L', symbol: 'IGLN.L', initialQty: 51, initialCost: 54.15666667, type: 'stock', initialDate: '2025-03-01', group: 'DEGIRO', initialCurrency: 'USD' },
  { name: 'VanEck Gold Miners UCITS ETF (GDX.L)', id: 'GDX.L', symbol: 'GDX.L', initialQty: 50, initialCost: 46.2548, type: 'stock', initialDate: '2025-03-01', group: 'DEGIRO' , initialCurrency: 'USD' },
  { name: 'iShares € Corp Bond Large Cap UCITS ETF EUR (Dist) (IBCX.AS)', id: 'IBCX.AS', symbol: 'IBCX.AS', initialQty: 9, initialCost: 124.3255556, type: 'stock', initialDate: '2025-03-01', group: 'DEGIRO' , initialCurrency: 'EUR' },
  { name: 'Nasdaq', id: 'QQQ', symbol: 'QQQ', initialQty: 3, initialCost: 463.35, type: 'stock', initialDate: '2025-03-01', group: 'DEGIRO' , initialCurrency: 'USD' },
  { name: 'ARK Innovation UCITS ETF USD Acc ETF', id: 'ARXK.DE', symbol: 'ARXK.DE', initialQty: 37, initialCost: 6.52, type: 'stock', initialDate: '2025-03-01', group: 'DEGIRO' , initialCurrency: 'EUR' },
  { name: 'iShares Edge MSCI World Momentum Factor UCITS ETF (Acc)', id: 'IWMO.L', symbol: 'IWMO.L', initialQty: 13, initialCost: 76.34384615, type: 'stock', initialDate: '2025-03-01', group: 'DEGIRO' , initialCurrency: 'USD' },
  { name: 'VanEck Semiconductor UCITS ETF', id: 'SMH.L', symbol: 'SMH.L', initialQty: 31, initialCost: 41.23903226, type: 'stock', initialDate: '2025-03-01', group: 'DEGIRO' , initialCurrency: 'USD' },
  { name: 'Lithium Argentina AG', id: 'LAR.TO', symbol: 'LAR.TO', initialQty: 301, initialCost: 2.22, type: 'stock', initialDate: '2025-03-01', group: 'DEGIRO' , initialCurrency: 'CAD' },
  { name: 'NVIDIA Corporation', id: 'NVDA', symbol: 'NVDA', initialQty: 2, initialCost: 149.36, type: 'stock', initialDate: '2025-03-01', group: 'DEGIRO' , initialCurrency: 'USD' },
  { name: 'Vanguard U.S. 500 Stk Idx Ins Pl € Acc', id: '0P00011HBK.F', symbol: '0P00011HBK.F', initialQty: 9.344465115, initialCost: 467.7380006, type: 'stock', initialDate: '2025-03-01', group: 'FINIZENS' , initialCurrency: 'EUR' },
  { name: 'Vanguard €pean Stk Idx Ins Pl € Acc', id: '0P00011HBL.F', symbol: '0P00011HBL.F', initialQty: 11.18274569, initialCost: 232.2221736, type: 'stock', initialDate: '2025-03-01', group: 'FINIZENS' , initialCurrency: 'EUR' },
  { name: 'Vanguard Em Mkts Stk Idx Ins Pl € Acc', id: '0P00011HBQ.F', symbol: '0P00011HBQ.F', initialQty: 8.677869232, initialCost: 188.3558069, type: 'stock', initialDate: '2025-03-01', group: 'FINIZENS' , initialCurrency: 'EUR' },
  { name: 'BTC', id: 'BTC', symbol: 'BTC', initialQty: 0.02337991, initialCost: 94993.0945, type: 'crypto', initialDate: '2025-03-01', group: 'BINANCE' },
  { name: 'XRP', id: 'XRP', symbol: 'XRP', initialQty: 156.662155, initialCost: 2.529583485, type: 'crypto', initialDate: '2025-03-01', group: 'BINANCE' },
  { name: 'Official Trump', id: 'Official Trump', symbol: 'TRUMP', initialQty: 35.382121, initialCost: 10.07316661, type: 'crypto', initialDate: '2025-03-01', group: 'BINANCE' },
  { name: 'ETH', id: 'ETH', symbol: 'ETH', initialQty: 0.1399669, initialCost: 3690.586846, type: 'crypto', initialDate: '2025-03-01', group: 'BINANCE' }
];

// Agrupa las inversiones por el campo 'group'
function groupInvestmentsByGroup(investments) {
  const grouped = {};
  for (const inv of investments) {
    const groupName = inv.group || 'General';
    if (!grouped[groupName]) grouped[groupName] = [];
    grouped[groupName].push(inv);
  }
  return grouped;
}

const payload = {
  Investments: groupInvestmentsByGroup(investments),
  RealEstate: {},
  Others: {}
};

async function pushAssets() {
  try {
  // Login para obtener el token
    const loginRes = await fetch('http://localhost:3001/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: userEmail, password: userPassword })
    });
    const loginData = await loginRes.json();
    const token = loginData.accessToken;
    if (!token) {
      return;
    }
  // Enviar los activos usando el token
    const payload = {
      data: {
        Investments: groupInvestmentsByGroup(investments),
        RealEstate: {},
        Others: {}
      }
    };
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const responseData = await res.json();
  // No console output, just return result
  } catch (error) {
    // Silently fail
  }
}
  // Ejecutar la función principal
  pushAssets();

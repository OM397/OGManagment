// 📁 frontend/src/features/assets/AssetCard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { getCurrentPrice } from '../../../shared/getCurrentPrice';
import useInvestmentsIRR from '../../shared/hooks/useInvestmentsIRR';
import { ChevronDown, ChevronUp, MoreVertical } from 'lucide-react';
import { useCategoryGroups } from '../../shared/context/CategoryGroupsContext';
import { formatCurrency } from '../../shared/formatCurrency';
import { calculateRealEstateNetValue } from '../../shared/utils';

export default function AssetCard({
  asset,
  marketData,
  exchangeRates,
  onDelete,
  activeTab,
  groupName,
  assetIndex,
  isHighlighted = false,
  cardKey
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [editCost, setEditCost] = useState(asset.initialCost || 0);
  const [editQty, setEditQty] = useState(asset.initialQty || 0);
  const [editDate, setEditDate] = useState(asset.initialDate || '');
  const [editActual, setEditActual] = useState(asset.manualValue ?? asset.actualCost ?? 0);
  const [editMode, setEditMode] = useState(false);
  const [highlight, setHighlight] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const { setCategoryGroups } = useCategoryGroups();
  const cardRef = useRef(null);
  const didScrollRef = useRef(false);
  const didRefetchRef = useRef(false);

  const { name, id, initialQty, initialCost, type: assetType, manualValue, initialDate } = asset;

  // Solo para Investments: obtener IRR por id
  const showIRR = activeTab === 'Investments';
  const type = assetType || 'manual';
  const initialValue = (initialCost || 0) * (initialQty || 0);
  const currentPrice = getCurrentPrice(asset, marketData);
  const actualValue = (currentPrice || 0) * (initialQty || 0);

  // Calcular valor neto para Real Estate
  let netValue = actualValue;
  let remainingMortgage = 0;
  if (activeTab === 'Real Estate' && asset.mortgageAmount) {
    const netValueData = calculateRealEstateNetValue(asset, actualValue);
    netValue = netValueData.netValue;
    remainingMortgage = netValueData.remainingMortgage;
  }

  // Fallback IRR (decimal) if API returns undefined/null. Uses current price and initial date.
  const fallbackIRRDecimal = (() => {
    try {
      if (!initialDate) return null;
      const initVal = (initialCost || 0) * (initialQty || 0);
      const currVal = (initialQty || 0) * (currentPrice || 0);
      if (!isFinite(initVal) || initVal <= 0 || !isFinite(currVal) || currVal <= 0) return null;
      const start = new Date(initialDate);
      const end = new Date();
      const years = (end - start) / (365.25 * 24 * 60 * 60 * 1000);
      if (!isFinite(years) || years <= 0) return null;
      const ratio = currVal / initVal;
      const irrDec = Math.pow(ratio, 1 / years) - 1;
      return isFinite(irrDec) ? irrDec : null;
    } catch (_) {
      return null;
    }
  })();

  const { irr: irrData, loading: loadingIRR, refetch: refetchIRR } = useInvestmentsIRR();
  // Corrige el error: irr debe ser el valor para el asset actual
  let irr = irrData && id ? irrData[id] : undefined;
  // Si irr no es un número válido, usar fallbackIRRDecimal
  if (irr === undefined || irr === null || isNaN(irr)) {
    irr = fallbackIRRDecimal;
  }
  // Si sigue sin ser válido, mostrar '-'
  const displayIRR = (typeof irr === 'number' && isFinite(irr)) ? `${(irr * 100).toFixed(2)}%` : '-';


    // Fix: Define wasConverted and stockCurrency for stock assets
    let wasConverted = false;
    let stockCurrency = '';
    if (type === 'stock' && marketData && asset.id) {
      const stockData = marketData.stocks?.[asset.id?.toLowerCase()];
      if (stockData && stockData.currency && stockData.currency !== 'EUR') {
        wasConverted = true;
        stockCurrency = stockData.currency;
      }
    }

  // Auto-scroll ONCE when opening to avoid fighting user scroll
  useEffect(() => {
    if (isOpen && !didScrollRef.current) {
      didScrollRef.current = true;
      setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 350);
    }
    if (!isOpen) {
      didScrollRef.current = false;
    }
  }, [isOpen]);

  // Refetch IRR once per open if missing
  useEffect(() => {
    if (isOpen) {
      if (showIRR && irr === undefined && !didRefetchRef.current) {
        didRefetchRef.current = true;
        refetchIRR();
      }
    } else {
      didRefetchRef.current = false;
    }
  }, [isOpen, showIRR, irr, refetchIRR]);

  useEffect(() => {
    if (isHighlighted) {
      setHighlight(true);
      const timer = setTimeout(() => setHighlight(false), 3000);
      return () => clearTimeout(timer);
    } else {
      // Clear highlight immediately when isHighlighted becomes false
      setHighlight(false);
    }
  }, [isHighlighted]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openMenu && !e.target.closest('.asset-options-menu')) {
        setOpenMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenu]);

  const handleSave = () => {
    const parsedCost = parseFloat(editCost);
    const parsedQty = parseFloat(editQty);
    const parsedActual = parseFloat(editActual);

    if (isNaN(parsedCost) || isNaN(parsedQty) || parsedCost <= 0 || parsedQty <= 0) {
      alert('Valores inválidos.');
      return;
    }

    if (type === 'manual' && (isNaN(parsedActual) || parsedActual <= 0)) {
      alert('Actual value inválido.');
      return;
    }

    // This is the only part needed. The context handles the API call automatically.
    setCategoryGroups(prev => {
      const updated = { ...prev };
      const groups = updated[activeTab] || {};
      const group = groups[groupName] || [];
      
      if (group[assetIndex]) {
        group[assetIndex] = {
          ...group[assetIndex],
          initialCost: parsedCost,
          initialQty: parsedQty,
          initialDate: editDate,
          ...(type === 'manual' && { manualValue: parsedActual })
        };
        
        groups[groupName] = group;
        updated[activeTab] = groups;
      }
      
      return updated;
    });

    setEditMode(false);
    
    // Refrescar la TIR tras guardar cambios
    setTimeout(() => {
      refetchIRR();
    }, 1200); // Aumentar delay para asegurar que el guardado se complete
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      assetIndex,
      groupName,
      asset,
      activeTab
    }));
    
    // Visual feedback for drag start
    e.currentTarget.style.opacity = '0.6';
    e.currentTarget.style.transform = 'scale(0.95)';
  };

  const handleDragEnd = (e) => {
    // Reset visual state
    e.currentTarget.style.opacity = '';
    e.currentTarget.style.transform = '';
  };

  // Generate a unique key for the card using name, initialDate, groupName, and assetIndex
  const uniqueCardKey = `${asset.name || ''}_${initialDate || ''}_${groupName || ''}_${assetIndex}`;

  return (
    <div
      key={uniqueCardKey}
      ref={cardRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        group shadow-sm border rounded-lg px-4 md:px-5 py-4 mb-3 select-none 
        transition-all duration-300 relative overflow-visible min-h-[60px] cursor-grab active:cursor-grabbing
        ${highlight 
          ? 'bg-yellow-50 border-yellow-200 hover:shadow-md' 
          : 'bg-white border-gray-100 hover:bg-gray-50 hover:shadow-md hover:border-gray-200'
        }
      `}
    >
      <div
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center cursor-pointer gap-3"
        onClick={() => setIsOpen(prev => !prev)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-medium text-gray-900 truncate">{asset.name}</h3>
              {/* Si quieres mostrar la moneda, deberías obtenerla desde marketData.stocks[id]?.currency si es necesario. Ahora la lógica es unificada y no se usa stockCurrency. */}
            </div>
            <div className="text-xs text-gray-500">
              {type === 'manual' ? 'Manual' : type === 'crypto' ? 'Crypto' : 'Stock'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center justify-end gap-3 ml-auto text-right w-full sm:w-auto">
          {/* Valor bruto y neto para Real Estate */}
          {activeTab === 'Real Estate' && asset.mortgageAmount ? (
            <div className="text-right">
              <div className="text-base font-medium text-gray-900">
                {formatCurrency((actualValue || 0).toFixed(2))}
                <span className="text-xs text-gray-500 ml-2">(Bruto)</span>
              </div>
              <div className="text-sm font-medium text-blue-600">
                {formatCurrency((netValue || 0).toFixed(2))}
                <span className="text-xs text-gray-500 ml-2">(Neto)</span>
              </div>
            </div>
          ) : (
          <div className="text-base font-medium text-gray-900">
            {formatCurrency((actualValue || 0).toFixed(2))}
          </div>
          )}
          
          <div className={`text-sm font-medium ${((actualValue || 0) >= (initialValue || 0) ? 'text-green-600' : 'text-red-600')}`}> 
            {formatCurrency(((actualValue || 0) - (initialValue || 0)).toFixed(2))} 
            ({(initialValue > 0 ? (((actualValue || 0) - (initialValue || 0)) / (initialValue || 1)) * 100 : 0).toFixed(1)}%)
          </div>

          <div className="flex items-center gap-3">
            <div className="text-gray-500">
              {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
            <div className="relative asset-options-menu" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setOpenMenu(prev => !prev)}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-md hover:bg-gray-100 transition-colors"
                title="Opciones del activo"
              >
                <MoreVertical size={18} />
              </button>
              {openMenu && (
                <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => {
                      setEditMode(true);
                      setOpenMenu(false);
                      setIsOpen(true);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg transition-colors"
                  >
                    Editar inversión
                  </button>
                  <button
                    onClick={() => {
                      setOpenMenu(false);
                      onDelete();
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-b-lg transition-colors"
                  >
                    Eliminar inversión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isOpen && (
        <>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div>
              <div className="text-gray-500 text-sm font-medium mb-2">Initial Cost</div>
              {editMode ? (
                <input
                  type="number"
                  value={editCost}
                  onChange={(e) => setEditCost(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                />
              ) : (
                <div className="text-gray-900 font-medium">{formatCurrency((initialCost || 0).toFixed(2))}</div>
              )}
            </div>

            <div>
              <div className="text-gray-500 text-sm font-medium mb-2">Initial Qty</div>
              {editMode ? (
                <input
                  type="number"
                  value={editQty}
                  onChange={(e) => setEditQty(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                />
              ) : (
                <div className="text-gray-900 font-medium">{initialQty || 0}</div>
              )}
            </div>

            <div>
              <div className="text-gray-500 text-sm font-medium mb-2">Initial Value</div>
              <div className="text-gray-900 font-medium">{formatCurrency((initialValue || 0).toFixed(2))}</div>
            </div>

            <div>
              <div className="text-gray-500 text-sm font-medium mb-2">Current Price</div>
              {editMode && type === 'manual' ? (
                <input
                  type="number"
                  value={editActual}
                  onChange={(e) => setEditActual(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                />
              ) : (
                <div className="group relative w-fit">
                  <span className="text-gray-900 font-medium">
                    {formatCurrency((currentPrice || 0).toFixed(2))}
                  </span>
                  {type === 'stock' && wasConverted && (
                    <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded shadow z-10">
                      Convertido desde {stockCurrency}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="text-gray-500 text-sm font-medium mb-2">Current Qty</div>
              <div className="text-gray-900 font-medium">{initialQty || 0}</div>
            </div>

            <div>
              <div className="text-gray-500 text-sm font-medium mb-2">Actual Value</div>
              <div className="text-gray-900 font-medium">{formatCurrency((actualValue || 0).toFixed(2))}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-sm text-gray-600 mt-4">
            {/* Campos específicos para Real Estate - ORDEN CAMBIADO */}
            {activeTab === 'Real Estate' && asset.mortgageAmount && (
              <div>
                <div className="text-gray-500 text-sm font-medium mb-2">Mortgage Amount</div>
                <div className="text-gray-900 font-medium">{formatCurrency(asset.mortgageAmount.toFixed(2))}</div>
              </div>
            )}

            {activeTab === 'Real Estate' && asset.monthlyMortgagePayment && (
              <div>
                <div className="text-gray-500 text-sm font-medium mb-2">Monthly Mortgage</div>
                <div className="text-gray-900 font-medium">{formatCurrency(asset.monthlyMortgagePayment.toFixed(2))}</div>
              </div>
            )}

            {activeTab === 'Real Estate' && asset.monthlyRentalIncome && (
              <div>
                <div className="text-gray-500 text-sm font-medium mb-2">Monthly Rental</div>
                <div className="text-gray-900 font-medium">{formatCurrency(asset.monthlyRentalIncome.toFixed(2))}</div>
              </div>
            )}

            {/* Hipoteca restante para Real Estate */}
            {activeTab === 'Real Estate' && asset.mortgageAmount && (
              <div>
                <div className="text-gray-500 text-sm font-medium mb-2">Remaining Mortgage</div>
                <div className="text-gray-900 font-medium">{formatCurrency(remainingMortgage.toFixed(2))}</div>
              </div>
            )}

            {/* Initial Date - AHORA COMO ÚLTIMO */}
            <div>
              <div className="text-gray-500 text-sm font-medium mb-2">Initial Date</div>
              {editMode ? (
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                />
              ) : (
                <div>
                  <div className="text-gray-900 font-medium">{initialDate || '-'}</div>
                  {showIRR && (
                    <div className="mt-1 text-xs">
                      <span className="font-semibold">TIR: </span>
                      {loadingIRR ? (
                        <span className="text-gray-400">Calculando...</span>
                      ) : (
                        <span className={irr > 0 ? 'text-green-600' : irr < 0 ? 'text-red-600' : 'text-gray-600'}>
                          {displayIRR}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Día de actualización mensual para Real Estate */}
            {activeTab === 'Real Estate' && asset.monthlyUpdateDay && (
              <div>
                <div className="text-gray-500 text-sm font-medium mb-2">Monthly Update Day</div>
                <div className="text-gray-900 font-medium">{asset.monthlyUpdateDay}</div>
              </div>
            )}
          </div>

          {editMode && (
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setEditMode(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
              >
                Guardar
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

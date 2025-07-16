// 📁 frontend/src/features/assets/AssetCard.jsx
import React, { useState, useEffect } from 'react';
import useInvestmentsIRR from './useInvestmentsIRR';
import { formatter } from '../../shared/utils';
import { ChevronDown, ChevronUp, MoreVertical } from 'lucide-react';
import { useCategoryGroups } from '../../shared/context/CategoryGroupsContext';
import { formatCurrency } from '../../shared/formatCurrency';

export default function AssetCard({
  asset,
  marketData,
  exchangeRates,
  onDelete,
  activeTab,
  groupName,
  assetIndex,
  isHighlighted
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [editCost, setEditCost] = useState(asset.initialCost);
  const [editQty, setEditQty] = useState(asset.initialQty);
  const [editDate, setEditDate] = useState(asset.initialDate || '');
  const [editActual, setEditActual] = useState(asset.manualValue ?? asset.actualCost ?? 0);
  const [editMode, setEditMode] = useState(false);
  const [highlight, setHighlight] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const { setCategoryGroups } = useCategoryGroups();

  const { name, id, initialQty, initialCost, type: assetType, manualValue, initialDate } = asset;

  // Solo para Investments: obtener IRR por id
  const showIRR = activeTab === 'Investments';
  const { irr: irrData, loading: loadingIRR, refetch: refetchIRR } = useInvestmentsIRR();
  const irr = irrData?.[id]?.irr;

  const type = assetType || (
    marketData?.cryptos?.[id?.toLowerCase()] ? 'crypto' :
    marketData?.stocks?.[id?.toLowerCase()] ? 'stock' : 'manual'
  );

  const priceSource = type === 'crypto' ? marketData.cryptos : marketData.stocks;
  const sourceData = priceSource?.[id?.toLowerCase()];
  const marketPrice = sourceData?.eur ?? 0;

  const actualPrice = type === 'manual' ? manualValue ?? 0 : marketPrice;
  const stockCurrency = sourceData?.currency;
  const wasConverted = stockCurrency && stockCurrency !== 'EUR';

  const initialValue = initialQty * initialCost;
  const actualValue = initialQty * actualPrice;

  useEffect(() => {
    if (isHighlighted) {
      setIsOpen(true);
      setHighlight(true);
      const timeout = setTimeout(() => setHighlight(false), 1000);
      return () => clearTimeout(timeout);
    }
  }, [isHighlighted]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.asset-options-menu')) {
        setOpenMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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

    setCategoryGroups(prev => {
      const updated = { ...prev };
      const asset = updated[activeTab][groupName][assetIndex];
      asset.initialCost = parsedCost;
      asset.initialQty = parsedQty;
      asset.initialDate = editDate;
      if (type === 'manual') {
        asset.manualValue = parsedActual;
      }
      // Persist actualValue (EUR) for backend IRR calculation
      asset.actualValue = actualValue;
      asset.actualValueEUR = actualValue;
      return updated;
    });

    setEditMode(false);
    // Refrescar la TIR tras guardar cambios
    setTimeout(() => {
      refetchIRR();
    }, 300);
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      assetIndex,
      groupName,
      asset,
      activeTab
    }));
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`shadow-sm px-5 py-3 mb-3 select-none transition-colors duration-500 relative overflow-visible min-h-[48px] ${
        highlight ? 'bg-yellow-100' : 'bg-white'
      }`}
    >
      <div
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center cursor-pointer gap-2"
        onClick={() => setIsOpen(prev => !prev)}
      >
        <div className="font-medium capitalize text-sm">{name}</div>

        <div className="flex flex-wrap sm:flex-nowrap items-center justify-end gap-3 ml-auto text-right">
          <div className="text-sm font-semibold">{formatCurrency(actualValue)}</div>
          <div
            className={`px-2 py-0.5 border text-xs font-medium ${
              actualValue - initialValue >= 0
                ? 'bg-green-50 text-green-600 border-green-100'
                : 'bg-red-50 text-red-600 border-red-100'
            }`}
          >
            {actualValue - initialValue >= 0 ? '+' : ''}
            {formatCurrency(actualValue - initialValue)}
          </div>

          <div className="flex items-center gap-2">
            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <div className="relative asset-options-menu" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setOpenMenu(prev => !prev)}
                className="text-gray-600 hover:text-gray-800"
                title="Opciones del activo"
              >
                <MoreVertical size={16} />
              </button>
              {openMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-white border rounded shadow z-10">
                  <button
                    onClick={() => {
                      setEditMode(true);
                      setOpenMenu(false);
                      setIsOpen(true);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-black"
                  >
                    Editar inversión
                  </button>
                  <button
                    onClick={() => {
                      setOpenMenu(false);
                      onDelete();
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-red-100 text-red-600"
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
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-sm text-gray-600">
            <div>
              <div className="text-gray-400">Initial Cost</div>
              {editMode ? (
                <input
                  type="number"
                  value={editCost}
                  onChange={(e) => setEditCost(e.target.value)}
                  className="w-full border-b border-gray-300 focus:outline-none"
                />
              ) : (
                <div>{formatCurrency(initialCost.toFixed(2))}</div>
              )}
            </div>

            <div>
              <div className="text-gray-400">Initial Qty</div>
              {editMode ? (
                <input
                  type="number"
                  value={editQty}
                  onChange={(e) => setEditQty(e.target.value)}
                  className="w-full border-b border-gray-300 focus:outline-none"
                />
              ) : (
                <div>{initialQty}</div>
              )}
            </div>

            <div>
              <div className="text-gray-400">Initial Value</div>
              <div>{formatCurrency(initialValue)}</div>
            </div>

            <div>
              <div className="text-gray-400">Actual Cost</div>
              {editMode && type === 'manual' ? (
                <input
                  type="number"
                  value={editActual}
                  onChange={(e) => setEditActual(e.target.value)}
                  className="w-full border-b border-gray-300 focus:outline-none"
                />
              ) : (
                <div className="group relative w-fit">
                  <span>{formatCurrency(actualPrice.toFixed(2))}</span>
                  {type === 'stock' && wasConverted && (
                    <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded shadow z-10">
                      Convertido desde {stockCurrency}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="text-gray-400">Actual Qty</div>
              <div>{initialQty}</div>
            </div>

            <div>
              <div className="text-gray-400">Actual Value</div>
              <div>{formatCurrency(actualValue)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-sm text-gray-600 mt-4">
            <div>
              <div className="text-gray-400">Initial Date</div>
              {editMode ? (
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full border-b border-gray-300 focus:outline-none"
                />
              ) : (
                <div>
                  {initialDate || '-'}
                  {showIRR && (
                    <div className="mt-1 text-xs">
                      <span className="font-semibold">TIR: </span>
                      {loadingIRR ? (
                        <span className="text-gray-400">Calculando...</span>
                      ) : irr !== undefined && irr !== null ? (
                        <span className={irr > 0 ? 'text-green-600' : irr < 0 ? 'text-red-600' : 'text-gray-600'}>
                          {(irr * 100).toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {editMode && (
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setEditMode(false)}
                className="px-4 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
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

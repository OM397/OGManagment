import React, { useState, useEffect } from 'react';
import { useCategoryGroups } from '../../shared/context/CategoryGroupsContext';
import AssetSearchInput from './AssetSearchInput';
import { useAssetSearch } from './useAssetSearch';
import InvestmentFormFields from './InvestmentFormFields';

export default function InvestmentForm({
  activeTab,
  onClose,
  showInline,
  setLastAddedAssetId
}) {
  const { categoryGroups, setCategoryGroups } = useCategoryGroups();
  const [formData, setFormData] = useState({
    name: '',
    id: '',
    quantity: '',
    cost: '',
    actualCost: '',
    group: '',
    initialDate: ''
  });
  const [cryptos, setCryptos] = useState([]);
  const [assetType, setAssetType] = useState('Cryptos');

  useEffect(() => {
    fetch('/api/tickers')
      .then(res => res.json())
      .then(data => setCryptos(data.cryptos))
      .catch(err => console.error('❌ Error loading tickers', err));
  }, []);

  const {
    inputValue,
    filteredOptions,
    handleInputChange,
    setInputValue
  } = useAssetSearch(assetType, cryptos);

  useEffect(() => {
    setInputValue('');
    setFormData(f => ({ ...f, name: '', id: '' }));
  }, [activeTab, assetType]);


  const handleAdd = () => {
    const { name, id, quantity, cost, actualCost, group, initialDate } = formData;
    if (!name || !quantity || !cost || !group) {
      alert('All fields are required.');
      return;
    }
    const qty   = parseFloat(quantity);
    const price = parseFloat(cost);
    const actual= parseFloat(actualCost);

    if (isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0) {
      alert('Quantity and cost must be valid positive numbers.');
      return;
    }
    // Normaliza la clave del tab
    const normalizedTab = activeTab === 'RealEstate' ? 'Real Estate' : activeTab;
    const isInv = normalizedTab === 'Investments';
    if (!isInv && (isNaN(actual) || actual <= 0)) {
      alert('Actual value is required for non-investments.');
      return;
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const newAsset = {
      name,
      id: isInv
        ? (assetType === 'Cryptos' || assetType === 'Stocks' ? (id || slug) : slug)
        : slug,
      ...(assetType === 'Cryptos' || assetType === 'Stocks' ? { symbol: formData.value || formData.symbol || '' } : {}),
      initialQty:  qty,
      initialCost: price,
      type: !isInv || assetType === 'Others'
        ? 'manual'
        : (assetType === 'Cryptos' ? 'crypto' : 'stock')
    };

    // si es inversión normal y hay fecha, la guardamos
    if (isInv && assetType !== 'Others' && initialDate) {
      newAsset.initialDate = initialDate;
    }
    // si es manual u Others, actual = initial
    if (!isInv || assetType === 'Others') {
      newAsset.manualValue = price;
    }

    setCategoryGroups(prev => {
      const updated = { ...prev };
      const groups  = updated[normalizedTab] || {};
      const assets  = groups[group] || [];
      groups[group] = [...assets, newAsset];
      updated[normalizedTab] = groups;
      // LOG: Asset añadido
      console.log(`[InvestmentForm.jsx] Asset añadido en '${normalizedTab}' grupo '${group}':`, newAsset);
      console.log('[InvestmentForm.jsx] Estado tras añadir asset:', updated);
      return updated;
    });

    if (setLastAddedAssetId) setLastAddedAssetId(newAsset.id);

    setFormData({
      name: '', id: '', quantity: '',
      cost: '', actualCost: '', group: '', initialDate: ''
    });
    if (!showInline) onClose();
  };

  const handleSelectAsset = option => {
    if (!option) return;
    // Always prefer the human-readable name, never fallback to label unless nothing else exists
    let assetName = option.name || option.description || '';
    if (!assetName && option.label) {
      // If label is just the code, ignore it
      assetName = option.label;
    }
    setFormData(f => ({
      ...f,
      name: assetName,
      id:   option.id || option.value || '',
      symbol: option.symbol || option.value || ''
    }));
  };

  const renderAssetInput = () => {
    if (activeTab === 'Investments') {
      return assetType === 'Others'
        ? (
          <input
            className="border px-2 py-1 w-full rounded"
            placeholder="Asset Name"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
        )
        : (
          <AssetSearchInput
            assetType={assetType}
            setAssetType={setAssetType}
            inputValue={inputValue}
            filteredOptions={filteredOptions}
            handleInputChange={handleInputChange}
            onSelect={handleSelectAsset}
          />
        );
    }
    // tab Real Estate / Others global
    return (
      <input
        className="border px-2 py-1 w-full rounded"
        placeholder="Asset Name"
        value={formData.name}
        onChange={e => setFormData({ ...formData, name: e.target.value })}
      />
    );
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <h3 className="font-bold mb-2 text-gray-800">New Investment</h3>

      <div className="mb-2">{renderAssetInput()}</div>

      <InvestmentFormFields
        activeTab={activeTab}
        formData={formData}
        setFormData={setFormData}
        categoryGroups={categoryGroups}
        assetType={assetType}
      />

      {activeTab === 'Investments' && assetType !== 'Others' && (
        <div className="mb-2">
          <label className="block text-sm text-gray-600 mb-1">
            Initial Date (optional)
          </label>
          <input
            type="date"
            className="border px-2 py-1 w-full rounded"
            value={formData.initialDate}
            onChange={e => setFormData({ ...formData, initialDate: e.target.value })}
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 justify-end mt-4">
        <button
          onClick={handleAdd}
          className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded transition w-full sm:w-auto"
        >
          Add
        </button>
        {!showInline && (
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition w-full sm:w-auto"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
);
}

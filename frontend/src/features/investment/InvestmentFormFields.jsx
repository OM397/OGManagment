import React from 'react';

export default function InvestmentFormFields({
  activeTab,
  formData,
  setFormData,
  categoryGroups,
  assetType    // ya se lo pasamos desde InvestmentForm
}) {
  return (
    <>
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 mb-3">
        <input
          className="border px-2 py-2 rounded w-full sm:w-36 flex-grow min-w-0"
          placeholder="Quantity"
          type="number"
          min="0.01"
          step="0.01"
          value={formData.quantity}
          onChange={e => setFormData({ ...formData, quantity: e.target.value })}
        />

        <input
          className="border px-2 py-2 rounded w-full sm:w-44 flex-grow min-w-0"
          placeholder="Purchase Price (€)"
          type="number"
          min="0.01"
          step="0.01"
          value={formData.cost}
          onChange={e => setFormData({ ...formData, cost: e.target.value })}
        />

        {/* actualCost sólo si no estamos en Investments */}
        {activeTab !== 'Investments' && (
          <input
            className="border px-2 py-2 rounded w-full sm:w-44 flex-grow min-w-0"
            placeholder="Actual Value (€)"
            type="number"
            min="0.01"
            step="0.01"
            value={formData.actualCost}
            onChange={e => setFormData({ ...formData, actualCost: e.target.value })}
          />
        )}
      </div>

      <select
        className="border px-2 py-2 rounded w-full mb-4"
        value={formData.group}
        onChange={e => setFormData({ ...formData, group: e.target.value })}
      >
        <option value="">Select Group</option>
        {Object.keys(categoryGroups[activeTab] || {}).map(group => (
          <option key={group} value={group}>
            {group}
          </option>
        ))}
      </select>
    </>
  );
}

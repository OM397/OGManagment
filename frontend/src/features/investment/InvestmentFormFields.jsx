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

      {/* Campos específicos para Real Estate */}
      {activeTab === 'Real Estate' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
          <input
            className="border px-2 py-2 rounded w-full"
            placeholder="Mortgage Amount (€)"
            type="number"
            min="0"
            step="0.01"
            value={formData.mortgageAmount || ''}
            onChange={e => setFormData({ ...formData, mortgageAmount: e.target.value })}
          />
          
          <input
            className="border px-2 py-2 rounded w-full"
            placeholder="Monthly Mortgage Payment (€)"
            type="number"
            min="0"
            step="0.01"
            value={formData.monthlyMortgagePayment || ''}
            onChange={e => setFormData({ ...formData, monthlyMortgagePayment: e.target.value })}
          />
          
          <input
            className="border px-2 py-2 rounded w-full"
            placeholder="Monthly Rental Income (€)"
            type="number"
            min="0"
            step="0.01"
            value={formData.monthlyRentalIncome || ''}
            onChange={e => setFormData({ ...formData, monthlyRentalIncome: e.target.value })}
          />
        </div>
      )}

      {/* Campo de fecha para Real Estate */}
      {activeTab === 'Real Estate' && (
        <div className="mb-3">
          <label className="block text-sm text-gray-600 mb-1">
            Initial Date (optional)
          </label>
          <input
            type="date"
            className="border px-2 py-2 rounded w-full"
            value={formData.initialDate}
            onChange={e => setFormData({ ...formData, initialDate: e.target.value })}
          />
        </div>
      )}

      {/* Campo de día de actualización mensual para Real Estate */}
      {activeTab === 'Real Estate' && (
        <div className="mb-3">
          <label className="block text-sm text-gray-600 mb-1">
            Monthly Update Day (1-31)
          </label>
          <input
            type="number"
            min="1"
            max="31"
            className="border px-2 py-2 rounded w-full"
            placeholder="5"
            value={formData.monthlyUpdateDay || ''}
            onChange={e => setFormData({ ...formData, monthlyUpdateDay: e.target.value })}
          />
        </div>
      )}

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

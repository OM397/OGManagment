import React from 'react';

export default function ToggleInvestmentButton({ showAddInvestment, setShowAddInvestment }) {
  return (
    <button
      type="button"
      onClick={() => setShowAddInvestment(prev => !prev)}
      className="bg-gray-900 hover:bg-black text-white px-3 py-1 rounded transition"
    >
      {showAddInvestment ? 'Cancel' : 'Add Investment'}
    </button>
  );
}

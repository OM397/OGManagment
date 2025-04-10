//useCategoryGroups.js
import { useState } from 'react';

const defaultInitialState = {
  Investments: {
    ExampleGroup: [
      {
        name: 'ethereum',
        id: 'ethereum',
        initialQty: 1,
        initialCost: 2000
      }
    ]
  },
  'Real Estate': {},
  Others: {}
};

export default function useCategoryGroups() {
  const [categoryGroups, setCategoryGroups] = useState(defaultInitialState);
  const [showAddInvestment, setShowAddInvestment] = useState(false);

  return {
    categoryGroups,
    setCategoryGroups,
    showAddInvestment,
    setShowAddInvestment
  };
}

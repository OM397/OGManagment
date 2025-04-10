import React from 'react';
import Select from 'react-select';

export default function AssetSearchInput({
  assetType,
  setAssetType,
  inputValue,
  filteredOptions,
  handleInputChange,
  onSelect
}) {
  return (
    <div className="flex gap-2 items-center">
      <select
        className="border px-2 py-1 rounded bg-white text-gray-800"
        value={assetType}
        onChange={e => setAssetType(e.target.value)}
      >
        <option value="Cryptos">Cryptos</option>
        <option value="Stocks">Stocks</option>
      </select>

      <div className="flex-1">
        <Select
          placeholder="Search asset..."
          onInputChange={handleInputChange}
          options={filteredOptions}
          inputValue={inputValue}
          onChange={onSelect}
          isSearchable
          menuIsOpen={inputValue.length >= 2}
        />
      </div>
    </div>
  );
}

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
    <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
      <select
        className="border px-2 py-2 rounded bg-white text-gray-800 w-full sm:w-auto"
        value={assetType}
        onChange={e => setAssetType(e.target.value)}
      >
        <option value="Cryptos">Cryptos</option>
        <option value="Stocks">Stocks</option>
        <option value="Others">Others</option>
      </select>

      {assetType !== 'Others' && (
        <div className="flex-1 min-w-0">
          <Select
            placeholder="Search asset..."
            onInputChange={handleInputChange}
            options={filteredOptions}
            inputValue={inputValue}
            onChange={onSelect}
            isSearchable
            menuIsOpen={inputValue.length >= 2}
            styles={{
              container: base => ({ ...base, width: '100%' }),
              control:   base => ({ ...base, minHeight: '42px' })
            }}
          />
        </div>
      )}
    </div>
  );
}

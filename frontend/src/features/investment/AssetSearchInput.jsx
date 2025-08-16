import React from 'react';
// Fallback plain implementation (react-select temporarily removed due to input bug)
import { useEffect, useState, useRef } from 'react';

export default function AssetSearchInput({
  assetType,
  setAssetType,
  // inputValue no longer controls the Select (uncontrolled to fix single-char issue)
  inputValue,
  filteredOptions,
  handleInputChange,
  onSelect
}) {
  const DEBUG = false;
  const [localValue, setLocalValue] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    if (DEBUG) console.debug('[AssetSearchInput] mount assetType=', assetType);
    return () => { if (DEBUG) console.debug('[AssetSearchInput] unmount'); };
  }, [assetType]);
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
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
          <div className="relative" ref={menuRef}>
            <div className="flex items-center border rounded focus-within:ring-1 focus-within:ring-blue-500 bg-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400 ml-2 mr-1">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 103.473 9.8l3.863 3.864a.75.75 0 101.06-1.06l-3.864-3.863A5.5 5.5 0 009 3.5zM4.5 9a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0z" clipRule="evenodd" />
              </svg>
        <input
                className="flex-1 px-1 py-2 outline-none text-sm bg-transparent"
                placeholder="Type to search..."
                value={localValue}
                onChange={(e) => {
                  const v = e.target.value;
                  setLocalValue(v);
                  handleInputChange(v);
          setShowMenu(true);
                }}
              />
              {!localValue && <div className="pr-2 text-[10px] text-gray-400">min 2 chars</div>}
            </div>
            {showMenu && localValue.length >= 2 && filteredOptions.length > 0 && (
              <ul className="absolute left-0 right-0 mt-1 max-h-56 overflow-auto border rounded bg-white shadow z-30 divide-y">
                {filteredOptions.slice(0,50).map(opt => (
                  <li key={opt.value || opt.id}
                      className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50"
                      onMouseDown={(e) => { e.preventDefault(); }}
                      onClick={() => {
                        onSelect(opt);
                        setLocalValue(opt.label);
                        setShowMenu(false);
                      }}>
                    {opt.label}
                  </li>
                ))}
                {filteredOptions.length === 0 && <li className="px-3 py-2 text-xs text-gray-500">No results</li>}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

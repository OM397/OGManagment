import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, MoreVertical } from 'lucide-react';
import { formatter } from '../../shared/utils';
import { formatCurrency } from '../../shared/formatCurrency';

export default function GroupHeader({
  groupName,
  isOpen,
  isHighlighted,
  actualValue,
  initialValue,
  change,
  changeColor,
  openMenu,
  setOpenMenu,
  onToggleGroup,
  onRenameGroup,
  onDeleteGroup,
  allGroupNames
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(groupName);
  const inputRef = useRef();

  const highlightClass = isHighlighted ? 'bg-yellow-100' : 'bg-gray-50';

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleRename = () => {
    const trimmed = newName.trim();
    const nameExists = allGroupNames?.includes(trimmed);

    if (!trimmed || trimmed === groupName) {
      setIsEditing(false);
      setNewName(groupName);
      return;
    }

    if (nameExists) {
      alert('Ya existe un grupo con ese nombre.');
      return;
    }

    onRenameGroup(groupName, trimmed);
    setIsEditing(false);
  };

  return (
    <div
      onClick={() => onToggleGroup(groupName)}
      className={`flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-2 sm:gap-4 cursor-pointer ${highlightClass} shadow-sm px-5 py-2 text-sm font-medium transition-colors duration-500`}
    >
      <div className="capitalize flex-1">
        {isEditing ? (
          <input
            ref={inputRef}
            value={newName}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') {
                setIsEditing(false);
                setNewName(groupName);
              }
            }}
            onBlur={handleRename}
            className="px-2 py-1 text-sm border rounded w-full"
          />
        ) : (
          groupName
        )}
      </div>

      <div className="flex flex-wrap items-start sm:items-center gap-4 justify-between w-full sm:w-auto">
        <div className="flex flex-col items-end text-right">
          <div className="text-sm font-bold">{formatCurrency(actualValue)}</div>
          <div className="text-xs text-gray-400">vs {formatCurrency(initialValue)}</div>
        </div>

        <div className="flex flex-col items-end text-xs font-medium">
          <div className={`px-2 py-0.5 mb-0.5 border ${
            change >= 0
              ? 'bg-green-50 text-green-600 border-green-100'
              : 'bg-red-50 text-red-600 border-red-100'
          }`}>
            {change >= 0 ? '+' : ''}
            {formatCurrency(actualValue - initialValue)}
          </div>
          <div className={changeColor}>{change.toFixed(2)}%</div>
        </div>

        <div className="flex items-center">
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>

        <div className="relative group-options-menu">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenu(openMenu === groupName ? null : groupName);
            }}
            className="text-gray-600 hover:text-gray-800"
            title="Opciones del grupo"
          >
            <MoreVertical size={16} />
          </button>
          {openMenu === groupName && (
            <div
              className="absolute right-0 mt-1 min-w-max bg-white border rounded shadow z-10 group-options-menu text-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setIsEditing(true);
                  setOpenMenu(null);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-black"
              >
                Renombrar grupo
              </button>
              <button
                onClick={() => {
                  setOpenMenu(null);
                  onDeleteGroup(groupName);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-black"
              >
                Eliminar grupo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

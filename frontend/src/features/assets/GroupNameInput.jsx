import React, { useState, useRef } from 'react';

export default function GroupNameInput({ onAddGroup }) {
  const [newGroupName, setNewGroupName] = useState('');
  const lastAddedRef = useRef(null);

  const handleAdd = () => {
    const name = newGroupName.trim();
    if (!name || lastAddedRef.current === name) return;
    lastAddedRef.current = name;

    onAddGroup(name);
    setNewGroupName('');
  };

  return (
    <>
      <input
        className="border px-2 py-1 rounded bg-gray-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400"
        placeholder="New Group Name"
        value={newGroupName}
        onChange={e => setNewGroupName(e.target.value)}
      />
      <button
        type="button"
        onClick={handleAdd}
        className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-1 rounded transition"
      >
        Add Group
      </button>
    </>
  );
}

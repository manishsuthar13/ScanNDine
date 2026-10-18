import React, { useState } from 'react';
import { TextField, Badge } from '../ui';
import { useRestaurantSearch } from '../../hooks/useSuperadmin';
import { TEXT } from '../../constants/text';

// Find an existing restaurant by name and pick it
const RestaurantPicker = ({ selected, onSelect }) => {
  const [query, setQuery] = useState('');
  const results = useRestaurantSearch(selected ? '' : query);

  if (selected) {
    return (
      <div className="mb-4 flex items-center gap-2">
        <Badge tone="accent">{selected.name}</Badge>
        <button type="button" onClick={() => onSelect(null)} className="text-xs font-semibold text-primary">{TEXT.common.remove}</button>
      </div>
    );
  }
  return (
    <div className="mb-4">
      <TextField className="mb-1" placeholder={TEXT.superadmin.searchRestaurant} aria-label={TEXT.superadmin.searchRestaurant} value={query} onChange={(e) => setQuery(e.target.value)} />
      <ul className="overflow-hidden rounded-xl bg-canvas">
        {results.map((r) => (
          <li key={r._id}>
            <button type="button" onClick={() => onSelect(r)} className="block w-full px-4 py-2 text-left text-sm hover:bg-primary/10">{r.name}</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RestaurantPicker;

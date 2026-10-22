import { AREAS, CATEGORIES } from '../data/taxonomy';
import type { Area, Category } from '../data/types';
import type { DeckFilter } from '../lib/deck';

export function FilterBar({ value, onChange, showCategory = true }: { value: DeckFilter; onChange: (f: DeckFilter) => void; showCategory?: boolean }) {
  return (
    <div className="filter-bar">
      <label>
        <span>Area</span>
        <select value={value.area} onChange={(e) => onChange({ ...value, area: e.target.value as Area | 'all', category: 'all' })}>
          <option value="all">Mixed (all areas)</option>
          {(Object.keys(AREAS) as Area[]).map((a) => (
            <option key={a} value={a}>
              {AREAS[a]}
            </option>
          ))}
        </select>
      </label>
      {showCategory && (
        <label>
          <span>Topic</span>
          <select value={value.category} onChange={(e) => onChange({ ...value, category: e.target.value as Category | 'all' })}>
            <option value="all">All topics</option>
            {(Object.keys(CATEGORIES) as Category[]).map((c) => (
              <option key={c} value={c}>
                {CATEGORIES[c]}
              </option>
            ))}
          </select>
        </label>
      )}
      <label>
        <span>Difficulty</span>
        <select value={String(value.difficulty)} onChange={(e) => onChange({ ...value, difficulty: e.target.value === 'all' ? 'all' : (Number(e.target.value) as 1 | 2 | 3) })}>
          <option value="all">All levels</option>
          <option value="1">Foundational</option>
          <option value="2">Moderate</option>
          <option value="3">Challenging</option>
        </select>
      </label>
    </div>
  );
}

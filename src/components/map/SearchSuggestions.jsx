import { useMemo } from 'react';
import { Search, MapPin } from 'lucide-react';
import { getPoolListKey } from '../../utils/poolKey';
import { poolMatchesQuery } from '../../utils/poolSearch';
import './SearchSuggestions.css';

const MAX_SUGGESTIONS = 12;

function buildSuggestions(pools, term) {
  const q = term.trim();
  if (!q) return [];

  const matches = [];
  for (const pool of pools) {
    if (poolMatchesQuery(pool, q)) {
      matches.push(pool);
      if (matches.length >= MAX_SUGGESTIONS) break;
    }
  }
  return matches;
}

// 매칭된 부분을 <mark>로 강조
function highlight(text, term) {
  const q = term.trim();
  if (!q) return text;

  const lower = text.toLowerCase();
  const lowerQ = q.toLowerCase();
  const parts = [];
  let start = 0;
  let idx = lower.indexOf(lowerQ, start);

  while (idx !== -1) {
    if (idx > start) parts.push({ text: text.slice(start, idx), match: false });
    parts.push({ text: text.slice(idx, idx + q.length), match: true });
    start = idx + q.length;
    idx = lower.indexOf(lowerQ, start);
  }
  if (start < text.length) parts.push({ text: text.slice(start), match: false });

  return parts.map((part, i) =>
    part.match ? (
      <mark key={i} className="search-suggestions__mark">
        {part.text}
      </mark>
    ) : (
      <span key={i}>{part.text}</span>
    ),
  );
}

function SearchSuggestions({ draft, pools, onPick }) {
  const suggestions = useMemo(
    () => buildSuggestions(pools, draft),
    [pools, draft],
  );

  const hasDraft = draft.trim().length > 0;

  return (
    <div className="search-suggestions" role="listbox" aria-label="연관 검색어">
      {!hasDraft ? (
        <p className="search-suggestions__hint">
          수영장 이름이나 지역을 입력해 보세요
        </p>
      ) : suggestions.length === 0 ? (
        <p className="search-suggestions__hint">
          '{draft.trim()}'에 대한 추천 검색어가 없어요
        </p>
      ) : (
        <ul className="search-suggestions__list">
          {suggestions.map((pool) => (
            <li key={getPoolListKey(pool)}>
              <button
                type="button"
                className="search-suggestions__item"
                onClick={() => onPick(pool)}
                role="option"
                aria-selected={false}
              >
                <Search
                  className="search-suggestions__icon"
                  size={18}
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="search-suggestions__text">
                  <span className="search-suggestions__name">
                    {highlight(pool.name ?? '', draft)}
                  </span>
                  {pool.address && (
                    <span className="search-suggestions__address">
                      <MapPin size={12} strokeWidth={2.5} aria-hidden />
                      {highlight(pool.address, draft)}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SearchSuggestions;

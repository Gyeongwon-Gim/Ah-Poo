import { useState } from 'react';
import { Search, X, ChevronLeft } from 'lucide-react';
import './SearchBar.css';

function SearchBar({
  onSearch,
  appliedSearchTerm = '',
  resultCount,
  totalCount,
  searching,
  variant = 'default',
  listView = false,
  nearbyMode = false,
  nearbyRadiusKm = 10,
  locationPending = false,
}) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(inputValue.trim());
  };

  const handleClear = () => {
    setInputValue('');
    onSearch('');
  };

  const hasDraft = inputValue.trim() !== appliedSearchTerm.trim();

  return (
    <div
      className={`search-bar-wrap ${variant === 'map' ? 'search-bar-wrap--map' : ''} ${listView ? 'search-bar-wrap--list' : ''}`}
    >
      <div className="search-bar-container">
        <form className="search-bar" onSubmit={handleSubmit}>
          {listView ? (
            <button
              type="button"
              onClick={handleClear}
              className="search-back"
              aria-label="뒤로 가기"
            >
              <ChevronLeft size={22} strokeWidth={2.5} />
            </button>
          ) : (
            <Search
              className="search-icon"
              size={20}
              strokeWidth={2.5}
              aria-hidden
            />
          )}
          <input
            type="search"
            enterKeyHint="search"
            placeholder="드디어 주말! 수영하러 가볼까요?"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="search-input"
            aria-label="수영장 검색"
          />
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="search-clear"
              aria-label="검색어 지우기"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          )}
        </form>
        {!searching && totalCount > 0 && listView && (
          <p className="search-meta">검색 결과 {resultCount}건</p>
        )}
      </div>
    </div>
  );
}

export default SearchBar;

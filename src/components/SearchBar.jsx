import { useState } from 'react';
import { Search, X } from 'lucide-react';
import './SearchBar.css';

function SearchBar({
  onSearch,
  appliedSearchTerm = '',
  resultCount,
  totalCount,
  searching,
  variant = 'default',
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
      className={`search-bar-wrap ${variant === 'map' ? 'search-bar-wrap--map' : ''}`}
    >
      <div className="search-bar-container">
        <form className="search-bar" onSubmit={handleSubmit}>
          <Search
            className="search-icon"
            size={20}
            strokeWidth={2.5}
            aria-hidden
          />
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
              <X size={18} />
            </button>
          )}
        </form>
        {!searching && totalCount > 0 && (
          <p className="search-meta">
            {hasDraft
              ? 'Enter를 눌러 검색'
              : appliedSearchTerm.trim()
                ? `검색 결과 ${resultCount}건`
                : locationPending
                  ? '내 위치 확인 중…'
                  : nearbyMode
                    ? `내 주변 ${nearbyRadiusKm}km · ${resultCount}개`
                    : `전체 ${totalCount}개 수영장`}
          </p>
        )}
      </div>
    </div>
  );
}

export default SearchBar;

import { useRef } from 'react';
import { Search, X, ChevronLeft } from 'lucide-react';
import './SearchBar.css';

function SearchBar({
  value = '',
  onValueChange,
  onSearch,
  onActivate,
  onClose,
  variant = 'default',
  searchMode = false,
}) {
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    inputRef.current?.blur();
    onSearch?.(value.trim());
  };

  const handleClear = () => {
    onValueChange?.('');
    inputRef.current?.focus();
  };

  const handleBack = () => {
    inputRef.current?.blur();
    onClose?.();
  };

  return (
    <div
      className={`search-bar-wrap ${variant === 'map' ? 'search-bar-wrap--map' : ''} ${searchMode ? 'search-bar-wrap--search' : ''}`}
    >
      <div className="search-bar-container">
        <form className="search-bar" onSubmit={handleSubmit}>
          {searchMode ? (
            <button
              type="button"
              onClick={handleBack}
              className="search-back"
              aria-label="검색 닫기"
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
            ref={inputRef}
            type="search"
            enterKeyHint="search"
            placeholder="드디어 주말! 수영하러 가볼까요?"
            value={value}
            onChange={(e) => onValueChange?.(e.target.value)}
            onFocus={() => onActivate?.()}
            className="search-input"
            aria-label="수영장 검색"
          />
          {value && (
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
      </div>
    </div>
  );
}

export default SearchBar;

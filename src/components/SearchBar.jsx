import { useEffect, useRef, useState } from 'react';
import { Search, X, ChevronLeft } from 'lucide-react';
import { disableInputAccessoryView } from '../utils/disableInputAccessoryView';
import { setIosKeyboardInputFocused } from '../utils/iosKeyboardScrollLock';
import './SearchBar.css';

const LOGO_TEXT = 'Ah-Poo!';
const LOGO_CHAR_DELAY_MS = 380;

function SearchBarLogo() {
  const [length, setLength] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (reducedMotion) {
      setLength(LOGO_TEXT.length);
      setShowCursor(false);
      return undefined;
    }

    let index = 0;
    const typeTimer = window.setInterval(() => {
      index += 1;
      setLength(index);
      if (index >= LOGO_TEXT.length) {
        window.clearInterval(typeTimer);
        window.setTimeout(() => setShowCursor(false), 700);
      }
    }, LOGO_CHAR_DELAY_MS);

    return () => window.clearInterval(typeTimer);
  }, []);

  return (
    <div className="search-bar-logo" role="img" aria-label={LOGO_TEXT}>
      <img
        src="/icon.svg"
        alt=""
        className="search-bar-logo__mark"
        aria-hidden="true"
        draggable={false}
      />
      <span className="search-bar-logo__word">
        {LOGO_TEXT.slice(0, length)}
        {showCursor && (
          <span className="search-bar-logo__cursor" aria-hidden="true">
            |
          </span>
        )}
      </span>
    </div>
  );
}

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

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return undefined;
    return disableInputAccessoryView(input);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch?.(value.trim());
    inputRef.current?.blur();
  };

  const handleClear = () => {
    onValueChange?.('');
    inputRef.current?.focus();
  };

  const handleBack = () => {
    inputRef.current?.blur();
    onClose?.();
  };

  const isMapVariant = variant === 'map';
  const showLogo = isMapVariant && !searchMode;

  return (
    <div
      className={`search-bar-wrap ${isMapVariant ? 'search-bar-wrap--map search-bar-wrap--browser' : ''} ${searchMode ? 'search-bar-wrap--search' : ''} ${showLogo ? 'search-bar-wrap--with-logo' : ''}`}
    >
      {showLogo && <SearchBarLogo />}
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
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="어푸어푸! 수영하러 가볼까요?"
            value={value}
            onChange={(e) => onValueChange?.(e.target.value)}
            onFocus={() => {
              setIosKeyboardInputFocused(true);
              onActivate?.();
            }}
            onBlur={() => setIosKeyboardInputFocused(false)}
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

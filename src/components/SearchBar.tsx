import { useEffect, useRef } from 'react';
import { Search, X, ChevronLeft } from 'lucide-react';
import SearchBarLogo from './SearchBarLogo';
import { Button, Input } from './ui';
import { disableInputAccessoryView } from '../utils/disableInputAccessoryView';
import { setIosKeyboardInputFocused } from '../utils/iosKeyboardScrollLock';
import './SearchBar.css';

interface SearchBarProps {
  value?: string;
  onValueChange?: (value: string) => void;
  onSearch?: (term: string) => void;
  onActivate?: () => void;
  onClose?: () => void;
  variant?: 'default' | 'map';
  searchMode?: boolean;
}

export default function SearchBar({
  value = '',
  onValueChange,
  onSearch,
  onActivate,
  onClose,
  variant = 'default',
  searchMode = false,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return undefined;
    return disableInputAccessoryView(input);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
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
      <form className="search-bar-container" onSubmit={handleSubmit}>
        <Input
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
          aria-label="수영장 검색"
          variant={isMapVariant ? 'pill' : 'default'}
          bordered={searchMode}
          wrapClassName="search-bar"
          leading={
            searchMode ? (
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                aria-label="검색 닫기"
              >
                <ChevronLeft size={22} strokeWidth={2.5} />
              </Button>
            ) : (
              <Search size={20} strokeWidth={2.5} aria-hidden />
            )
          }
          trailing={
            value ? (
              <button
                type="button"
                onClick={handleClear}
                aria-label="검색어 지우기"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            ) : undefined
          }
        />
      </form>
    </div>
  );
}

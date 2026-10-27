import { useEffect, useRef } from 'react';
import { Search, X, ChevronLeft, User } from 'lucide-react';
import SearchBarLogo from '@/pages/Explore/components/SearchBarLogo';
import { Button, Input } from '@/components';
import { disableInputAccessoryView } from '@/utils/disableInputAccessoryView';
import { setIosKeyboardInputFocused } from '@/utils/iosKeyboardScrollLock';
import './SearchBar.css';

interface SearchBarProps {
  value?: string;
  onValueChange?: (value: string) => void;
  onSearch?: (term: string) => void;
  onActivate?: () => void;
  onClose?: () => void;
  variant?: 'default' | 'map';
  searchMode?: boolean;
  onAccountClick?: () => void;
}

const STATIC_INPUT_PROPS = {
  type: 'search',
  enterKeyHint: 'search',
  autoComplete: 'off',
  autoCorrect: 'off',
  spellCheck: false,
  placeholder: '어푸어푸! 수영하러 가볼까요?',
  'aria-label': '수영장 검색',
  wrapClassName: 'search-bar',
} as const;

const SearchBar = ({
  value = '',
  onValueChange,
  onSearch,
  onActivate,
  onClose,
  variant = 'default',
  searchMode = false,
  onAccountClick,
}: SearchBarProps) => {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange?.(e.target.value);
  };

  const handleFocus = () => {
    setIosKeyboardInputFocused(true);
    onActivate?.();
  };

  const handleBlur = () => {
    setIosKeyboardInputFocused(false);
  };

  const isMapVariant = variant === 'map';
  const showLogo = isMapVariant && !searchMode;

  const leading = searchMode ? (
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
  );

  const trailing = value ? (
    <button type="button" onClick={handleClear} aria-label="검색어 지우기">
      <X size={18} strokeWidth={2.5} />
    </button>
  ) : undefined;

  return (
    <div
      className={`search-bar-wrap ${isMapVariant ? 'search-bar-wrap--map search-bar-wrap--browser' : ''} ${searchMode ? 'search-bar-wrap--search' : ''} ${showLogo ? 'search-bar-wrap--with-logo' : ''}`}
    >
      {showLogo && <SearchBarLogo />}
      <div className="search-bar-row">
        <form className="search-bar-container" onSubmit={handleSubmit}>
          <Input
            ref={inputRef}
            {...STATIC_INPUT_PROPS}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            variant={isMapVariant ? 'pill' : 'default'}
            bordered={searchMode}
            leading={leading}
            trailing={trailing}
          />
        </form>
        {onAccountClick && (
          <Button
            type="button"
            variant="icon"
            className="search-bar-account"
            onClick={onAccountClick}
            aria-label="계정"
          >
            <User size={18} strokeWidth={1.75} />
          </Button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;

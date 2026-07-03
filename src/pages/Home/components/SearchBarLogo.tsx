import { useEffect, useState } from 'react';

const LOGO_TEXT = 'Ah-Poo!';
const LOGO_CHAR_DELAY_MS = 380;

export default function SearchBarLogo() {
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

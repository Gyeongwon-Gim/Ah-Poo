import { useState, useCallback, type ReactNode } from 'react';
import '../styles/page-transitions.css';

const EXIT_MS = 320;

interface PageSheetRenderProps {
  onClose: () => void;
}

interface PageSheetProps {
  children: ReactNode | ((props: PageSheetRenderProps) => ReactNode);
  onClose: () => void;
}

export default function PageSheet({ children, onClose }: PageSheetProps) {
  const [exiting, setExiting] = useState(false);

  const handleClose = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    setTimeout(() => {
      onClose();
    }, EXIT_MS);
  }, [exiting, onClose]);

  return (
    <>
      <div
        className={`page-backdrop ${exiting ? 'page-backdrop--exit' : ''}`}
        onClick={handleClose}
        onKeyDown={(e) => e.key === 'Escape' && handleClose()}
        role="presentation"
        aria-hidden
      />
      <div
        className={`page-sheet ${exiting ? 'page-sheet--exit' : ''}`}
        role="dialog"
        aria-modal="true"
      >
        {typeof children === 'function'
          ? children({ onClose: handleClose })
          : children}
      </div>
    </>
  );
}

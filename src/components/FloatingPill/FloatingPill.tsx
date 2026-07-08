import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { List } from 'lucide-react';
import './FloatingPill.css';

export type FloatingPillProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode;
  className?: string;
  icon?: ReactNode;
};

export default function FloatingPill({
  children = '목록 열기',
  className = '',
  type = 'button',
  icon,
  ...rest
}: FloatingPillProps) {
  return (
    <button
      type={type}
      className={['floating-pill', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {icon ?? <List size={15} strokeWidth={2.2} aria-hidden />}
      <span>{children}</span>
    </button>
  );
}

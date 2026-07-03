import type { HTMLAttributes } from 'react';
import './Tag.css';

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'active';
}

export default function Tag({
  variant = 'default',
  className = '',
  children,
  ...rest
}: TagProps) {
  const cls = [
    'pf-tag',
    variant === 'active' ? 'pf-tag--active' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={cls} {...rest}>
      {children}
    </span>
  );
}

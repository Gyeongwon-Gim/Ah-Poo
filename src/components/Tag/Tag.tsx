import type { HTMLAttributes } from 'react';
import './Tag.css';

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'highlight';
}

export default function Tag({
  variant = 'default',
  className = '',
  children,
  ...rest
}: TagProps) {
  const cls = [
    'ap-tag',
    variant === 'highlight' ? 'ap-tag--highlight' : '',
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

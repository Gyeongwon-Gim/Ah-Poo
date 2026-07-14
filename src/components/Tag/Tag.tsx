import type { HTMLAttributes } from 'react';
import './Tag.css';

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'highlight' | 'status';
  /** variant="status"일 때 온(on) 상태 스타일 적용 */
  active?: boolean;
  /** variant="status"일 때 상태 표시 동그라미 표시 */
  dot?: boolean;
}

export default function Tag({
  variant = 'default',
  active = false,
  dot = false,
  className = '',
  children,
  ...rest
}: TagProps) {
  const cls = [
    'ap-tag',
    variant === 'highlight' ? 'ap-tag--highlight' : '',
    variant === 'status' ? 'ap-tag--status' : '',
    variant === 'status' && active ? 'ap-tag--on' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={cls} {...rest}>
      {dot && <span className="ap-tag__dot" aria-hidden />}
      {children}
    </span>
  );
}

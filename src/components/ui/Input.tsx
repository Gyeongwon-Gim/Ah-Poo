import type { InputHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';
import './Input.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'pill';
  bordered?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  wrapClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    variant = 'default',
    bordered = false,
    leading,
    trailing,
    wrapClassName = '',
    className = '',
    ...rest
  },
  ref,
) {
  const wrapCls = [
    'pf-input-wrap',
    variant === 'pill' ? 'pf-input-wrap--pill' : '',
    bordered ? 'pf-input-wrap--bordered' : '',
    wrapClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapCls}>
      {leading && <span className="pf-input__leading">{leading}</span>}
      <input ref={ref} className={`pf-input ${className}`.trim()} {...rest} />
      {trailing && <span className="pf-input__trailing">{trailing}</span>}
    </div>
  );
});

export default Input;

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
    'ap-input-wrap',
    variant === 'pill' ? 'ap-input-wrap--pill' : '',
    bordered ? 'ap-input-wrap--bordered' : '',
    wrapClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapCls}>
      {leading && <span className="ap-input__leading">{leading}</span>}
      <input ref={ref} className={`ap-input ${className}`.trim()} {...rest} />
      {trailing && <span className="ap-input__trailing">{trailing}</span>}
    </div>
  );
});

export default Input;

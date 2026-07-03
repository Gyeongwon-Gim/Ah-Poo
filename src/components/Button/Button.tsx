import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react';
import './Button.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon';
type ButtonSize = 'sm' | 'md';

type BaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  active?: boolean;
  favorite?: boolean;
  className?: string;
  children?: ReactNode;
};

type ButtonAsButton = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { as?: 'button' };

type ButtonAsAnchor = BaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { as: 'a' };

export type ButtonProps = ButtonAsButton | ButtonAsAnchor;

function buildClassName({
  variant = 'primary',
  size = 'md',
  active,
  favorite,
  className = '',
}: BaseProps) {
  return [
    'pf-button',
    `pf-button--${variant}`,
    variant !== 'icon' && variant !== 'ghost' ? `pf-button--${size}` : '',
    active ? 'pf-button--active' : '',
    favorite ? 'pf-button--favorite' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

export default function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    active,
    favorite,
    className,
    children,
    as,
    ...rest
  } = props;

  const cls = buildClassName({ variant, size, active, favorite, className });

  if (as === 'a') {
    const anchorProps = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a className={cls} {...anchorProps}>
        {children}
      </a>
    );
  }

  const buttonProps = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button type="button" className={cls} {...buttonProps}>
      {children}
    </button>
  );
}

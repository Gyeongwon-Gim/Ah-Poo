import type {
  ButtonHTMLAttributes,
  AnchorHTMLAttributes,
  ReactNode,
} from 'react';
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
    'ap-button',
    `ap-button--${variant}`,
    variant !== 'icon' && variant !== 'ghost' ? `ap-button--${size}` : '',
    active ? 'ap-button--active' : '',
    favorite ? 'ap-button--favorite' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

const Button = (props: ButtonProps) => {
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
};

export default Button;

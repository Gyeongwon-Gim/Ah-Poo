import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import './BottomSheet.css';

export type BottomSheetVariant = 'list' | 'detail';

type BottomSheetStateProps = {
  dragging?: boolean;
  ready?: boolean;
  instant?: boolean;
  inert?: boolean;
  revealing?: boolean;
  softSheet?: boolean;
  expanded?: boolean;
  collapsed?: boolean;
};

function buildRootClassName({
  variant,
  dragging,
  ready,
  instant,
  inert,
  revealing,
  softSheet,
  expanded,
  collapsed,
  className = '',
}: BottomSheetStateProps & {
  variant: BottomSheetVariant;
  className?: string;
}) {
  return [
    'bottom-sheet',
    `bottom-sheet--${variant}`,
    ready ? 'is-ready' : '',
    expanded ? 'is-expanded' : '',
    dragging ? 'is-dragging' : '',
    instant ? 'is-instant' : '',
    inert ? 'is-inert' : '',
    revealing ? 'is-revealing' : '',
    softSheet ? 'is-soft-sheet' : '',
    collapsed ? 'is-collapsed' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

export type BottomSheetProps = BottomSheetStateProps & {
  variant: BottomSheetVariant;
  as?: 'section' | 'div';
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<'div'>, 'as' | 'children' | 'className'>;

const BottomSheetRoot = forwardRef<HTMLElement, BottomSheetProps>(
  function BottomSheetRoot(
    {
      variant,
      as,
      dragging,
      ready,
      instant,
      inert,
      revealing,
      softSheet,
      expanded,
      collapsed,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    const Component = as ?? (variant === 'list' ? 'section' : 'div');

    return (
      <Component
        ref={ref as never}
        className={buildRootClassName({
          variant,
          dragging,
          ready,
          instant,
          inert,
          revealing,
          softSheet,
          expanded,
          collapsed,
          className,
        })}
        {...rest}
      >
        {children}
      </Component>
    );
  },
);

type BottomSheetHeaderProps = ComponentPropsWithoutRef<'div'>;

const BottomSheetHeader = forwardRef<HTMLDivElement, BottomSheetHeaderProps>(
  function BottomSheetHeader({ className = '', ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={['bottom-sheet__header', className].filter(Boolean).join(' ')}
        {...rest}
      />
    );
  },
);

type BottomSheetHandleProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  ariaLabel: string;
};

const BottomSheetHandle = forwardRef<HTMLButtonElement, BottomSheetHandleProps>(
  function BottomSheetHandle(
    { ariaLabel, className = '', type = 'button', ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={['bottom-sheet__handle', className].filter(Boolean).join(' ')}
        aria-label={ariaLabel}
        {...rest}
      />
    );
  },
);

const BottomSheet = Object.assign(BottomSheetRoot, {
  Header: BottomSheetHeader,
  Handle: BottomSheetHandle,
});

export default BottomSheet;

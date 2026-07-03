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
          className,
        })}
        {...rest}
      >
        {children}
      </Component>
    );
  },
);

type BottomSheetPeekBarProps = ComponentPropsWithoutRef<'div'>;

const BottomSheetPeekBar = forwardRef<HTMLDivElement, BottomSheetPeekBarProps>(
  function BottomSheetPeekBar({ className = '', ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={['bottom-sheet__peek-bar', className].filter(Boolean).join(' ')}
        {...rest}
      />
    );
  },
);

type BottomSheetHandleProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  ariaLabel: string;
};

function BottomSheetHandle({
  ariaLabel,
  className = '',
  type = 'button',
  ...rest
}: BottomSheetHandleProps) {
  return (
    <button
      type={type}
      className={['bottom-sheet__handle', className].filter(Boolean).join(' ')}
      aria-label={ariaLabel}
      {...rest}
    />
  );
}

const BottomSheet = Object.assign(BottomSheetRoot, {
  PeekBar: BottomSheetPeekBar,
  Handle: BottomSheetHandle,
});

export default BottomSheet;

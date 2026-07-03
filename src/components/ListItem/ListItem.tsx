import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import './ListItem.css';

export type ListItemProps = {
  selected?: boolean;
  onSelect?: () => void;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<'article'>, 'onSelect'>;

const ListItemRoot = forwardRef<HTMLElement, ListItemProps>(function ListItemRoot(
  { selected = false, onSelect, className = '', children, onClick, onKeyDown, ...rest },
  ref,
) {
  const handleClick: ComponentPropsWithoutRef<'article'>['onClick'] = (e) => {
    onClick?.(e);
    if (!e.defaultPrevented) onSelect?.();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.();
    }
  };

  return (
    <article
      ref={ref}
      className={['list-item', selected ? 'list-item--selected' : '', className]
        .filter(Boolean)
        .join(' ')}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-pressed={selected}
      {...rest}
    >
      {children}
    </article>
  );
});

type ListItemSlotProps = ComponentPropsWithoutRef<'div'> & {
  className?: string;
};

function ListItemMedia({ className = '', ...rest }: ListItemSlotProps) {
  return (
    <div className={['list-item__media', className].filter(Boolean).join(' ')} {...rest} />
  );
}

function ListItemBody({ className = '', ...rest }: ListItemSlotProps) {
  return (
    <div className={['list-item__body', className].filter(Boolean).join(' ')} {...rest} />
  );
}

function ListItemContent({ className = '', ...rest }: ListItemSlotProps) {
  return (
    <div className={['list-item__content', className].filter(Boolean).join(' ')} {...rest} />
  );
}

function ListItemTitleRow({ className = '', ...rest }: ListItemSlotProps) {
  return (
    <div
      className={['list-item__title-row', className].filter(Boolean).join(' ')}
      {...rest}
    />
  );
}

function ListItemTitle({
  className = '',
  ...rest
}: ComponentPropsWithoutRef<'h3'>) {
  return (
    <h3 className={['list-item__title', className].filter(Boolean).join(' ')} {...rest} />
  );
}

function ListItemSubline({ className = '', ...rest }: ListItemSlotProps) {
  return (
    <p className={['list-item__subline', className].filter(Boolean).join(' ')} {...rest} />
  );
}

function ListItemDescription({ className = '', ...rest }: ListItemSlotProps) {
  return (
    <p
      className={['list-item__description', className].filter(Boolean).join(' ')}
      {...rest}
    />
  );
}

function ListItemTrailing({ className = '', ...rest }: ListItemSlotProps) {
  return (
    <div className={['list-item__trailing', className].filter(Boolean).join(' ')} {...rest} />
  );
}

const ListItem = Object.assign(ListItemRoot, {
  Media: ListItemMedia,
  Body: ListItemBody,
  Content: ListItemContent,
  TitleRow: ListItemTitleRow,
  Title: ListItemTitle,
  Subline: ListItemSubline,
  Description: ListItemDescription,
  Trailing: ListItemTrailing,
});

export default ListItem;

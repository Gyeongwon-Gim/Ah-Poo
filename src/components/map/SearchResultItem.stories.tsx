import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SearchResultItem from './SearchResultItem';
import { FavoritesProvider } from '../../hooks/useFavorites';
import { MOCK_POOLS, SINGLE_POOL } from '../../stories-fixtures/pools';

const meta = {
  title: 'Components/map/SearchResultItem',
  component: SearchResultItem,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <FavoritesProvider>
        <div style={{ maxWidth: 440, margin: '0 auto', padding: 12 }}>
          <Story />
        </div>
      </FavoritesProvider>
    ),
  ],
  argTypes: {
    onSelect: { action: 'select' },
    selected: { control: 'boolean' },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '검색 결과 한 줄. 즐겨찾기 토글은 localStorage(FavoritesProvider)에 저장됩니다.',
      },
    },
  },
} satisfies Meta<typeof SearchResultItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    pool: SINGLE_POOL,
    selected: false,
    onSelect: () => {},
  },
};

export const Selected: Story = {
  args: {
    pool: SINGLE_POOL,
    selected: true,
    onSelect: () => {},
  },
};

export const FreeAndFar: Story = {
  args: {
    pool: MOCK_POOLS[2]!,
    selected: false,
    onSelect: () => {},
  },
};

export const List = {
  render: () => {
    function ListPreview() {
      const [selectedKey, setSelectedKey] = useState<string | null>(null);
      return (
        <>
          {MOCK_POOLS.map((pool) => (
            <SearchResultItem
              key={pool.name}
              pool={pool}
              selected={selectedKey === pool.name}
              onSelect={(p) => setSelectedKey(p.name)}
            />
          ))}
        </>
      );
    }
    return <ListPreview />;
  },
};

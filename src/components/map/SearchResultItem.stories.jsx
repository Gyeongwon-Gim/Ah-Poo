import { useState } from 'react';
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
};

export default meta;

export const Default = {
  args: {
    pool: SINGLE_POOL,
    selected: false,
  },
};

export const Selected = {
  args: {
    pool: SINGLE_POOL,
    selected: true,
  },
};

export const FreeAndFar = {
  args: {
    pool: MOCK_POOLS[2],
    selected: false,
  },
};

/** 여러 항목을 한 번에 보여주고 선택 상태를 직접 토글해 볼 수 있습니다. */
export const List = {
  render: () => {
    function ListPreview() {
      const [selectedKey, setSelectedKey] = useState(null);
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

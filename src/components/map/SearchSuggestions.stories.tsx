import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SearchSuggestions from './SearchSuggestions';
import { MOCK_POOLS } from '../../stories-fixtures/pools';

const meta = {
  title: 'Components/map/SearchSuggestions',
  component: SearchSuggestions,
  tags: ['autodocs'],
  argTypes: {
    draft: { control: 'text', description: '현재 입력 중인 검색어' },
    onPick: { action: 'pick' },
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof SearchSuggestions>;

export default meta;

type Story = StoryObj<typeof meta>;

function InteractiveSuggestions({
  draft: initialDraft,
  ...args
}: React.ComponentProps<typeof SearchSuggestions>) {
  const [draft, setDraft] = useState(initialDraft ?? '');
  return (
    <div style={{ maxWidth: 440, margin: '0 auto' }}>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="검색어를 입력해 보세요 (예: 올림픽)"
        style={{
          width: '100%',
          padding: '12px 16px',
          fontSize: 16,
          border: '1px solid #cbd5e1',
          borderRadius: 12,
          marginBottom: 8,
        }}
      />
      <SearchSuggestions {...args} draft={draft} />
    </div>
  );
}

export const Interactive: Story = {
  render: InteractiveSuggestions,
  args: {
    draft: '올림픽',
    pools: MOCK_POOLS,
    onPick: () => {},
  },
};

export const EmptyDraft: Story = {
  args: {
    draft: '',
    pools: MOCK_POOLS,
    onPick: () => {},
  },
};

export const NoMatches: Story = {
  args: {
    draft: '부산해운대',
    pools: MOCK_POOLS,
    onPick: () => {},
  },
};

export const WithMatches: Story = {
  args: {
    draft: '수영장',
    pools: MOCK_POOLS,
    onPick: () => {},
  },
};

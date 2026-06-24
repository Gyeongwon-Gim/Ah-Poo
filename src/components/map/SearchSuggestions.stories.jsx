import { useState } from 'react';
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
};

export default meta;

/** draft를 입력창으로 직접 바꿔볼 수 있는 인터랙티브 래퍼 */
function InteractiveSuggestions({ draft: initialDraft, ...args }) {
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

export const Interactive = {
  render: InteractiveSuggestions,
  args: {
    draft: '올림픽',
    pools: MOCK_POOLS,
  },
};

export const EmptyDraft = {
  args: {
    draft: '',
    pools: MOCK_POOLS,
  },
};

export const NoMatches = {
  args: {
    draft: '부산해운대',
    pools: MOCK_POOLS,
  },
};

export const WithMatches = {
  args: {
    draft: '수영장',
    pools: MOCK_POOLS,
  },
};

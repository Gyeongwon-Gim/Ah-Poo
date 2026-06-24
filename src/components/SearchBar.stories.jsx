import { useState } from 'react';
import SearchBar from './SearchBar';

const meta = {
  title: 'Components/SearchBar',
  component: SearchBar,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['default', 'map'],
      description: '검색바 스타일 변형',
    },
    searchMode: {
      control: 'boolean',
      description: '검색 모드(상단 고정 바 + 뒤로가기 버튼) 여부',
    },
    onSearch: { action: 'search' },
    onActivate: { action: 'activate' },
    onClose: { action: 'close' },
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

/** value/onValueChange를 내부 state로 제어하는 인터랙티브 래퍼 */
function ControlledSearchBar(args) {
  const [value, setValue] = useState(args.value ?? '');
  return (
    <div style={{ maxWidth: 440, margin: '0 auto', paddingTop: 24 }}>
      <SearchBar {...args} value={value} onValueChange={setValue} />
    </div>
  );
}

export const Default = {
  render: ControlledSearchBar,
  args: {
    variant: 'default',
    searchMode: false,
  },
};

export const WithValue = {
  render: ControlledSearchBar,
  args: {
    variant: 'default',
    searchMode: false,
    value: '강남구 실내수영장',
  },
};

export const MapVariant = {
  render: ControlledSearchBar,
  args: {
    variant: 'map',
    searchMode: false,
  },
};

export const SearchMode = {
  render: ControlledSearchBar,
  args: {
    variant: 'default',
    searchMode: true,
    value: '올림픽수영장',
  },
};

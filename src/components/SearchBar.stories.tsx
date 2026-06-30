import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
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
} satisfies Meta<typeof SearchBar>;

export default meta;

type Story = StoryObj<typeof meta>;

function ControlledSearchBar(args: React.ComponentProps<typeof SearchBar>) {
  const [value, setValue] = useState(args.value ?? '');
  return (
    <div style={{ maxWidth: 440, margin: '0 auto', paddingTop: 24 }}>
      <SearchBar {...args} value={value} onValueChange={setValue} />
    </div>
  );
}

export const Default: Story = {
  render: ControlledSearchBar,
  args: {
    variant: 'default',
    searchMode: false,
  },
};

export const WithValue: Story = {
  render: ControlledSearchBar,
  args: {
    variant: 'default',
    searchMode: false,
    value: '강남구 실내수영장',
  },
};

export const MapVariant: Story = {
  render: ControlledSearchBar,
  args: {
    variant: 'map',
    searchMode: false,
  },
};

export const SearchMode: Story = {
  render: ControlledSearchBar,
  args: {
    variant: 'default',
    searchMode: true,
    value: '올림픽수영장',
  },
};

export const MapBrowserSearchMode: Story = {
  render: ControlledSearchBar,
  args: {
    variant: 'map',
    searchMode: true,
    value: '올림픽수영장',
  },
};

export const MapBrowserWithLogo: Story = MapVariant;

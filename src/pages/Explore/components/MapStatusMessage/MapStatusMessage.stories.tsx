import type { Meta, StoryObj } from '@storybook/react';
import MapStatusMessage from './MapStatusMessage';
import './MapStatusMessage.css';

const meta = {
  title: 'Components/MapStatusMessage',
  component: MapStatusMessage,
  tags: ['autodocs'],
  argTypes: {
    onRetry: { action: 'retry' },
    locationStatus: {
      control: 'inline-radio',
      options: ['granted', 'denied', 'unsupported', 'pending'],
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          position: 'relative',
          minHeight: 360,
          background: '#dbeafe',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '지도 위 로딩·에러·빈 상태 안내. props 조합에 따라 서로 다른 메시지가 나타납니다.',
      },
    },
  },
} satisfies Meta<typeof MapStatusMessage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const LocationPending: Story = {
  args: {
    loading: false,
    showLocationPending: true,
  },
};

export const Error: Story = {
  args: {
    loading: false,
    error: '수영장 정보를 불러오지 못했습니다.',
  },
};

export const LocationDenied: Story = {
  args: {
    loading: false,
    isSearching: false,
    locationStatus: 'denied',
  },
};

export const NoPoolsAtAll: Story = {
  args: {
    loading: false,
    poolCount: 0,
  },
};

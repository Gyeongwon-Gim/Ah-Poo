import HomeStatusOverlay from './HomeStatusOverlay';
import '../../pages/Home.css';

const meta = {
  title: 'Components/map/HomeStatusOverlay',
  component: HomeStatusOverlay,
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
          '홈 지도 위에 겹쳐 보이는 로딩·에러·빈 상태 안내. props 조합에 따라 서로 다른 메시지가 나타납니다.',
      },
    },
  },
};

export default meta;

export const Loading = {
  args: {
    loading: true,
  },
};

export const LocationPending = {
  args: {
    loading: false,
    showLocationPending: true,
  },
};

export const Error = {
  args: {
    loading: false,
    error: '수영장 정보를 불러오지 못했습니다.',
  },
};

export const LocationDenied = {
  args: {
    loading: false,
    isSearching: false,
    locationStatus: 'denied',
  },
};

export const NoNearbyPools = {
  args: {
    loading: false,
    isNearbyMode: true,
    mapPoolCount: 0,
    poolCount: 42,
  },
};

export const NoPoolsAtAll = {
  args: {
    loading: false,
    poolCount: 0,
  },
};

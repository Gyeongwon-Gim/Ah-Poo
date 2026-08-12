import type { Meta, StoryObj } from '@storybook/react';
import PoolScheduleTags from './PoolScheduleTags';

const meta = {
  title: 'Components/PoolScheduleTags',
  component: PoolScheduleTags,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'pool 객체의 50m 레인 플래그를 Tag(highlight)로 표시합니다. 50m가 아니면 렌더링하지 않습니다.',
      },
    },
  },
} satisfies Meta<typeof PoolScheduleTags>;

export default meta;

type Story = StoryObj<typeof meta>;

const basePool = {
  name: '',
  roadAddress: '',
  lat: 0,
  lng: 0,
  fee: '',
  official_url: '',
  url2: '',
  phone: '',
} as const;

export const FiftyMeter: Story = {
  args: {
    pool: {
      ...basePool,
      is50m: 1,
    },
  },
};

export const Empty: Story = {
  args: {
    pool: {
      ...basePool,
      is50m: 0,
    },
  },
};

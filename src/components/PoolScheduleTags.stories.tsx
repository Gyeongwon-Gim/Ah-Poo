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
          'pool 객체의 운영 플래그를 Tag(active/default) 조합으로 표시합니다. 활성 태그가 없으면 렌더링하지 않습니다.',
      },
    },
  },
} satisfies Meta<typeof PoolScheduleTags>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AllTags: Story = {
  args: {
    pool: {
      name: '',
      roadAddress: '',
      lat: 0,
      lng: 0,
      fee: '',
      official_url: '',
      url2: '',
      phone: '',
      is50m: 1,
      isWeekday: 1,
      isSaturday: 1,
      isSunday: 1,
      isHoliday: 1,
    },
  },
};

export const WeekdayOnly: Story = {
  args: {
    pool: {
      name: '',
      roadAddress: '',
      lat: 0,
      lng: 0,
      fee: '',
      official_url: '',
      url2: '',
      phone: '',
      is50m: 0,
      isWeekday: 1,
      isSaturday: 0,
      isSunday: 0,
      isHoliday: 0,
    },
  },
};

export const FiftyMeterWeekend: Story = {
  args: {
    pool: {
      name: '',
      roadAddress: '',
      lat: 0,
      lng: 0,
      fee: '',
      official_url: '',
      url2: '',
      phone: '',
      is50m: 1,
      isWeekday: 0,
      isSaturday: 1,
      isSunday: 1,
      isHoliday: 0,
    },
  },
};

export const Empty: Story = {
  args: {
    pool: {
      name: '',
      roadAddress: '',
      lat: 0,
      lng: 0,
      fee: '',
      official_url: '',
      url2: '',
      phone: '',
      is50m: 0,
      isWeekday: 0,
      isSaturday: 0,
      isSunday: 0,
      isHoliday: 0,
    },
  },
};

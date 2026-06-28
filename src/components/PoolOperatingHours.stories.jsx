import PoolOperatingHours from './PoolOperatingHours';
import { DEFAULT_MOCK_WEEKLY } from '../data/mockOperatingHours';

const meta = {
  title: 'Components/PoolOperatingHours',
  component: PoolOperatingHours,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '현재 영업 여부와 요일별 운영시간을 네이버 지도 스타일로 보여줍니다. now prop으로 특정 시각을 지정할 수 있습니다.',
      },
    },
  },
  argTypes: {
    now: { control: false },
  },
};

export default meta;

function at(day, hour, minute = 0) {
  const base = new Date(2026, 5, 27, hour, minute);
  const offset = day - 6;
  base.setDate(base.getDate() + offset);
  return base;
}

export const OpenOnSaturday = {
  args: {
    weeklyHours: DEFAULT_MOCK_WEEKLY,
    now: at(6, 10, 0),
  },
};

export const BeforeOpen = {
  args: {
    weeklyHours: DEFAULT_MOCK_WEEKLY,
    now: at(1, 5, 0),
  },
};

export const ClosedAfterHours = {
  args: {
    weeklyHours: DEFAULT_MOCK_WEEKLY,
    now: at(6, 17, 0),
  },
};

export const ClosedOnSunday = {
  args: {
    weeklyHours: DEFAULT_MOCK_WEEKLY,
    now: at(0, 12, 0),
  },
};

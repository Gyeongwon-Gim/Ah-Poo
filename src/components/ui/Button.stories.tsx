import type { Meta, StoryObj } from '@storybook/react';
import { RefreshCw, Star, LocateFixed, ChevronLeft } from 'lucide-react';
import Button from './Button';

const meta = {
  title: 'Design System/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '어푸 공통 버튼. primary(CTA), secondary(보조), ghost(아이콘 뒤로가기), icon(FAB) 변형을 지원합니다.',
      },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: '다시 시도',
    variant: 'primary',
    size: 'sm',
  },
};

export const PrimaryWithIcon: Story = {
  render: () => (
    <Button variant="primary" size="sm">
      <RefreshCw size={16} />
      다시 시도
    </Button>
  ),
};

export const Secondary: Story = {
  args: {
    children: '길찾기',
    variant: 'secondary',
    size: 'md',
  },
};

export const Ghost: Story = {
  render: () => (
    <Button variant="ghost" aria-label="뒤로">
      <ChevronLeft size={22} strokeWidth={2.5} />
    </Button>
  ),
};

export const IconFab: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 10 }}>
      <Button variant="icon" favorite active aria-label="즐겨찾기">
        <Star size={17} strokeWidth={1.5} fill="currentColor" />
      </Button>
      <Button variant="icon" aria-label="현재 위치">
        <LocateFixed size={18} strokeWidth={1.5} />
      </Button>
    </div>
  ),
};

export const AsAnchor: Story = {
  render: () => (
    <Button as="a" href="https://ah-poo.kr" variant="secondary" size="md">
      링크 버튼
    </Button>
  ),
};

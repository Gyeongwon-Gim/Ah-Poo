import type { Meta, StoryObj } from '@storybook/react';
import { Search, X } from 'lucide-react';
import Input from './Input';

const meta = {
  title: 'Design System/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '검색바 등에서 사용하는 텍스트 입력. leading/trailing 슬롯으로 아이콘·액션 버튼을 배치합니다.',
      },
    },
  },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: '어푸어푸! 수영하러 가볼까요?',
    leading: <Search size={20} strokeWidth={2.5} aria-hidden />,
  },
};

export const Pill: Story = {
  args: {
    variant: 'pill',
    placeholder: '어푸어푸! 수영하러 가볼까요?',
    leading: <Search size={20} strokeWidth={2.5} aria-hidden />,
  },
};

export const WithClear: Story = {
  render: () => (
    <Input
      defaultValue="잠실"
      placeholder="검색"
      leading={<Search size={20} strokeWidth={2.5} aria-hidden />}
      trailing={
        <button type="button" aria-label="검색어 지우기">
          <X size={18} strokeWidth={2.5} />
        </button>
      }
    />
  ),
};

export const BorderedPill: Story = {
  args: {
    variant: 'pill',
    bordered: true,
    placeholder: '검색어 입력',
  },
};

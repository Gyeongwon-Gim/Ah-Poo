import type { Meta, StoryObj } from '@storybook/react';
import Tag from './Tag';

const meta = {
  title: 'Design System/Tag',
  component: Tag,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '운영 요일·50m 등 상태를 표시하는 pill 태그. active 변형은 강조(녹색) 스타일입니다.',
      },
    },
  },
} satisfies Meta<typeof Tag>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: '평일' },
};

export const Active: Story = {
  args: { children: '50m', variant: 'active' },
};

export const Group: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
      <Tag variant="active">50m</Tag>
      <Tag>평일</Tag>
      <Tag>토요일</Tag>
      <Tag>일요일</Tag>
    </div>
  ),
};

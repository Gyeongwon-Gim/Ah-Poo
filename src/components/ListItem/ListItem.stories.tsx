import type { Meta, StoryObj } from '@storybook/react';
import { Star } from 'lucide-react';
import ListItem from './ListItem';

const meta = {
  title: 'Design System/ListItem',
  component: ListItem,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: '리스트 시트용 행 shell. 미디어·본문·trailing slot을 조립합니다.',
      },
    },
  },
} satisfies Meta<typeof ListItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ListItem selected={false} onSelect={() => {}}>
      <ListItem.Body>
        <ListItem.Content>
          <ListItem.TitleRow>
            <ListItem.Title>잠실 종합운동장 수영장</ListItem.Title>
          </ListItem.TitleRow>
          <ListItem.Subline>
            <span>5,000원</span>
            <span aria-hidden> · </span>
            <span>1.2km</span>
          </ListItem.Subline>
          <ListItem.Description>서울 송파구 올림픽로 25</ListItem.Description>
        </ListItem.Content>
        <ListItem.Trailing>
          <button type="button" aria-label="즐겨찾기">
            <Star size={18} />
          </button>
        </ListItem.Trailing>
      </ListItem.Body>
    </ListItem>
  ),
};

export const Selected: Story = {
  render: () => (
    <ListItem selected onSelect={() => {}}>
      <ListItem.Body>
        <ListItem.Content>
          <ListItem.TitleRow>
            <ListItem.Title>강남 스포츠 센터</ListItem.Title>
          </ListItem.TitleRow>
          <ListItem.Description>서울 강남구 테헤란로</ListItem.Description>
        </ListItem.Content>
      </ListItem.Body>
    </ListItem>
  ),
};

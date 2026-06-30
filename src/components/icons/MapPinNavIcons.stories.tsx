import type { Meta, StoryObj } from '@storybook/react';
import { MapPinNavActive, MapPinNavInactive } from './MapPinNavIcons';

const meta = {
  title: 'Components/icons/MapPinNavIcons',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'FloatingNav의 "수영장 찾기" 탭에서 쓰는 지도 핀 아이콘. 활성/비활성 두 가지 상태가 있습니다.',
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function IconRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {children}
      <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
    </div>
  );
}

export const Inactive: Story = {
  render: () => <MapPinNavInactive />,
};

export const Active: Story = {
  render: () => <MapPinNavActive />,
};

export const Comparison: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
      <IconRow label="비활성">
        <MapPinNavInactive />
      </IconRow>
      <IconRow label="활성">
        <MapPinNavActive />
      </IconRow>
    </div>
  ),
};

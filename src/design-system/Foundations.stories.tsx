import type { Meta, StoryObj } from '@storybook/react';

const COLOR_TOKENS = [
  { name: '--ap-primary', label: 'Primary' },
  { name: '--ap-primary-dark', label: 'Primary Dark' },
  { name: '--ap-accent', label: 'Accent' },
  { name: '--ap-favorite', label: 'Favorite' },
  { name: '--ap-bg', label: 'Background' },
  { name: '--ap-bg-deep', label: 'Background Deep' },
  { name: '--ap-bg-map', label: 'Map Background' },
  { name: '--ap-surface', label: 'Surface' },
  { name: '--ap-text', label: 'Text' },
  { name: '--ap-text-muted', label: 'Text Muted' },
  { name: '--ap-success', label: 'Success' },
  { name: '--ap-error', label: 'Error' },
  { name: '--ap-map-marker', label: 'Map Marker' },
  { name: '--ap-map-user', label: 'Map User' },
];

const TYPE_SCALE = [
  { token: '--ap-font-xs', sample: '10px 태그' },
  { token: '--ap-font-caption', sample: '12px 캡션' },
  { token: '--ap-font-body-sm', sample: '13px 보조 본문' },
  { token: '--ap-font-body', sample: '14px 본문' },
  { token: '--ap-font-body-lg', sample: '15px 본문 강조' },
  { token: '--ap-font-title-sm', sample: '16px 제목' },
  { token: '--ap-font-title-lg', sample: '21px 시트 제목' },
  { token: '--ap-font-2xl', sample: '30px 로고', display: true },
];

const SPACING = [
  '--ap-space-1',
  '--ap-space-3',
  '--ap-space-5',
  '--ap-space-6',
  '--ap-space-8',
  '--ap-space-9',
];

const Swatch = ({ name, label }: { name: string; label: string }) => {
  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 96 }}
    >
      <div
        style={{
          width: 96,
          height: 56,
          borderRadius: 'var(--ap-radius-md)',
          background: `var(${name})`,
          border: '1px solid var(--ap-border-neutral)',
        }}
      />
      <strong style={{ fontSize: 12 }}>{label}</strong>
      <code style={{ fontSize: 11, color: 'var(--ap-text-muted)' }}>
        {name}
      </code>
    </div>
  );
};

const FoundationsPreview = () => {
  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 32, padding: 8 }}
    >
      <section>
        <h3 style={{ marginBottom: 12 }}>Color</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {COLOR_TOKENS.map((token) => (
            <Swatch key={token.name} name={token.name} label={token.label} />
          ))}
        </div>
      </section>

      <section>
        <h3 style={{ marginBottom: 12 }}>Typography</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {TYPE_SCALE.map(({ token, sample, display }) => (
            <div
              key={token}
              style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}
            >
              <code
                style={{
                  width: 160,
                  fontSize: 11,
                  color: 'var(--ap-text-muted)',
                }}
              >
                {token}
              </code>
              <span
                style={{
                  fontSize: `var(${token})`,
                  fontFamily: display ? 'var(--ap-font-display)' : undefined,
                  fontWeight: display ? 400 : 600,
                }}
              >
                {sample}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 style={{ marginBottom: 12 }}>Spacing</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
          {SPACING.map((token) => (
            <div key={token} style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: `var(${token})`,
                  height: `var(${token})`,
                  background: 'var(--ap-primary)',
                  borderRadius: 4,
                  margin: '0 auto 6px',
                }}
              />
              <code style={{ fontSize: 10 }}>{token}</code>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 style={{ marginBottom: 12 }}>Shape & Shadow</h3>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div
            style={{
              width: 120,
              height: 64,
              borderRadius: 'var(--ap-radius-sm)',
              background: 'var(--ap-surface)',
              boxShadow: 'var(--ap-shadow)',
            }}
          />
          <div
            style={{
              width: 120,
              height: 64,
              borderRadius: 'var(--ap-pill-radius)',
              background: 'var(--ap-primary)',
            }}
          />
          <div
            style={{
              width: 120,
              height: 64,
              borderRadius: 'var(--ap-radius-lg) var(--ap-radius-lg) 0 0',
              background: 'var(--ap-surface)',
              boxShadow: 'var(--ap-shadow-sheet)',
            }}
          />
        </div>
      </section>
    </div>
  );
};

const meta = {
  title: 'Design System/Foundations',
  component: FoundationsPreview,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '어푸 디자인 토큰(`--ap-*`) 시각 레퍼런스. 정의는 src/styles/tokens.css에 있습니다.',
      },
    },
  },
} satisfies Meta<typeof FoundationsPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Tokens: Story = {
  render: () => <FoundationsPreview />,
};

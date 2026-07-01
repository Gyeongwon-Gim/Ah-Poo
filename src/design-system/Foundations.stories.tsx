import type { Meta, StoryObj } from '@storybook/react';

const COLOR_TOKENS = [
  { name: '--pf-primary', label: 'Primary' },
  { name: '--pf-primary-dark', label: 'Primary Dark' },
  { name: '--pf-accent', label: 'Accent' },
  { name: '--pf-favorite', label: 'Favorite' },
  { name: '--pf-bg', label: 'Background' },
  { name: '--pf-bg-deep', label: 'Background Deep' },
  { name: '--pf-bg-map', label: 'Map Background' },
  { name: '--pf-surface', label: 'Surface' },
  { name: '--pf-text', label: 'Text' },
  { name: '--pf-text-muted', label: 'Text Muted' },
  { name: '--pf-success', label: 'Success' },
  { name: '--pf-error', label: 'Error' },
  { name: '--pf-map-marker', label: 'Map Marker' },
  { name: '--pf-map-user', label: 'Map User' },
];

const TYPE_SCALE = [
  { token: '--pf-font-xs', sample: '10px 태그' },
  { token: '--pf-font-caption', sample: '12px 캡션' },
  { token: '--pf-font-body-sm', sample: '13px 보조 본문' },
  { token: '--pf-font-body', sample: '14px 본문' },
  { token: '--pf-font-body-lg', sample: '15px 본문 강조' },
  { token: '--pf-font-title-sm', sample: '16px 제목' },
  { token: '--pf-font-title-lg', sample: '21px 시트 제목' },
  { token: '--pf-font-2xl', sample: '30px 로고', display: true },
];

const SPACING = [
  '--pf-space-1',
  '--pf-space-3',
  '--pf-space-5',
  '--pf-space-6',
  '--pf-space-8',
  '--pf-space-9',
];

function Swatch({ name, label }: { name: string; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 96 }}>
      <div
        style={{
          width: 96,
          height: 56,
          borderRadius: 'var(--pf-radius-md)',
          background: `var(${name})`,
          border: '1px solid var(--pf-border-neutral)',
        }}
      />
      <strong style={{ fontSize: 12 }}>{label}</strong>
      <code style={{ fontSize: 11, color: 'var(--pf-text-muted)' }}>{name}</code>
    </div>
  );
}

function FoundationsPreview() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, padding: 8 }}>
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
            <div key={token} style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <code style={{ width: 160, fontSize: 11, color: 'var(--pf-text-muted)' }}>
                {token}
              </code>
              <span
                style={{
                  fontSize: `var(${token})`,
                  fontFamily: display ? 'var(--pf-font-display)' : undefined,
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
                  background: 'var(--pf-primary)',
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
              borderRadius: 'var(--pf-radius-sm)',
              background: 'var(--pf-surface)',
              boxShadow: 'var(--pf-shadow)',
            }}
          />
          <div
            style={{
              width: 120,
              height: 64,
              borderRadius: 'var(--pf-pill-radius)',
              background: 'var(--pf-primary)',
            }}
          />
          <div
            style={{
              width: 120,
              height: 64,
              borderRadius: 'var(--pf-radius-lg) var(--pf-radius-lg) 0 0',
              background: 'var(--pf-surface)',
              boxShadow: 'var(--pf-shadow-sheet)',
            }}
          />
        </div>
      </section>
    </div>
  );
}

const meta = {
  title: 'Design System/Foundations',
  component: FoundationsPreview,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '어푸 디자인 토큰(`--pf-*`) 시각 레퍼런스. 정의는 src/styles/tokens.css에 있습니다.',
      },
    },
  },
} satisfies Meta<typeof FoundationsPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Tokens: Story = {
  render: () => <FoundationsPreview />,
};

import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-mcp',
  ],
  framework: '@storybook/react-vite',
  // PWA(서비스워커) 플러그인은 앱 전용이라 Storybook 빌드에서는 제외한다.
  viteFinal: async (viteConfig) => {
    viteConfig.plugins = (viteConfig.plugins ?? []).filter((plugin) => {
      const name = Array.isArray(plugin) ? plugin[0]?.name : plugin?.name;
      return !(typeof name === 'string' && name.startsWith('vite-plugin-pwa'));
    });
    return viteConfig;
  },
};

export default config;

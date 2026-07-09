import type { StorybookConfig } from '@storybook/react-vite';
import type { PluginOption } from 'vite';

function getPluginName(plugin: PluginOption): string | undefined {
  if (!plugin || typeof plugin !== 'object') return undefined;
  if (Array.isArray(plugin)) {
    const first = plugin[0];
    return first && typeof first === 'object' && 'name' in first && typeof first.name === 'string'
      ? first.name
      : undefined;
  }
  if ('then' in plugin) return undefined;
  return 'name' in plugin && typeof plugin.name === 'string' ? plugin.name : undefined;
}

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
      const name = getPluginName(plugin);
      return !name?.startsWith('vite-plugin-pwa');
    });
    return viteConfig;
  },
};

export default config;

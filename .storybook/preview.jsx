import '../src/index.css';

/** @type { import('@storybook/react-vite').Preview } */
const preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo"
    },

    backgrounds: {
      options: {
        app: { name: 'App 배경', value: '#e8f4fc' },
        light: { name: 'Light', value: '#ffffff' },
        dark: { name: 'Dark', value: '#0f172a' },
      },
    },
  },

  initialGlobals: {
    backgrounds: { value: 'app' },
  },
};

export default preview;
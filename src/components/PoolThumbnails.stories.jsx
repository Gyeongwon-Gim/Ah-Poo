import PoolThumbnails from './PoolThumbnails';

const meta = {
  title: 'Components/PoolThumbnails',
  component: PoolThumbnails,
  tags: ['autodocs'],
  argTypes: {
    className: { control: 'text' },
    ariaHidden: { control: 'boolean' },
    onPointerDown: { action: 'pointerDown' },
  },
};

export default meta;

export const Default = {
  args: {
    ariaHidden: true,
  },
};

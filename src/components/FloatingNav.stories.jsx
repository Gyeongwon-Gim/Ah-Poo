import { MemoryRouter } from 'react-router-dom';
import FloatingNav from './FloatingNav';
import { MainTabProvider } from '../contexts/MainTabContext';
import './FloatingNav.css';

const meta = {
  title: 'Components/FloatingNav',
  component: FloatingNav,
  tags: ['autodocs'],
  decorators: [
    (Story, { parameters }) => (
      <MemoryRouter initialEntries={[parameters.initialRoute ?? '/']}>
        <MainTabProvider>
          <div style={{ position: 'relative', minHeight: 160 }}>
            <Story />
          </div>
        </MainTabProvider>
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '하단 떠 있는 메인 네비게이션. react-router의 현재 경로와 MainTabContext 상태에 따라 활성 탭이 바뀝니다. (경로가 /pool이면 렌더링되지 않습니다.)',
      },
    },
  },
};

export default meta;

export const HomeTab = {
  parameters: { initialRoute: '/' },
};

export const HiddenOnPoolRoute = {
  parameters: { initialRoute: '/pool' },
};

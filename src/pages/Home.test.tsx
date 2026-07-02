import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import type { Pool } from '../types/pool';
import type { GeoCoords } from '../hooks/useUserLocation';

const mocks = vi.hoisted(() => ({
  fetchPools: vi.fn(),
  fetchPoolById: vi.fn(),
  useUserLocation: vi.fn(),
  useFavorites: vi.fn(),
  useMainTab: vi.fn(),
  syncAppViewport: vi.fn(),
  panToPool: vi.fn(),
  panToUserLocation: vi.fn(),
  supabaseConfigured: true,
}));

vi.mock('../services/pools', () => ({
  fetchPools: mocks.fetchPools,
  fetchPoolById: mocks.fetchPoolById,
}));

vi.mock('../lib/supabase', () => ({
  get isSupabaseConfigured() {
    return mocks.supabaseConfigured;
  },
  supabase: null,
}));

vi.mock('../hooks/useUserLocation', () => ({
  useUserLocation: mocks.useUserLocation,
}));

vi.mock('../hooks/useFavorites', () => ({
  useFavorites: mocks.useFavorites,
}));

vi.mock('../contexts/MainTabContext', () => ({
  useMainTab: mocks.useMainTab,
}));

vi.mock('../utils/appViewport', () => ({
  syncAppViewport: mocks.syncAppViewport,
}));

interface PoolMapStubProps {
  pools: Pool[];
  onSelectPool: (pool: Pool) => void;
}

// --- child component stubs (지도 SDK / 애니메이션 시트는 단순화) ---
vi.mock('../components/map/PoolMap', () => ({
  default: React.forwardRef<unknown, PoolMapStubProps>(function PoolMapStub(
    { pools, onSelectPool },
    ref,
  ) {
    React.useImperativeHandle(ref, () => ({
      panToPool: mocks.panToPool,
      panToUserLocation: mocks.panToUserLocation,
    }));
    return (
      <div data-testid="pool-map">
        <span data-testid="marker-count">{pools.length}</span>
        {pools.map((p) => (
          <button
            key={p.name}
            type="button"
            data-testid={`map-marker-${p.name}`}
            onClick={() => onSelectPool(p)}
          >
            {p.name}
          </button>
        ))}
      </div>
    );
  }),
}));

vi.mock('../components/map/PoolDetailSheet', () => ({
  default: function PoolDetailSheetStub({ pool }: { pool: Pool }) {
    return <div data-testid="detail-sheet">{pool.name}</div>;
  },
}));

interface SearchResultsPanelStubProps {
  pools: Pool[];
  titlePrefix: string;
  emptyMessage: string;
  onSelectPool: (pool: Pool) => void;
}

vi.mock('../components/map/SearchResultsPanel', () => ({
  default: function SearchResultsPanelStub({
    pools,
    titlePrefix,
    emptyMessage,
    onSelectPool,
  }: SearchResultsPanelStubProps) {
    return (
      <div data-testid="results-panel">
        <span data-testid="panel-title">{titlePrefix}</span>
        <span data-testid="panel-count">{pools.length}</span>
        {pools.length === 0 && <span>{emptyMessage}</span>}
        {pools.map((p) => (
          <button
            key={p.name}
            type="button"
            data-testid={`result-${p.name}`}
            onClick={() => onSelectPool(p)}
          >
            {p.name}
          </button>
        ))}
      </div>
    );
  },
}));

vi.mock('../components/map/SearchSuggestions', () => ({
  default: function SearchSuggestionsStub({ pools }: { pools: Pool[] }) {
    return <div data-testid="suggestions">{pools.length}</div>;
  },
}));

interface SearchBarStubProps {
  value: string;
  onValueChange: (value: string) => void;
  onSearch: (value: string) => void;
}

vi.mock('../components/SearchBar', () => ({
  default: function SearchBarStub({ value, onValueChange, onSearch }: SearchBarStubProps) {
    return (
      <form
        data-testid="search-bar"
        onSubmit={(e) => {
          e.preventDefault();
          onSearch(value);
        }}
      >
        <input
          aria-label="검색"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
        />
      </form>
    );
  },
}));

import Home from './Home';

const POOLS: Pool[] = [
  {
    id: '1',
    name: '강남수영장',
    roadAddress: '서울 강남구',
    fee: '5000원',
    lat: 37.498,
    lng: 127.027,
    official_url: '',
    url2: '',
    phone: '',
    is50m: 0,
    isWeekday: 0,
    isSaturday: 0,
    isSunday: 0,
    isHoliday: 0,
  },
  {
    id: '2',
    name: '송파수영장',
    roadAddress: '서울 송파구',
    fee: '무료',
    lat: 37.514,
    lng: 127.105,
    official_url: '',
    url2: '',
    phone: '',
    is50m: 0,
    isWeekday: 0,
    isSaturday: 0,
    isSunday: 0,
    isHoliday: 0,
  },
  {
    id: '3',
    name: '부산수영장',
    roadAddress: '부산 해운대구',
    fee: '3000원',
    lat: 35.16,
    lng: 129.16,
    official_url: '',
    url2: '',
    phone: '',
    is50m: 0,
    isWeekday: 0,
    isSaturday: 0,
    isSunday: 0,
    isHoliday: 0,
  },
];

function setLocation({
  status = 'pending',
  location = null,
}: {
  status?: string;
  location?: GeoCoords | null;
} = {}) {
  mocks.useUserLocation.mockReturnValue({
    location,
    status,
    refreshLocation: vi.fn().mockResolvedValue(location ?? { lat: 0, lng: 0 }),
  });
}

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderHome(initialEntries: string[] = ['/']) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <LocationProbe />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pool/:id" element={<div data-testid="pool-page" />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.supabaseConfigured = true;
  mocks.fetchPools.mockResolvedValue(POOLS);
  mocks.fetchPoolById.mockResolvedValue(null);
  mocks.useFavorites.mockReturnValue({ favorites: [] });
  mocks.useMainTab.mockReturnValue({
    favoritesOpen: false,
    closeFavorites: vi.fn(),
    toggleFavorites: vi.fn(),
  });
  setLocation({ status: 'pending' });
});

describe('Home - 로딩/에러/빈 상태', () => {
  it('데이터 로딩 중에는 로딩 메시지를 보여준다', () => {
    mocks.fetchPools.mockReturnValue(new Promise(() => {}));
    renderHome();
    expect(screen.getByText('수영장 정보를 불러오는 중…')).toBeInTheDocument();
  });

  it('로딩 실패 시 에러 메시지와 다시 시도 버튼을 보여준다', async () => {
    mocks.fetchPools.mockRejectedValueOnce(new Error('네트워크 오류'));
    renderHome();
    expect(await screen.findByText('네트워크 오류')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /다시 시도/ })).toBeInTheDocument();
  });

  it('Supabase 미설정이면 에러 화면에 설정 힌트를 보여준다', async () => {
    mocks.supabaseConfigured = false;
    mocks.fetchPools.mockRejectedValueOnce(new Error('설정 없음'));
    renderHome();
    expect(await screen.findByText('설정 없음')).toBeInTheDocument();
    expect(screen.getByText(/Supabase 설정을 확인/)).toBeInTheDocument();
  });

  it('다시 시도 버튼을 누르면 fetchPools를 다시 호출한다', async () => {
    mocks.fetchPools.mockRejectedValueOnce(new Error('일시 오류'));
    renderHome();
    await screen.findByText('일시 오류');
    expect(mocks.fetchPools).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: /다시 시도/ }));
    await waitFor(() => expect(mocks.fetchPools).toHaveBeenCalledTimes(2));
  });

  it('수영장이 0개면 빈 상태 메시지를 보여준다', async () => {
    mocks.fetchPools.mockResolvedValueOnce([]);
    setLocation({ status: 'ready', location: { lat: 37.5, lng: 127.0 } });
    renderHome();
    expect(await screen.findByText('등록된 수영장이 없습니다')).toBeInTheDocument();
  });
});

describe('Home - 위치 상태', () => {
  it('위치 확인 중에는 위치 안내 메시지를 보여준다', async () => {
    setLocation({ status: 'pending' });
    renderHome();
    expect(await screen.findByText('내 위치를 확인하는 중…')).toBeInTheDocument();
  });

  it('위치 권한이 거부되면 권한 안내를 보여준다', async () => {
    setLocation({ status: 'denied' });
    renderHome();
    expect(await screen.findByText('위치 권한이 필요합니다')).toBeInTheDocument();
  });

  it('주변 모드에서 반경 내 수영장이 없으면 안내를 보여준다', async () => {
    // 모든 수영장이 멀리 있는 위치
    setLocation({ status: 'ready', location: { lat: 33.0, lng: 126.5 } });
    renderHome();
    expect(
      await screen.findByText(/이내에 등록된 수영장이 없습니다/),
    ).toBeInTheDocument();
  });

  it('위치를 확인할 수 없으면 마커를 표시하지 않는다', async () => {
    setLocation({ status: 'unavailable' });
    renderHome();
    await waitFor(() => expect(mocks.fetchPools).toHaveBeenCalled());
    expect(screen.getByTestId('marker-count')).toHaveTextContent('0');
    expect(await screen.findByText('위치를 확인할 수 없습니다')).toBeInTheDocument();
  });

  it('주변 모드에서는 반경 내 수영장만 마커로 표시한다', async () => {
    // 서울 위치 → 강남/송파만 반경 내, 부산은 제외
    setLocation({ status: 'ready', location: { lat: 37.5, lng: 127.05 } });
    renderHome();
    await waitFor(() =>
      expect(screen.getByTestId('marker-count')).toHaveTextContent('2'),
    );
  });
});

describe('Home - 검색', () => {
  it('검색어 제출 시 결과 패널에 필터된 수영장이 표시된다', async () => {
    setLocation({ status: 'ready', location: { lat: 37.5, lng: 127.05 } });
    renderHome();
    await waitFor(() => expect(mocks.fetchPools).toHaveBeenCalled());

    await userEvent.type(screen.getByLabelText('검색'), '서울');
    await userEvent.keyboard('{Enter}');

    const panel = await screen.findByTestId('results-panel');
    expect(within(panel).getByTestId('panel-title')).toHaveTextContent('검색 결과');
    expect(within(panel).getByTestId('panel-count')).toHaveTextContent('2');
    expect(within(panel).getByText('강남수영장')).toBeInTheDocument();
    expect(within(panel).getByText('송파수영장')).toBeInTheDocument();
  });

  it('검색 결과가 1건이면 상세 시트를 자동으로 연다', async () => {
    setLocation({ status: 'ready', location: { lat: 37.5, lng: 127.05 } });
    renderHome();
    await waitFor(() => expect(mocks.fetchPools).toHaveBeenCalled());

    await userEvent.type(screen.getByLabelText('검색'), '부산');
    await userEvent.keyboard('{Enter}');

    expect(await screen.findByTestId('detail-sheet')).toHaveTextContent('부산수영장');
  });
});

describe('Home - 수영장 선택', () => {
  it('마커를 선택하면 상세 시트가 열리고 지도가 해당 위치로 이동한다', async () => {
    setLocation({ status: 'ready', location: { lat: 37.5, lng: 127.05 } });
    renderHome();
    const marker = await screen.findByTestId('map-marker-강남수영장');
    await userEvent.click(marker);

    expect(await screen.findByTestId('detail-sheet')).toHaveTextContent('강남수영장');
    expect(mocks.panToPool).toHaveBeenCalled();
  });
});

describe('Home - 공유 딥링크 진입', () => {
  it('?pool=<id>로 들어오면 지도에서 상세 시트를 연다', async () => {
    setLocation({ status: 'ready', location: { lat: 37.5, lng: 127.05 } });
    renderHome(['/?pool=2']);

    expect(await screen.findByTestId('detail-sheet')).toHaveTextContent('송파수영장');
    expect(mocks.panToPool).toHaveBeenCalled();
    expect(await screen.findByTestId('location')).toHaveTextContent('/');
  });

  it('존재하지 않는 id면 상세 시트를 열지 않는다', async () => {
    setLocation({ status: 'ready', location: { lat: 37.5, lng: 127.05 } });
    renderHome(['/?pool=9999']);

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/');
    });
    expect(screen.queryByTestId('detail-sheet')).not.toBeInTheDocument();
    expect(mocks.fetchPoolById).toHaveBeenCalledWith('9999');
  });
});

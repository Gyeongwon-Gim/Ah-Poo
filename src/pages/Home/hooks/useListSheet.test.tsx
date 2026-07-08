import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useListSheet } from './useListSheet';

let sheetApi: ReturnType<typeof useListSheet> | null = null;

function ListSheetHarness() {
  const sheet = useListSheet({
    itemCount: 1,
    reservePeekWhenEmpty: true,
    collapseToHandle: true,
  });

  sheetApi = sheet;

  return (
    <div className="home" style={{ height: 800 }}>
      <section
        ref={sheet.sectionRef}
        style={{ transform: `translateY(${sheet.translateY}px)` }}
      >
        <div ref={sheet.headerRef} style={{ height: 60 }}>
          <button ref={sheet.handleRef} type="button" aria-label="handle">
            handle
          </button>
        </div>
        <div ref={sheet.listRef}>
          <div style={{ height: 80 }}>item</div>
        </div>
      </section>
    </div>
  );
}

describe('useListSheet toggleHandle', () => {
  beforeEach(() => {
    sheetApi = null;
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: { height: 800 },
    });
    class ResizeObserverMock {
      observe() {}
      disconnect() {}
      unobserve() {}
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
  });

  it('peek 상태에서 핸들 클릭 시 collapsed가 된다', async () => {
    render(<ListSheetHarness />);

    await waitFor(() => {
      expect(sheetApi?.ready).toBe(true);
      expect(sheetApi?.collapsed).toBe(false);
    });

    act(() => {
      sheetApi!.toggleHandle();
    });

    expect(sheetApi!.collapsed).toBe(true);
  });

  it('collapsed 상태에서 핸들 클릭 시 peek로 복귀한다', async () => {
    render(<ListSheetHarness />);

    await waitFor(() => expect(sheetApi?.ready).toBe(true));

    act(() => {
      sheetApi!.toggleHandle();
    });
    expect(sheetApi!.collapsed).toBe(true);

    act(() => {
      sheetApi!.toggleHandle();
    });

    expect(sheetApi!.collapsed).toBe(false);
    expect(sheetApi!.expanded).toBe(false);
  });

  it('expanded 상태에서 핸들 클릭 시 peek로 돌아간다', async () => {
    render(<ListSheetHarness />);

    await waitFor(() => expect(sheetApi?.ready).toBe(true));

    act(() => {
      sheetApi!.toggleExpanded();
    });
    expect(sheetApi!.expanded).toBe(true);

    act(() => {
      sheetApi!.toggleHandle();
    });

    expect(sheetApi!.expanded).toBe(false);
    expect(sheetApi!.collapsed).toBe(false);
  });
});

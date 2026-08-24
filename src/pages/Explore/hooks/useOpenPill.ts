import type { CSSProperties } from 'react';
import { useMemo } from 'react';
import { getLayoutHeight } from '@/utils/appViewport';
import type { usePanelSheet } from './usePanelSheet';

const SEARCH_OPEN_PILL_GAP = 10;

const computeOpenPillStyle = (sheetTop: number): CSSProperties => ({
  bottom: Math.max(16, getLayoutHeight() - sheetTop + SEARCH_OPEN_PILL_GAP),
});

type PanelSheet = ReturnType<typeof usePanelSheet>;

/** 패널이 접힌 채 열려 있을 때 뜨는 "목록 열기" 핀 하나의 표시 여부·위치. */
export const useOpenPill = (active: boolean, sheet: PanelSheet) => {
  const show = active && sheet.collapsed;
  const style = useMemo((): CSSProperties | undefined => {
    if (!show || !Number.isFinite(sheet.sheetTop)) return undefined;
    return computeOpenPillStyle(sheet.sheetTop);
  }, [show, sheet.sheetTop]);
  return { show, style };
};

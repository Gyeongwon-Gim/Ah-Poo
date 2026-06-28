import { describe, it, expect } from 'vitest';
import {
  computeMapFabPlacement,
  FAB_GAP,
  HALF_SCREEN_RATIO,
} from './useMapFabLift';

const VH = 800;
const DEFAULT_BOTTOM = 16;
const HALF_TOP = VH * HALF_SCREEN_RATIO;

function liftAt(sheetTop) {
  return Math.max(0, VH - sheetTop + FAB_GAP - DEFAULT_BOTTOM);
}

describe('computeMapFabPlacement', () => {
  it('시트가 없거나 화면 아래면 FAB를 그대로 둔다', () => {
    expect(
      computeMapFabPlacement({
        sheetTop: Number.POSITIVE_INFINITY,
        viewportHeight: VH,
        defaultBottomPx: DEFAULT_BOTTOM,
      }),
    ).toEqual({ translateY: 0, interactive: true });

    expect(
      computeMapFabPlacement({
        sheetTop: VH,
        viewportHeight: VH,
        defaultBottomPx: DEFAULT_BOTTOM,
      }),
    ).toEqual({ translateY: 0, interactive: true });
  });

  it('시트가 FAB에 닿기 전까지는 FAB를 움직이지 않는다', () => {
    const sheetTop = VH - DEFAULT_BOTTOM;
    expect(
      computeMapFabPlacement({
        sheetTop: sheetTop + 40,
        viewportHeight: VH,
        defaultBottomPx: DEFAULT_BOTTOM,
      }),
    ).toEqual({ translateY: 0, interactive: true });
  });

  it('시트가 올라오면 FAB를 시트 top에 맞춰 함께 올린다', () => {
    const sheetTop = 620;
    const lift = liftAt(sheetTop);

    expect(
      computeMapFabPlacement({
        sheetTop,
        viewportHeight: VH,
        defaultBottomPx: DEFAULT_BOTTOM,
      }),
    ).toEqual({ translateY: -lift, interactive: true });
  });

  it('시트가 화면 50% 이상이면 FAB를 50% 지점에서 멈추고 가린다', () => {
    const lift = liftAt(HALF_TOP);

    expect(
      computeMapFabPlacement({
        sheetTop: HALF_TOP,
        viewportHeight: VH,
        defaultBottomPx: DEFAULT_BOTTOM,
      }),
    ).toEqual({ translateY: -lift, interactive: false });

    expect(
      computeMapFabPlacement({
        sheetTop: HALF_TOP - 120,
        viewportHeight: VH,
        defaultBottomPx: DEFAULT_BOTTOM,
      }),
    ).toEqual({ translateY: -lift, interactive: false });
  });
});

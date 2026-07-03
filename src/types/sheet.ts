export interface BottomSheetSnapPoints {
  peek: number;
  full: number;
}

/** 공유 타이밍 상수는 `src/utils/sheetConstants.ts` 참고 */
export interface UseBottomSheetOptions {
  onDragChange?: (isDragging: boolean) => void;
  snapPoints: BottomSheetSnapPoints;
  onClose?: () => void;
  /** 드래그 종료 시 기본 스냅/닫기 대신 호출 (PoolDetailSheet 전환 애니메이션 등) */
  onAfterDrag?: (info: { translate: number; visible: number }) => void;
  closeThreshold?: number;
  enabled?: boolean;
}

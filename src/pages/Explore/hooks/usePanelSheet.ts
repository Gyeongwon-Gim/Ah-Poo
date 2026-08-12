import { useCallback, useEffect, useRef, useState } from 'react';

interface UsePanelSheetParams {
  show: boolean;
  onTopChange: (top: number) => void;
}

/**
 * PoolListSheet 하나를 다루는 데 필요한 반복 상태(collapsed·sheetTop·reopenRef)를 묶는다.
 * search/favorites/nearby/50m 네 패널이 전부 동일한 모양이라 훅으로 뺐다.
 */
export const usePanelSheet = ({ show, onTopChange }: UsePanelSheetParams) => {
  const [collapsed, setCollapsed] = useState(false);
  const [sheetTop, setSheetTop] = useState(Number.POSITIVE_INFINITY);
  const reopenListRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!show) setCollapsed(false);
  }, [show]);

  const handleTopChange = useCallback(
    (top: number) => {
      setSheetTop(top);
      onTopChange(top);
    },
    [onTopChange],
  );

  const handleReopen = useCallback(() => {
    reopenListRef.current?.();
  }, []);

  return {
    collapsed,
    onCollapsedChange: setCollapsed,
    sheetTop,
    reopenListRef,
    handleTopChange,
    handleReopen,
  };
};

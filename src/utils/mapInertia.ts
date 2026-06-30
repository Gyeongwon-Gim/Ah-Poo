import { clamp } from './clamp';

export interface MapInertiaOptions {
  friction?: number;
  minSpeed?: number;
  maxStartSpeed?: number;
}

/**
 * 카카오맵에 관성 드래그(손을 뗀 뒤 부드럽게 미끄러지는 패닝)를 붙인다.
 *
 * SDK 기본 드래그는 그대로 두고, 드래그 중에는 중심 좌표 변화로 속도만 추적한다.
 * dragend 직후 그 속도로 requestAnimationFrame 감속 패닝을 이어받는다.
 * (드래그 본체와 관성 구간이 시간상 겹치지 않으므로 이중 처리/튐이 없다.)
 */
export function attachMapInertia(
  map: kakao.maps.Map | null | undefined,
  container: HTMLElement | null | undefined,
  options: MapInertiaOptions = {},
): () => void {
  const { kakao } = window;
  if (!kakao?.maps || !map) return () => {};

  const {
    friction = 0.94,
    minSpeed = 2e-7,
    maxStartSpeed = 0.02,
  } = options;

  let rafId: number | null = null;
  let dragging = false;
  let lastCenter: kakao.maps.LatLng | null = null;
  let lastTime = 0;
  // 속도: 위경도 변화량 / ms
  let vLat = 0;
  let vLng = 0;

  const stopInertia = () => {
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  const clampSpeed = (v: number) => clamp(v, -maxStartSpeed, maxStartSpeed);

  const onDragStart = () => {
    dragging = true;
    stopInertia();
    lastCenter = map.getCenter();
    lastTime = performance.now();
    vLat = 0;
    vLng = 0;
  };

  const onDrag = () => {
    if (!dragging) return;
    const now = performance.now();
    const center = map.getCenter();
    const dt = Math.max(1, now - lastTime);

    if (lastCenter) {
      const instLat = (center.getLat() - lastCenter.getLat()) / dt;
      const instLng = (center.getLng() - lastCenter.getLng()) / dt;
      // 지수 평활: 직전 속도에 가중치를 줘 튀는 샘플을 완화
      vLat = vLat * 0.6 + instLat * 0.4;
      vLng = vLng * 0.6 + instLng * 0.4;
    }

    lastCenter = center;
    lastTime = now;
  };

  const onDragEnd = () => {
    dragging = false;

    vLat = clampSpeed(vLat);
    vLng = clampSpeed(vLng);

    if (Math.hypot(vLat, vLng) < minSpeed) return;

    const start = map.getCenter();
    let lat = start.getLat();
    let lng = start.getLng();
    let prevFrame = performance.now();

    const step = () => {
      const now = performance.now();
      const frameDt = Math.max(1, now - prevFrame);
      prevFrame = now;

      // 프레임 시간에 독립적인 감쇠
      const decay = Math.pow(friction, frameDt / 16);
      vLat *= decay;
      vLng *= decay;

      if (Math.hypot(vLat, vLng) < minSpeed) {
        rafId = null;
        return;
      }

      lat += vLat * frameDt;
      lng += vLng * frameDt;
      map.setCenter(new kakao.maps.LatLng(lat, lng));

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
  };

  // 사용자가 다시 만지면(또는 마커 탭 등) 관성 즉시 취소
  const onPointerDown = () => stopInertia();

  kakao.maps.event.addListener(map, 'dragstart', onDragStart);
  kakao.maps.event.addListener(map, 'drag', onDrag);
  kakao.maps.event.addListener(map, 'dragend', onDragEnd);
  container?.addEventListener('pointerdown', onPointerDown, { passive: true });
  container?.addEventListener('touchstart', onPointerDown, { passive: true });

  return () => {
    stopInertia();
    kakao.maps.event.removeListener(map, 'dragstart', onDragStart);
    kakao.maps.event.removeListener(map, 'drag', onDrag);
    kakao.maps.event.removeListener(map, 'dragend', onDragEnd);
    container?.removeEventListener('pointerdown', onPointerDown);
    container?.removeEventListener('touchstart', onPointerDown);
  };
}

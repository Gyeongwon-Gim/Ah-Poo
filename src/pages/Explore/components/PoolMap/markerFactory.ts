import { isFlagOn } from '@/services/pools';
import { isPoolOperating } from '@/utils/poolOperating';
import type { Pool } from '@/types/pool';

export interface MarkerEntry {
  iconOverlay: kakao.maps.CustomOverlay;
  iconEl: HTMLButtonElement;
  label: kakao.maps.CustomOverlay | null;
  labelEl: HTMLDivElement | null;
  pool: Pool;
  onClick: () => void;
}

const LABEL_VISIBLE_MAX_LEVEL = 5;

export function shouldShowMarkerLabels(level: number) {
  return level <= LABEL_VISIBLE_MAX_LEVEL;
}

export function syncMarkerLabelVisibility(
  map: kakao.maps.Map,
  store: Map<string, MarkerEntry>,
) {
  const showLabels = shouldShowMarkerLabels(map.getLevel());
  for (const [, { label }] of store) {
    label?.setMap(showLabels ? map : null);
  }
}

export function createPoolMarkerIconEl(pool: Pool) {
  const button = document.createElement('button');
  button.type = 'button';
  const classes = ['pool-marker-icon'];
  if (isFlagOn(pool?.is50m)) classes.push('pool-marker-icon--50m');
  if (isPoolOperating(pool)) classes.push('pool-marker-icon--operating');
  button.className = classes.join(' ');

  const symbol = document.createElement('span');
  symbol.className = 'pool-marker-icon__symbol material-symbols-outlined';
  symbol.textContent = 'pool';
  symbol.setAttribute('aria-hidden', 'true');

  button.appendChild(symbol);
  return button;
}

export function createUserLocationMarkerEl() {
  const root = document.createElement('div');
  root.className = 'user-location-marker';
  root.setAttribute('aria-hidden', 'true');

  const pulse = document.createElement('span');
  pulse.className = 'user-location-marker__pulse';

  const dot = document.createElement('span');
  dot.className = 'user-location-marker__dot';

  root.appendChild(pulse);
  root.appendChild(dot);
  return root;
}

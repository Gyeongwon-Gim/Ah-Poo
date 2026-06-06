import { MapPin } from 'lucide-react';

const ACTIVE_COLOR = '#0f172a';

/** 비활성 — 테두리만 (lucide MapPin) */
export function MapPinNavInactive({ className }) {
  return (
    <MapPin
      className={className}
      size={22}
      strokeWidth={1.5}
      fill="none"
      aria-hidden
    />
  );
}

/** 활성 — 같은 핀 실루엣, 안쪽 채움 */
export function MapPinNavActive({ className }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"
        fill={ACTIVE_COLOR}
      />
      <circle cx="12" cy="10" r="2.25" fill="#fff" />
    </svg>
  );
}

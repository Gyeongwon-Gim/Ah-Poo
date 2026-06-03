export const SWIMMING_WORKOUT_DATA = {
  '2026-05-04': { free: 800, breast: 400, back: 200, fly: 100 },
  '2026-05-06': { free: 1200, breast: 0, back: 400, fly: 0 },
  '2026-05-07': { free: 500, breast: 500, back: 500, fly: 500 },
  '2026-05-11': { free: 2000, breast: 200, back: 0, fly: 0 },
  '2026-05-13': { free: 400, breast: 300, back: 200, fly: 600 },
  '2026-05-15': { free: 0, breast: 1500, back: 0, fly: 0 },
  '2026-05-19': { free: 1000, breast: 500, back: 500, fly: 200 },
  '2026-05-22': { free: 600, breast: 200, back: 800, fly: 100 },
}

export function formatDateKey(year, monthIndex, day) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function getWorkoutByDate(dateStr) {
  return SWIMMING_WORKOUT_DATA[dateStr] ?? null
}

export function getTotalMeters(record) {
  return record.free + record.breast + record.back + record.fly
}

export const STROKE_ITEMS = [
  { key: 'free', label: 'FREE', stroke: '자유형', color: 'text-blue-600' },
  { key: 'breast', label: 'BRST', stroke: '평영', color: 'text-cyan-600' },
  { key: 'back', label: 'BACK', stroke: '배영', color: 'text-sky-500' },
  { key: 'fly', label: 'FLY', stroke: '접영', color: 'text-lime-600' },
]

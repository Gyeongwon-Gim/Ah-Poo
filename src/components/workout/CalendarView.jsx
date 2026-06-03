import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, X } from 'lucide-react'
import { SWIMMING_WORKOUT_DATA, formatDateKey } from '../../data/swimmingWorkouts'
import DayWaves from './DayWaves'
import './CalendarView.css'

const MONTHS = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월',
]

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function daysInMonth(y, m) {
  return new Date(y, m + 1, 0).getDate()
}

function firstDayOfMonth(y, m) {
  return new Date(y, m, 1).getDay()
}

function CalendarView({ workoutData = SWIMMING_WORKOUT_DATA, onDayClick }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showPicker, setShowPicker] = useState(false)
  const [pickerYear, setPickerYear] = useState(currentDate.getFullYear())
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [hapticDay, setHapticDay] = useState(null)
  const dragStartPos = useRef(0)
  const containerRef = useRef(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const days = daysInMonth(year, month)
  const startDay = firstDayOfMonth(year, month)

  const calendarDays = []
  for (let i = 0; i < startDay; i++) calendarDays.push(null)
  for (let i = 1; i <= days; i++) calendarDays.push(i)

  useEffect(() => {
    setPickerYear(currentDate.getFullYear())
  }, [currentDate])

  const handlePointerDown = (e) => {
    if (showPicker) return
    setIsDragging(true)
    dragStartPos.current = e.clientX ?? (e.touches?.[0] ? e.touches[0].clientX : 0)
  }

  const handlePointerMove = (e) => {
    if (!isDragging) return
    const clientX = e.clientX ?? (e.touches?.[0] ? e.touches[0].clientX : 0)
    const offset = clientX - dragStartPos.current
    setDragOffset(Math.max(Math.min(offset * 0.1, 12), -12))
  }

  const handlePointerUp = () => {
    setIsDragging(false)
    setDragOffset(0)
  }

  const handleDayTap = (day) => {
    if (!day) return
    setHapticDay(day)
    setTimeout(() => setHapticDay(null), 150)
    const dateStr = formatDateKey(year, month, day)
    onDayClick?.(dateStr, workoutData[dateStr] ?? null)
  }

  const selectMonth = (monthIndex) => {
    setCurrentDate(new Date(pickerYear, monthIndex))
    setShowPicker(false)
  }

  return (
    <div
      ref={containerRef}
      className="w-full bg-white/50 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_24px_50px_rgba(14,165,233,0.12)] p-4 border border-white/60 relative overflow-visible flex flex-col"
      onPointerDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
    >
      <div className="flex items-center justify-end mb-4 px-1">
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className="flex items-center gap-1.5 px-4 py-2 bg-white/80 text-slate-800 text-xs font-black rounded-full border border-white/80 shadow-sm active:scale-95"
        >
          <CalendarDays size={14} className="text-[#2563eb]" />
          <span>{currentDate.toLocaleDateString('ko-KR', { month: 'short' })}</span>
        </button>
      </div>

      {showPicker && (
        <div className="absolute inset-0 z-50 bg-slate-900/10 backdrop-blur-2xl rounded-[2.5rem] flex items-end justify-center">
          <div className="bg-white/95 w-full rounded-t-[2rem] shadow-2xl border-t border-white/60 overflow-hidden pb-8 max-h-[90%]">
            <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => setPickerYear(pickerYear - 1)} className="p-1 text-slate-400">
                  <ChevronLeft size={20} />
                </button>
                <span className="text-lg font-black text-slate-800">{pickerYear}년</span>
                <button type="button" onClick={() => setPickerYear(pickerYear + 1)} className="p-1 text-slate-400">
                  <ChevronRight size={20} />
                </button>
              </div>
              <button type="button" onClick={() => setShowPicker(false)} className="p-2 bg-slate-100 rounded-full">
                <X size={14} />
              </button>
            </div>
            <div className="p-4 grid grid-cols-3 gap-2">
              {MONTHS.map((m, idx) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => selectMonth(idx)}
                  className={`py-3.5 rounded-2xl text-sm font-bold border
                    ${month === idx && year === pickerYear
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-white/50 text-slate-600 border-slate-100'}
                  `}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6 bg-white/40 border border-white/40 p-1.5 rounded-2xl shadow-inner">
        <button
          type="button"
          onClick={() => setCurrentDate(new Date(year, month - 1))}
          className="p-2 bg-white/60 rounded-xl text-blue-500/80 shadow-sm"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="font-extrabold text-sm text-slate-800">
          {currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
        </span>
        <button
          type="button"
          onClick={() => setCurrentDate(new Date(year, month + 1))}
          className="p-2 bg-white/60 rounded-xl text-blue-500/80 shadow-sm"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="flex justify-between items-center px-1 mb-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
        <div className="flex gap-3">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> 자</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400" /> 평</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-300" /> 배</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-lime-400" /> 접</span>
        </div>
        <span className="text-[8px] opacity-70">단위: m</span>
      </div>

      <div className="grid grid-cols-7 gap-2.5 relative z-10 mb-2">
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className={`text-center text-[10px] font-black pb-2
              ${i === 0 ? 'text-rose-400/80' : i === 6 ? 'text-sky-400/80' : 'text-blue-300/60'}`}
          >
            {d}
          </div>
        ))}

        {calendarDays.map((day, idx) => {
          const dateStr = day ? formatDateKey(year, month, day) : null
          const data = dateStr ? workoutData[dateStr] : null
          const hasRecord = Boolean(data)

          return (
            <div
              key={idx}
              role={day ? 'button' : undefined}
              tabIndex={day ? 0 : undefined}
              onClick={() => handleDayTap(day)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleDayTap(day) }}
              className={`relative aspect-[1/1.25] rounded-[1.2rem] border transition-all duration-300
                ${day ? 'bg-white/30 shadow-sm' : 'border-transparent'}
                ${hasRecord ? 'cursor-pointer active:scale-90' : 'opacity-70'}
                ${hapticDay === day ? 'scale-95' : ''}
              `}
            >
              {day && (
                <>
                  <span
                    className={`absolute top-2.5 left-2.5 text-[11px] font-black z-30
                      ${idx % 7 === 0 ? 'text-rose-500/40' : idx % 7 === 6 ? 'text-sky-500/40' : 'text-slate-400/50'}
                    `}
                  >
                    {day}
                  </span>
                  <DayWaves data={data} dragOffset={dragOffset} isDragging={isDragging} />
                </>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-center text-slate-400/80 text-[10px] font-bold mt-2 pb-1">
        기록이 있는 날을 탭하면 상세를 볼 수 있어요
      </p>
    </div>
  )
}

export default CalendarView

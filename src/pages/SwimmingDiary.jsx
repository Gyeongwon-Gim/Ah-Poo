import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  X,
  Waves,
} from 'lucide-react';

function AquaFlow() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedData, setSelectedData] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(currentDate.getFullYear());

  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef(0);
  const containerRef = useRef(null);

  const [hapticDay, setHapticDay] = useState(null);

  const swimmingData = {
    '2026-05-04': { free: 800, breast: 400, back: 200, fly: 100 },
    '2026-05-06': { free: 1200, breast: 0, back: 400, fly: 0 },
    '2026-05-07': { free: 500, breast: 500, back: 500, fly: 500 },
    '2026-05-11': { free: 2000, breast: 200, back: 0, fly: 0 },
    '2026-05-13': { free: 400, breast: 300, back: 200, fly: 600 },
    '2026-05-15': { free: 0, breast: 1500, back: 0, fly: 0 },
    '2026-05-19': { free: 1000, breast: 500, back: 500, fly: 200 },
    '2026-05-22': { free: 600, breast: 200, back: 800, fly: 100 },
  };

  const months = [
    '1월',
    '2월',
    '3월',
    '4월',
    '5월',
    '6월',
    '7월',
    '8월',
    '9월',
    '10월',
    '11월',
    '12월',
  ];

  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const firstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const handlePointerDown = (e) => {
    if (showPicker) return;
    setIsDragging(true);
    dragStartPos.current =
      e.clientX ?? (e.touches?.[0] ? e.touches[0].clientX : 0);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const clientX = e.clientX ?? (e.touches?.[0] ? e.touches[0].clientX : 0);
    const offset = clientX - dragStartPos.current;
    setDragOffset(Math.max(Math.min(offset * 0.1, 12), -12));
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setDragOffset(0);
  };

  const handleDayTap = (day, data) => {
    if (!day) return;
    setHapticDay(day);
    setTimeout(() => setHapticDay(null), 150);

    if (data) {
      if (selectedData?.day === day) {
        setSelectedData(null);
      } else {
        setSelectedData({ day, ...data });
      }
    } else {
      setSelectedData(null);
    }
  };

  const selectMonth = (monthIndex) => {
    setCurrentDate(new Date(pickerYear, monthIndex));
    setShowPicker(false);
    setSelectedData(null);
  };

  const renderWaves = (data) => {
    if (!data) return null;
    const maxHeight = 100;
    const getH = (val) => (val / 2500) * maxHeight;

    const tiltStyle = {
      transform: `rotate(${dragOffset}deg) skewX(${dragOffset * 0.25}deg)`,
      transition: isDragging
        ? 'none'
        : 'transform 0.6s cubic-bezier(0.1, 0.9, 0.2, 1)',
      transformOrigin: 'bottom center',
    };

    return (
      <div
        className="absolute inset-0 w-full h-full overflow-hidden rounded-[1rem] flex flex-col-reverse opacity-100"
        style={tiltStyle}
      >
        {data.fly > 0 && (
          <div
            className="relative w-full overflow-visible"
            style={{ height: `${getH(data.fly)}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#bef264]/80 to-[#84cc16]/95 backdrop-blur-[1px]" />
            <div className="absolute -top-3 left-[-50%] w-[200%] h-10 bg-[#bef264]/40 border-t border-white/50 rounded-[35%_65%_50%_50%] animate-wave-heavy shadow-[0_-2px_6px_rgba(190,242,100,0.25)]" />
          </div>
        )}
        {data.back > 0 && (
          <div
            className="relative w-full overflow-visible"
            style={{ height: `${getH(data.back)}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#7dd3fc]/80 to-[#0ea5e9]/95 backdrop-blur-[1px]" />
            <div className="absolute -top-3 left-[-50%] w-[200%] h-8 bg-[#7dd3fc]/40 border-t border-white/50 rounded-[85%_15%_75%_25%] animate-wave-jagged shadow-[0_-2px_6px_rgba(125,211,252,0.25)]" />
          </div>
        )}
        {data.breast > 0 && (
          <div
            className="relative w-full overflow-visible"
            style={{ height: `${getH(data.breast)}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#22d3ee]/80 to-[#0891b2]/95 backdrop-blur-[1px]" />
            <div className="absolute -top-3 left-[-50%] w-[200%] h-8 bg-[#22d3ee]/40 border-t border-white/50 rounded-[48%_52%_50%_50%] animate-wave-rolling shadow-[0_-2px_6px_rgba(34,211,238,0.25)]" />
          </div>
        )}
        {data.free > 0 && (
          <div
            className="relative w-full overflow-visible"
            style={{ height: `${getH(data.free)}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#3b82f6]/80 to-[#1e40af]/95 backdrop-blur-[1px]" />
            <div className="absolute -top-2 left-[-50%] w-[200%] h-6 bg-[#3b82f6]/40 border-t border-white/50 rounded-[50%_50%_50%_50%] animate-wave-fast-pulse shadow-[0_-2px_6px_rgba(59,130,246,0.25)]" />
          </div>
        )}
      </div>
    );
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  const calendarDays = [];
  for (let i = 0; i < startDay; i++) calendarDays.push(null);
  for (let i = 1; i <= days; i++) calendarDays.push(i);

  useEffect(() => {
    setPickerYear(currentDate.getFullYear());
  }, [currentDate]);

  return (
    <div
      className="app-route min-h-screen bg-gradient-to-b from-[#f0f9ff] via-[#e0f2fe] to-[#bae6fd] px-3 pt-6 pb-24 font-sans text-slate-900 select-none overflow-x-hidden flex flex-col w-full"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
    >
      {/* <style>{`
        @keyframes wave-fast-pulse {
          0% { transform: translateX(0) scaleY(1); }
          50% { transform: translateX(6%) scaleY(0.9); }
          100% { transform: translateX(0) scaleY(1); }
        }
        .animate-wave-fast-pulse { animation: wave-fast-pulse 2.8s infinite ease-in-out; }

        @keyframes wave-rolling {
          0% { transform: translateX(0) scaleY(1); }
          50% { transform: translateX(-10%) scaleY(0.85); }
          100% { transform: translateX(0) scaleY(1); }
        }
        .animate-wave-rolling { animation: wave-rolling 5.5s infinite ease-in-out; }

        @keyframes wave-jagged {
          0% { transform: translateX(0) skewX(0deg); }
          50% { transform: translateX(12%) skewX(2deg) scaleY(1.05); }
          100% { transform: translateX(0) skewX(0deg); }
        }
        .animate-wave-jagged { animation: wave-jagged 4.8s infinite ease-in-out; }

        @keyframes wave-heavy {
          0% { transform: translateX(0) scaleY(1); }
          50% { transform: translateX(-5%) scaleY(1.2); }
          100% { transform: translateX(0) scaleY(1); }
        }
        .animate-wave-heavy { animation: wave-heavy 8s infinite ease-in-out; }
      `}</style> */}

      <div
        ref={containerRef}
        className="w-full bg-white/50 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_24px_50px_rgba(14,165,233,0.12)] p-4 border border-white/60 relative overflow-visible flex flex-col justify-between"
        onPointerDown={handlePointerDown}
        onTouchStart={handlePointerDown}
      >
        <div className="flex items-center justify-between mb-8 px-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#0d3ca4] rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
              <Waves size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">
                어푸!
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            className="flex items-center gap-1.5 px-4 py-2 bg-white/80 backdrop-blur-md text-slate-800 text-xs font-black rounded-full border border-white/80 shadow-sm active:scale-95 transition-all"
          >
            <CalendarDays size={14} className="text-[#2563eb]" />
            <span>
              {currentDate.toLocaleDateString('ko-KR', { month: 'short' })}
            </span>
          </button>
        </div>

        {showPicker && (
          <div className="absolute inset-0 z-50 bg-slate-900/10 backdrop-blur-2xl rounded-[2.5rem] flex items-end justify-center animate-in fade-in slide-in-from-bottom-5 duration-300">
            <div className="bg-white/95 backdrop-blur-xl w-full rounded-t-[2rem] shadow-2xl border-t border-white/60 overflow-hidden pb-8 max-h-[90%]">
              <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setPickerYear(pickerYear - 1)}
                    className="p-1 text-slate-400 active:text-blue-600"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-lg font-black text-slate-800 tracking-tighter">
                    {pickerYear}년
                  </span>
                  <button
                    type="button"
                    onClick={() => setPickerYear(pickerYear + 1)}
                    className="p-1 text-slate-400 active:text-blue-600"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPicker(false)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="p-4 grid grid-cols-3 gap-2">
                {months.map((m, idx) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => selectMonth(idx)}
                    className={`py-3.5 rounded-2xl text-sm font-bold transition-all border
                      ${
                        month === idx && year === pickerYear
                          ? 'bg-blue-600 text-white border-blue-500 shadow-lg'
                          : 'bg-white/50 text-slate-600 border-slate-100 active:bg-slate-100'
                      }
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
            onClick={() => {
              setCurrentDate(new Date(year, month - 1));
              setSelectedData(null);
            }}
            className="p-2 bg-white/60 active:bg-white rounded-xl text-blue-500/80 shadow-sm"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="font-extrabold text-sm text-slate-800 tracking-tight">
            {currentDate.toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
            })}
          </span>

          <button
            type="button"
            onClick={() => {
              setCurrentDate(new Date(year, month + 1));
              setSelectedData(null);
            }}
            className="p-2 bg-white/60 active:bg-white rounded-xl text-blue-500/80 shadow-sm"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* <div className="flex justify-between items-center px-1 mb-6 text-[9px] font-black uppercase tracking-widest text-slate-400">
          <div className="flex gap-4">
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-white" />{' '}
              자
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 border border-white" />{' '}
              평
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-300 border border-white" />{' '}
              배
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-lime-400 border border-white" />{' '}
              접
            </div>
          </div>
          <span className="text-[8px] opacity-70">단위: m</span>
        </div> */}

        <div className="grid grid-cols-7 gap-2.5 relative z-10 mb-2">
          {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
            <div
              key={d}
              className={`text-center text-[10px] font-black pb-2 tracking-widest
                ${i === 0 ? 'text-rose-400/80' : i === 6 ? 'text-sky-400/80' : 'text-blue-300/60'}`}
            >
              {d}
            </div>
          ))}

          {calendarDays.map((day, idx) => {
            const dateStr = day
              ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              : null;
            const data = dateStr ? swimmingData[dateStr] : null;
            const isSelected = selectedData?.day === day;
            const isHaptic = hapticDay === day;

            return (
              <div
                key={idx}
                role={day ? 'button' : undefined}
                tabIndex={day ? 0 : undefined}
                onClick={() => handleDayTap(day, data)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ')
                    handleDayTap(day, data);
                }}
                className={`relative aspect-[1/1.25] rounded-[1.2rem] border transition-all duration-300 flex items-center justify-center
                  ${day ? 'bg-white/30  shadow-sm' : 'border-transparent'}
                  ${data ? 'active:scale-90 cursor-pointer' : 'opacity-100'}
                  ${isSelected ? 'scale-105 bg-white/90 border-blue-400 shadow-md ring-2 ring-blue-400/25 z-20' : ''}
                  ${isHaptic ? 'scale-95' : ''}
                `}
              >
                {day && (
                  <>
                    <span
                      className={`absolute top-2.5 left-2.5 text-[11px] font-black z-30 transition-colors
                      ${idx % 7 === 0 ? 'text-rose-500/40' : idx % 7 === 6 ? 'text-sky-500/40' : 'text-slate-400/50'}
                      ${isSelected ? 'text-slate-900 font-extrabold' : ''}
                    `}
                    >
                      {day}
                    </span>
                    {renderWaves(data)}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div
        className={`mobile-fixed-bottom bg-white/70 backdrop-blur-2xl rounded-t-[2.2rem] border-t border-white/60 shadow-[0_-15px_30px_rgba(0,0,0,0.06)] z-40 transition-transform duration-500 ease-out p-5 pb-8
          ${selectedData ? 'translate-y-0' : 'translate-y-full'}
        `}
      >
        <div className="w-12 h-1 bg-slate-300/60 rounded-full mx-auto mb-5" />

        {selectedData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100/50 pb-3">
              <div>
                <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">
                  {selectedData.day}일 운동 기록
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black tracking-widest text-blue-500 uppercase">
                  Total
                </span>
                <p className="text-2xl font-black text-slate-950 tracking-tight">
                  {(
                    selectedData.free +
                    selectedData.breast +
                    selectedData.back +
                    selectedData.fly
                  ).toLocaleString()}
                  m
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {[
                {
                  label: 'FREE',
                  val: selectedData.free,
                  color: 'text-blue-600',
                  stroke: '자유형',
                },
                {
                  label: 'BRST',
                  val: selectedData.breast,
                  color: 'text-cyan-600',
                  stroke: '평영',
                },
                {
                  label: 'BACK',
                  val: selectedData.back,
                  color: 'text-sky-500',
                  stroke: '배영',
                },
                {
                  label: 'FLY',
                  val: selectedData.fly,
                  color: 'text-lime-600',
                  stroke: '접영',
                },
              ].map((item) => {
                const isZero = item.val === 0;
                return (
                  <div
                    key={item.label}
                    className={`bg-white/60 border border-white p-3 rounded-2xl text-center shadow-sm flex flex-col justify-between h-[82px] transition-all
                      ${isZero ? 'opacity-30 scale-95 border-dashed' : 'border-slate-100'}
                    `}
                  >
                    <div>
                      <p
                        className={`text-[10px] font-black tracking-wider leading-none ${item.color}`}
                      >
                        {item.label}
                      </p>
                      <p className="text-[9px] font-medium text-slate-400 mt-1">
                        {item.stroke}
                      </p>
                    </div>
                    <p className="font-black text-base text-slate-800 tracking-tight mt-1">
                      {item.val}m
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* {!selectedData && (
        <p className="text-center text-slate-400/70 text-[10px] font-black tracking-[0.4em] uppercase mt-8 animate-pulse">
          TAP A WAVE DAY TO OPEN DETAIL SHEET
        </p>
      )} */}
    </div>
  );
}

export default AquaFlow;

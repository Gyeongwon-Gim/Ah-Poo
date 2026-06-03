function DayWaves({ data, dragOffset = 0, isDragging = false }) {
  if (!data) return null

  const maxHeight = 100
  const getH = (val) => (val / 2500) * maxHeight

  const tiltStyle = {
    transform: `rotate(${dragOffset}deg) skewX(${dragOffset * 0.25}deg)`,
    transition: isDragging ? 'none' : 'transform 0.6s cubic-bezier(0.1, 0.9, 0.2, 1)',
    transformOrigin: 'bottom center',
  }

  return (
    <div
      className="absolute inset-0 w-full h-full overflow-hidden rounded-[1rem] flex flex-col-reverse"
      style={tiltStyle}
    >
      {data.fly > 0 && (
        <div className="relative w-full overflow-visible" style={{ height: `${getH(data.fly)}%` }}>
          <div className="absolute inset-0 bg-gradient-to-b from-[#bef264]/80 to-[#84cc16]/95 backdrop-blur-[1px]" />
          <div className="absolute -top-3 left-[-50%] w-[200%] h-10 bg-[#bef264]/40 border-t border-white/50 rounded-[35%_65%_50%_50%] animate-wave-heavy shadow-[0_-2px_6px_rgba(190,242,100,0.25)]" />
        </div>
      )}
      {data.back > 0 && (
        <div className="relative w-full overflow-visible" style={{ height: `${getH(data.back)}%` }}>
          <div className="absolute inset-0 bg-gradient-to-b from-[#7dd3fc]/80 to-[#0ea5e9]/95 backdrop-blur-[1px]" />
          <div className="absolute -top-3 left-[-50%] w-[200%] h-8 bg-[#7dd3fc]/40 border-t border-white/50 rounded-[85%_15%_75%_25%] animate-wave-jagged shadow-[0_-2px_6px_rgba(125,211,252,0.25)]" />
        </div>
      )}
      {data.breast > 0 && (
        <div className="relative w-full overflow-visible" style={{ height: `${getH(data.breast)}%` }}>
          <div className="absolute inset-0 bg-gradient-to-b from-[#22d3ee]/80 to-[#0891b2]/95 backdrop-blur-[1px]" />
          <div className="absolute -top-3 left-[-50%] w-[200%] h-8 bg-[#22d3ee]/40 border-t border-white/50 rounded-[48%_52%_50%_50%] animate-wave-rolling shadow-[0_-2px_6px_rgba(34,211,238,0.25)]" />
        </div>
      )}
      {data.free > 0 && (
        <div className="relative w-full overflow-visible" style={{ height: `${getH(data.free)}%` }}>
          <div className="absolute inset-0 bg-gradient-to-b from-[#3b82f6]/80 to-[#1e40af]/95 backdrop-blur-[1px]" />
          <div className="absolute -top-2 left-[-50%] w-[200%] h-6 bg-[#3b82f6]/40 border-t border-white/50 rounded-[50%_50%_50%_50%] animate-wave-fast-pulse shadow-[0_-2px_6px_rgba(59,130,246,0.25)]" />
        </div>
      )}
    </div>
  )
}

export default DayWaves

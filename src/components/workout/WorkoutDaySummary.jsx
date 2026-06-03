import { getTotalMeters, STROKE_ITEMS } from '../../data/swimmingWorkouts'

function WorkoutDaySummary({ record, dayLabel }) {
  if (!record) return null
  const total = getTotalMeters(record)

  return (
    <div>
      <div className="flex items-center justify-between mb-6 border-b border-slate-100/50 pb-3">
        <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">{dayLabel}</h3>
        <div className="text-right">
          <span className="text-[10px] font-black tracking-widest text-blue-500 uppercase">Total</span>
          <p className="text-2xl font-black text-slate-950">{total.toLocaleString()}m</p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {STROKE_ITEMS.map((item) => {
          const val = record[item.key]
          const isZero = val === 0
          return (
            <div
              key={item.key}
              className={`bg-white/60 border p-3 rounded-2xl text-center shadow-sm flex flex-col justify-between h-[82px]
                ${isZero ? 'opacity-30 border-dashed' : 'border-slate-100'}
              `}
            >
              <div>
                <p className={`text-[10px] font-black ${item.color}`}>{item.label}</p>
                <p className="text-[9px] text-slate-400 mt-1">{item.stroke}</p>
              </div>
              <p className="font-black text-base text-slate-800 mt-1">{val}m</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default WorkoutDaySummary

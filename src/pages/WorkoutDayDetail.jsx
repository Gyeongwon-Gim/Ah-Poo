import { useNavigate, useParams } from 'react-router-dom'
import { getWorkoutByDate } from '../data/swimmingWorkouts'
import WorkoutDaySummary from '../components/workout/WorkoutDaySummary'

function formatDayLabel(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return dateStr
  return new Date(y, m - 1, d).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

function WorkoutDayDetail() {
  const { date } = useParams()
  const navigate = useNavigate()

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return (
      <div className="app-route min-h-screen bg-gradient-to-b from-[#f0f9ff] to-[#bae6fd] px-4 pt-6 pb-24">
        <div className="bg-white/80 rounded-2xl p-8 text-center">
          <h2 className="font-bold mb-4">잘못된 날짜입니다</h2>
          <button type="button" onClick={() => navigate('/workout')} className="px-5 py-3 bg-blue-600 text-white font-bold rounded-xl">
            운동기록으로
          </button>
        </div>
      </div>
    )
  }

  const record = getWorkoutByDate(date)

  if (!record) {
    return (
      <div className="app-route min-h-screen bg-gradient-to-b from-[#f0f9ff] to-[#bae6fd] px-4 pt-6 pb-24">
        <button type="button" onClick={() => navigate('/workout')} className="mb-4 px-4 py-2 bg-white/80 rounded-xl text-sm font-bold">
          ← 운동기록
        </button>
        <div className="bg-white/80 rounded-2xl p-8 text-center">
          <p className="text-4xl mb-4">📅</p>
          <h2 className="font-bold mb-2">기록이 없습니다</h2>
          <p className="text-sm text-slate-500">{formatDayLabel(date)}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-route min-h-screen bg-gradient-to-b from-[#f0f9ff] via-[#e0f2fe] to-[#bae6fd] px-3 pt-6 pb-24">
      <button type="button" onClick={() => navigate('/workout')} className="mb-5 px-4 py-2 bg-white/80 rounded-xl text-sm font-bold shadow-sm">
        ← 운동기록
      </button>
      <div className="bg-white/70 backdrop-blur-2xl rounded-[2rem] border border-white/60 shadow-lg p-5">
        <WorkoutDaySummary record={record} dayLabel={`${formatDayLabel(date)} 운동 기록`} />
      </div>
    </div>
  )
}

export default WorkoutDayDetail

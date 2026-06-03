import { useNavigate } from 'react-router-dom'
import { Waves } from 'lucide-react'
import CalendarView from '../components/workout/CalendarView'

function WorkoutRecord() {
  const navigate = useNavigate()

  const handleDayClick = (dateStr, data) => {
    if (!data) return
    navigate(`/workout/${dateStr}`)
  }

  return (
    <div className="app-route min-h-screen bg-gradient-to-b from-[#f0f9ff] via-[#e0f2fe] to-[#bae6fd] px-3 pt-6 pb-24 font-sans text-slate-900 select-none overflow-x-hidden flex flex-col w-full">
      <header className="flex items-center gap-3 mb-5 px-1">
        <div className="w-10 h-10 bg-[#0d3ca4] rounded-xl flex items-center justify-center shadow-md">
          <Waves size={22} className="text-white" />
        </div>
        <div>
          <p className="text-[10px] font-black tracking-[0.2em] text-blue-600/80 uppercase">Workout</p>
          <h1 className="text-xl font-black text-slate-900">운동기록</h1>
        </div>
      </header>
      <CalendarView onDayClick={handleDayClick} />
    </div>
  )
}

export default WorkoutRecord

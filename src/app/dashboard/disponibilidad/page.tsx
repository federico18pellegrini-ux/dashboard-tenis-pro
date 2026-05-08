import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AvailabilityManager } from '@/components/availability/AvailabilityManager'

type Club = { id: string; name: string }
type SlotRow = {
  club_id: string
  day_of_week: number
  start_time: string // "HH:MM:SS"
  active: boolean
}

export default async function DisponibilidadPage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: clubsData, error: clubsError }, { data: slotsData, error: slotsError }] = await Promise.all([
    supabase.from('clubs').select('id,name').order('name', { ascending: true }),
    supabase
      .from('availability_slots')
      .select('club_id,day_of_week,start_time,active')
      .eq('duration_minutes', 60),
  ])

  if (clubsError) throw new Error(clubsError.message)
  if (slotsError) throw new Error(slotsError.message)

  const clubs = (clubsData || []) as Club[]
  const slots = (slotsData || []) as SlotRow[]

  const byClub = new Map<string, Array<{ day_of_week: number; start_time: string; active: boolean }>>()
  for (const s of slots) {
    const start = s.start_time.slice(0, 5)
    const arr = byClub.get(s.club_id) || []
    arr.push({ day_of_week: s.day_of_week, start_time: start, active: s.active })
    byClub.set(s.club_id, arr)
  }

  const clubsWithSlots = clubs.map((c) => ({
    club: c,
    initialSlots: byClub.get(c.id) || [],
  }))

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-4 md:p-8 font-sans selection:bg-[#bdfd2c] selection:text-slate-950">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <Link
              href="/dashboard"
              className="group bg-slate-900 border border-slate-800 p-3 rounded-2xl hover:border-[#bdfd2c] transition-all shadow-xl"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-slate-500 group-hover:text-[#bdfd2c] transition-colors"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Link>
            <div className="space-y-1">
              <h1 className="text-4xl font-black tracking-tighter text-gray-950  uppercase italic leading-none">
                Disponibilidad
              </h1>
            </div>
          </div>
        </header>

        <AvailabilityManager clubs={clubsWithSlots} />
      </div>
    </div>
  )
}


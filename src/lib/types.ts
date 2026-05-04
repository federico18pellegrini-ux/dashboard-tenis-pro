export type Club = {
    id: string
    name: string
    slug?: string
    active?: boolean
  }
  
  export type Student = {
    id: string
    full_name: string
    phone?: string | null
    price_per_class_cents?: number | null
    club_id?: string | null
    active?: boolean
    [key: string]: any
  }
  
  export type Schedule = {
    id: string
    student_id: string
    club_id: string
    day_of_week: number
    start_time: string
    students?: Student | null
    clubs?: Club | null
  }
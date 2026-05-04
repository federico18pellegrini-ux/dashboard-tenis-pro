import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seedSchedules() {
  console.log('📅 Asignando horarios de prueba...');

  // 1. Traemos los alumnos y clubes reales
  const { data: students } = await supabase.from('students').select('id');
  const { data: clubs } = await supabase.from('clubs').select('id, name');

  if (!students || !clubs) return;

  const schedules = [
    // Lunes (1)
    { student_id: students[0].id, club_id: clubs.find(c => c.name === 'Cuba Villa de Mayo')?.id, day_of_week: 1, start_time: '09:00', end_time: '10:00' },
    { student_id: students[1].id, club_id: clubs.find(c => c.name === 'Padel al Río')?.id, day_of_week: 1, start_time: '18:00', end_time: '19:00' },
    // Martes (2)
    { student_id: students[2].id, club_id: clubs.find(c => c.name === 'Palermo')?.id, day_of_week: 2, start_time: '10:00', end_time: '11:00' },
    // Miércoles (3)
    { student_id: students[3].id, club_id: clubs.find(c => c.name === 'Cuba Villa de Mayo')?.id, day_of_week: 3, start_time: '08:00', end_time: '09:00' },
    // Jueves (4)
    { student_id: students[4].id, club_id: clubs.find(c => c.name === 'Padel al Río')?.id, day_of_week: 4, start_time: '20:00', end_time: '21:00' },
    // Viernes (5)
    { student_id: students[5].id, club_id: clubs.find(c => c.name === 'Palermo')?.id, day_of_week: 5, start_time: '17:00', end_time: '18:00' },
  ];

  const { error } = await supabase.from('schedules').insert(schedules);

  if (error) console.error('❌ Error:', error.message);
  else console.log('✅ Agenda cargada. ¡Ya podés refrescar el Dashboard!');
}

seedSchedules();
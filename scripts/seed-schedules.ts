import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seedSchedules() {
  console.log('📅 Poblando agenda de Padel Sartori...');

  const { data: students } = await supabase.from('students').select('id');
  const { data: clubs } = await supabase.from('clubs').select('id, name');

  if (!students || !clubs || students.length < 3) {
    console.error('❌ Error: Falta cargar alumnos o clubes.');
    return;
  }

  const schedules = [
    { student_id: students[0].id, club_id: clubs.find(c => c.name === 'Cuba Villa de Mayo')?.id, day_of_week: 1, start_time: '09:00', end_time: '10:00' },
    { student_id: students[1].id, club_id: clubs.find(c => c.name === 'Padel al Río')?.id, day_of_week: 1, start_time: '18:00', end_time: '19:00' },
    { student_id: students[2].id, club_id: clubs.find(c => c.name === 'Palermo')?.id, day_of_week: 2, start_time: '10:00', end_time: '11:00' },
    { student_id: students[3].id, club_id: clubs.find(c => c.name === 'Cuba Villa de Mayo')?.id, day_of_week: 3, start_time: '08:00', end_time: '09:00' }
  ];

  const { error } = await supabase.from('schedules').insert(schedules);

  if (error) console.error('❌ Error:', error.message);
  else console.log('✅ Agenda cargada. ¡Ya podés refrescar el navegador!');
}

seedSchedules();
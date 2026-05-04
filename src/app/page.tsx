import { redirect } from 'next/navigation';

export default function Home() {
  // Por ahora, la home redirige al sistema de gestión.
  // En la Prioridad 3 del brief, aquí irá la landing pública del coach.
  redirect('/dashboard');
}
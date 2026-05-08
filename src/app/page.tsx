import Image from 'next/image'
import { redirect } from 'next/navigation'

export default function RootPage() {
  // Redirección automática al Login para asegurar el flujo del dashboard
  redirect('/login')

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="relative flex flex-col items-center">
        {/* El resplandor (glow) de fondo premium */}
        <div className="absolute inset-0 bg-[#bdfd2c] blur-[50px] opacity-20 animate-pulse"></div>
        
        <Image 
          src="/brand-logo.png" 
          alt="Logo Padel Sartori" 
          width={180} 
          height={180} 
          priority 
          className="relative z-10 drop-shadow-[0_0_25px_rgba(189,253,44,0.4)] object-contain"
        />
        
        <div className="mt-8 text-center relative z-10">
          <h1 className="text-xl font-black text-white uppercase italic tracking-tighter">
            Padel Sartori
          </h1>
          <p className="text-[10px] font-bold text-[var(--color-text-heading)]  uppercase tracking-[0.4em] mt-2">
            Cargando Panel de Control...
          </p>
        </div>
      </div>
    </div>
  )
}
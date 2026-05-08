import { login, resetPasswordAction } from './actions'

// Componente de Logo Vectorizado con estilo Neon
const Logo = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg 
    viewBox="0 0 100 100" 
    className={className}
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Isotipo: Círculo de Padel con efecto de red */}
    <circle cx="50" cy="50" r="42" stroke="#bdfd2c" strokeWidth="4" strokeDasharray="4 2" className="opacity-50" />
    <circle cx="50" cy="50" r="38" stroke="#bdfd2c" strokeWidth="6" />
    <path d="M35 50 C 35 35, 65 35, 65 50 C 65 65, 35 65, 35 50" stroke="#bdfd2c" strokeWidth="4" />
    <path d="M50 30 L50 70 M30 50 L70 50" stroke="#bdfd2c" strokeWidth="2" opacity="0.5" />
  </svg>
)

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const resolvedParams = await searchParams;
  const error = resolvedParams?.error;
  const message = resolvedParams?.message;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-950 selection:bg-[#bdfd2c] selection:text-slate-950">
      <div className="w-full max-w-sm space-y-8 bg-slate-900 p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-800/50">
        
        {/* Header con Logo */}
        <div className="text-center flex flex-col items-center">
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-[#bdfd2c] blur-[30px] opacity-20 animate-pulse"></div>
            <Logo className="w-20 h-20 relative z-10 drop-shadow-[0_0_15px_rgba(189,253,44,0.4)]" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
            Padel Sartori
          </h1>
          <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-[0.2em]">
            Gestión de Sedes • Control Total
          </p>
        </div>

        <form className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block" htmlFor="email">
                Email Institucional
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="block w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:border-[#bdfd2c] focus:ring-1 focus:ring-[#bdfd2c] outline-none transition-all placeholder:text-slate-800"
                placeholder="tu@ejemplo.com"
              />
            </div>
            
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="block w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:border-[#bdfd2c] focus:ring-1 focus:ring-[#bdfd2c] outline-none transition-all"
              />
            </div>
          </div>

          {/* Mensajes de Estado */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 py-3 rounded-xl">
              <p className="text-[10px] text-rose-500 text-center font-black uppercase tracking-wider">{error}</p>
            </div>
          )}

          {message && (
            <div className="bg-[#bdfd2c]/10 border border-[#bdfd2c]/20 py-3 rounded-xl">
              <p className="text-[10px] text-gray-950  text-center font-black uppercase tracking-wider">{message}</p>
            </div>
          )}

          <div className="space-y-4 pt-2">
            <button
              formAction={login}
              className="w-full flex justify-center py-5 px-4 rounded-2xl shadow-[0_10px_30px_rgba(189,253,44,0.15)] text-sm font-black text-white dark:text-slate-950 bg-[var(--color-accent-secondary)] hover:bg-green-800  dark:hover:bg-[#aef026] hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest"
            >
              Entrar al Panel
            </button>

            <div className="text-center">
              <button
                formAction={resetPasswordAction}
                className="text-[9px] font-black text-slate-600 hover:text-[#bdfd2c] transition-colors uppercase tracking-[0.2em] py-2"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {/* Footer sutil */}
      <p className="mt-8 text-[9px] font-bold text-slate-700 uppercase tracking-[0.3em]">
        Desarrollado para Sedes Tigre & Benavídez
      </p>
    </div>
  )
}
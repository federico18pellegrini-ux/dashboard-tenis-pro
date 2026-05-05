import { login, resetPasswordAction } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const resolvedParams = await searchParams;
  const error = resolvedParams?.error;
  const message = resolvedParams?.message;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-950">
      <div className="w-full max-w-sm space-y-8 bg-slate-900 p-8 rounded-[2rem] shadow-2xl border border-slate-800">
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
            Padel Sartori
          </h1>
          <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-[0.2em]">
            Ingresa tus credenciales para continuar
          </p>
        </div>

        <form className="space-y-5">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="block w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm font-bold text-white focus:border-[#bdfd2c] focus:ring-1 focus:ring-[#bdfd2c] outline-none transition-all placeholder:text-slate-700"
              placeholder="tu@email.com"
            />
          </div>
          
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="block w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm font-bold text-white focus:border-[#bdfd2c] focus:ring-1 focus:ring-[#bdfd2c] outline-none transition-all"
            />
          </div>

          {error && (
            <p className="text-[10px] text-rose-500 text-center font-black uppercase tracking-wider animate-pulse">{error}</p>
          )}

          {message && (
            <p className="text-[10px] text-[#bdfd2c] text-center font-black uppercase tracking-wider">{message}</p>
          )}

          <div className="space-y-4">
            <button
              formAction={login}
              className="w-full flex justify-center py-4 px-4 rounded-2xl shadow-[0_10px_20px_rgba(189,253,44,0.1)] text-sm font-black text-slate-950 bg-[#bdfd2c] hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest"
            >
              Iniciar Sesión
            </button>

            {/* Link de Autogestión de Contraseña */}
            <div className="text-center pt-2">
              <button
                formAction={resetPasswordAction}
                className="text-[9px] font-black text-slate-500 hover:text-[#bdfd2c] transition-colors uppercase tracking-[0.2em]"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
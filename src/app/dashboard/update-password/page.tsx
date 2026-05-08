'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    // Movemos las variables adentro para que Vercel no las pida durante el build
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      setMessage('Error: No se detectaron las credenciales de conexión.')
      return
    }

    // El cliente se crea recién en este momento (solo en el navegador)
    const supabase = createBrowserClient(url, key)

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setMessage('Error: ' + error.message)
    } else {
      setMessage('¡Contraseña actualizada con éxito! Ya podés volver al inicio.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-sm bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-white uppercase italic">Nueva Contraseña</h1>
          <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-widest">
            Establecé tu nueva clave de acceso para Padel Sartori
          </p>
        </div>
        
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">
              Contraseña Nueva
            </label>
            <input
              type="password"
              placeholder="Escribí tu nueva clave"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm font-bold text-white focus:border-[#bdfd2c] focus:ring-1 focus:ring-[#bdfd2c] outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit"
            className="w-full py-4 rounded-2xl font-black text-white dark:text-slate-950 bg-[var(--color-accent-secondary)] hover:bg-green-800 dark:bg-[#bdfd2c] dark:hover:bg-[#a5e620] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_20px_rgba(189,253,44,0.1)]"
          >
            Actualizar Clave
          </button>
          
          {message && (
            <p className={`text-[10px] text-center font-black uppercase mt-4 tracking-wider ${message.includes('Error') ? 'text-rose-500' : 'text-gray-950 dark:text-[#ADFF2F]'}`}>
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
'use client'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const supabase = createClientComponentClient()

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setMessage('Error: ' + error.message)
    else setMessage('¡Contraseña actualizada con éxito! Ya podés volver al inicio.')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-sm bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-2xl">
        <h1 className="text-2xl font-black text-white uppercase italic text-center mb-6">Nueva Contraseña</h1>
        <form onSubmit={handleUpdate} className="space-y-4">
          <input
            type="password"
            placeholder="Escribí tu nueva clave"
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white focus:border-[#bdfd2c] outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="w-full py-4 rounded-2xl font-black text-slate-950 bg-[#bdfd2c] uppercase tracking-widest hover:scale-[1.02] transition-all">
            Actualizar
          </button>
          {message && <p className="text-[10px] text-center text-[#bdfd2c] font-black uppercase mt-4">{message}</p>}
        </form>
      </div>
    </div>
  )
}
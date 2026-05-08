'use client';

import { useState } from 'react';
import { createManualContact } from '@/lib/actions/contacts';
import { useRouter } from 'next/navigation';

export function AddContactModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const tags = (formData.get('tags') as string).split(',').map(t => t.trim()).filter(t => t !== '');
    
    const result = await createManualContact({
      full_name: formData.get('full_name') as string,
      phone: formData.get('phone') as string,
      tags,
      notes: formData.get('notes') as string,
    });

    if (result.success) {
      setIsOpen(false);
      router.refresh();
    } else {
      alert(result.error);
    }
    setLoading(false);
  }

  if (!isOpen) return (
    <button onClick={() => setIsOpen(true)} className="w-full md:w-auto bg-[var(--color-accent-secondary)] hover:bg-green-800 dark:bg-[#bdfd2c] dark:hover:bg-[#a5e620] text-white dark:text-slate-950 px-6 py-3 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-[0_10px_20px_rgba(189,253,44,0.2)] uppercase tracking-tighter">
      + Nuevo Alumno
    </button>
  );

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-[11000] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] w-full max-w-md space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <h2 className="text-2xl font-black tracking-tighter text-gray-950 dark:text-[#ADFF2F] uppercase italic">Nuevo Prospecto</h2>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre Completo</label>
            <input name="full_name" required className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm font-bold text-white outline-none focus:border-[#bdfd2c] transition-all mt-1" />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Teléfono</label>
            <input name="phone" required className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm font-bold text-white outline-none focus:border-[#bdfd2c] transition-all mt-1" />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Etiquetas (separadas por coma)</label>
            <input name="tags" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm font-bold text-white outline-none focus:border-[#bdfd2c] transition-all mt-1" />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setIsOpen(false)} className="flex-1 bg-slate-800 text-slate-400 font-bold py-4 rounded-2xl text-sm">CANCELAR</button>
            <button type="submit" disabled={loading} className="flex-1 bg-[var(--color-accent-secondary)] hover:bg-green-800 dark:bg-[#bdfd2c] dark:hover:bg-[#a5e620] text-white dark:text-slate-950 font-black py-4 rounded-2xl text-sm shadow-[0_0_20px_rgba(189,253,44,0.3)] disabled:opacity-50">
              {loading ? 'GUARDANDO...' : 'CREAR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
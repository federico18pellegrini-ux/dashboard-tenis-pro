import Image from 'next/image'

// ... buscá la parte del Header del Sidebar:

<div className="p-8 flex items-center gap-3">
  <Image 
    src="/brand-logo.png" 
    alt="Sartori Logo" 
    width={32} 
    height={32} 
    className="object-contain"
  />
  <div>
    <h2 className="text-sm font-black text-white uppercase italic tracking-tighter">
      Padel Sartori
    </h2>
    <span className="text-[8px] font-bold text-[var(--color-text-heading)]  uppercase tracking-[0.3em]">
      Control Panel
    </span>
  </div>
</div>
import Image from 'next/image' // Asegurate de tener este import

// ... dentro del componente LoginPage, buscá el Header con Logo:

<div className="mb-6 relative">
  {/* El resplandor (glow) de fondo se mantiene para darle el toque premium */}
  <div className="absolute inset-0 bg-[#bdfd2c] blur-[30px] opacity-20 animate-pulse"></div>
  
  <Image 
    src="/brand-logo.png" 
    alt="Logo Padel Sartori" 
    width={120} // Ajustá el tamaño a tu gusto
    height={120} 
    priority // Esto hace que el logo cargue instantáneamente
    className="relative z-10 drop-shadow-[0_0_15px_rgba(189,253,44,0.4)] object-contain"
  />
</div>
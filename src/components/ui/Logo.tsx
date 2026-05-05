export const Logo = ({ className = "w-12 h-12" }: { className?: string }) => (
    <svg 
      viewBox="0 0 100 100" // Ajustá esto según el viewBox de tu SVG original
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* PEGÁ AQUÍ EL CONTENIDO DE TU SVG (los <path... />) */}
      <circle cx="50" cy="50" r="40" stroke="#bdfd2c" strokeWidth="8" />
      <path d="M30 50 L70 50 M50 30 L50 70" stroke="#bdfd2c" strokeWidth="8" />
    </svg>
  )
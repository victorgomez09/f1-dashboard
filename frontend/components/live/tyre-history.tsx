"use client"

export const TyreStintHistory = ({ stints }: { stints: any[] }) => {
  if (!stints || stints.length === 0) return null;

  // Mapeo de colores oficiales
  const getCompoundColor = (compound: string) => {
    switch (compound?.toUpperCase()) {
      case 'SOFT': return 'bg-red-600 border-red-800';
      case 'MEDIUM': return 'bg-yellow-500 border-yellow-700';
      case 'HARD': return 'bg-slate-100 border-slate-400 text-black';
      case 'INTERMEDIATE': return 'bg-green-600 border-green-800';
      case 'WET': return 'bg-blue-600 border-blue-800';
      default: return 'bg-zinc-700 border-zinc-900';
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      {stints.map((stint, idx) => (
        <div key={idx} className="flex items-center group relative">
          {/* Círculo del neumático */}
          <div className={`
            w-5 h-5 rounded-full border-2 flex items-center justify-center 
            text-[9px] font-black transition-transform hover:scale-110 cursor-help
            ${getCompoundColor(stint.Compound)}
          `}>
            {stint.Compound?.[0]}
          </div>
          
          {/* Edad del neumático (solo en el actual o al pasar el ratón) */}
          <span className="text-[10px] ml-1 opacity-60 font-mono">
            {stint.TyreAge}
          </span>

          {/* Tooltip con DaisyUI */}
          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white p-1 rounded text-[9px] whitespace-nowrap z-50">
            {stint.Compound} - {stint.TyreAge} laps {stint.New === "true" ? '(New)' : '(Used)'}
          </div>

          {/* Flecha de unión si no es el último */}
          {idx < stints.length - 1 && (
            <span className="mx-0.5 opacity-20 text-[8px]">→</span>
          )}
        </div>
      ))}
    </div>
  );
};
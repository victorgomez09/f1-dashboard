import { useMemo } from 'react';

export const TrackMap = ({ mapData, driverPositions }: { mapData: any, driverPositions: any[] }) => {
  // Combinamos los puntos X e Y para el SVG
  const pathData = useMemo(() => {
    if (!mapData?.x || !mapData?.y) return "";
    return mapData.x.map((x: number, i: number) => `${x},${mapData.y[i]}`).join(' ');
  }, [mapData]);

  // Cálculo dinámico del ViewBox para que el mapa siempre esté centrado
  const viewBox = useMemo(() => {
    if (!mapData?.x) return "-1000 -1000 2000 2000";
    const minX = Math.min(...mapData.x) - 500;
    const minY = Math.min(...mapData.y) - 500;
    const maxX = Math.max(...mapData.x) + 500;
    const maxY = Math.max(...mapData.y) + 500;
    return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
  }, [mapData]);

  return (
    <div className="relative w-full h-[500px] bg-[#0d0d0d] border border-white/5 rounded-xl shadow-2xl">
      <svg viewBox={viewBox} className="w-full h-full p-4 overflow-visible">
        {/* Trazado del circuito con efecto neón suave */}
        <polyline
          points={pathData}
          fill="none"
          stroke="#2a2a2a"
          strokeWidth="80"
          strokeLinejoin="round"
        />
        
        {/* Pilotos */}
        {driverPositions.map((pos) => (
          <g key={pos.id} style={{ transition: 'all 0.3s ease' }} transform={`translate(${pos.x}, ${pos.y})`}>
            {/* Sombra del punto */}
            <circle r="120" fill="black" opacity="0.3" transform="translate(40, 40)" />
            {/* Punto del piloto */}
            <circle 
              r="100" 
              fill={pos.driver.color} 
              stroke="white" 
              strokeWidth="20" 
            />
            {/* Etiqueta del piloto (Abreviatura) */}
            <text
              y="-150"
              textAnchor="middle"
              fill="white"
              className="text-[140px] font-bold font-sans uppercase tracking-tighter"
              style={{ fontSize: '140px', paintOrder: 'stroke', stroke: '#000', strokeWidth: '20px' }}
            >
              {pos.driver.abbr}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};
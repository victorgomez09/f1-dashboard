"use client"

import { useMemo } from 'react';

interface Point {
    x: number;
    y: number;
}

interface DriverPos {
    id: string;
    x: number;
    y: number;
    color: string;
    abbr: string;
}

interface TrackMapProps {
    trackPoints: Point[];
    mapData: DriverPos[];
}

export const TrackMap = ({ trackPoints, mapData }: TrackMapProps) => {
    // 1. Cálculo dinámico del ViewBox para que el circuito siempre encaje perfecto
    const viewBox = useMemo(() => {
        if (!trackPoints || trackPoints.length === 0) {
            return "-12000 -12000 24000 24000";
        }

        const xs = trackPoints.map(p => p.x);
        const ys = trackPoints.map(p => -p.y); // Invertimos Y para SVG

        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        const width = maxX - minX;
        const height = maxY - minY;

        // Añadimos un margen del 10% para que los nombres de los pilotos no se corten
        const padding = Math.max(width, height) * 0.1;

        return `${minX - padding} ${minY - padding} ${width + padding * 2} ${height + padding * 2}`;
    }, [trackPoints]);

    // 2. Generación del path del circuito
    const trackPath = useMemo(() => {
        if (!trackPoints || trackPoints.length === 0) return "";
        return `M ${trackPoints[0].x} ${-trackPoints[0].y} ` +
            trackPoints.map(p => `L ${p.x} ${-p.y}`).join(" ") + " Z";
    }, [trackPoints]);

    // 3. Marcadores de Sectores (Cálculo aproximado basado en la longitud del array)
    // En una versión pro, el backend enviaría los índices exactos de S1 y S2
    const sectorMarkers = useMemo(() => {
        if (trackPoints.length < 10) return [];
        const s1Index = Math.floor(trackPoints.length * 0.33);
        const s2Index = Math.floor(trackPoints.length * 0.66);
        return [trackPoints[s1Index], trackPoints[s2Index]];
    }, [trackPoints]);

    return (
        <div className="w-full h-full relative bg-[#111] rounded-box overflow-hidden border border-white/5 shadow-inner">
            <svg
                viewBox={viewBox}
                className="w-full h-full transition-all duration-1000 ease-in-out"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Capa 1: Sombra/Brillo del asfalto */}
                <path
                    d={trackPath}
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="600"
                    strokeLinejoin="round"
                />

                {/* Capa 2: Trazado principal (Asfalto) */}
                <path
                    d={trackPath}
                    fill="none"
                    stroke="#333"
                    strokeWidth="300"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Capa 3: Línea de meta y sectores */}
                {trackPoints.length > 0 && (
                    <line
                        x1={trackPoints[0].x - 400} y1={-trackPoints[0].y}
                        x2={trackPoints[0].x + 400} y2={-trackPoints[0].y}
                        stroke="white" strokeWidth="150"
                    />
                )}

                {sectorMarkers.map((p, i) => (
                    <g key={i}>
                        <circle cx={p.x} cy={-p.y} r="150" fill="#facc15" />
                        <text x={p.x} y={-p.y - 400} fill="#facc15" fontSize="400" fontWeight="bold" textAnchor="middle">
                            S{i + 1}
                        </text>
                    </g>
                ))}

                {/* Capa 4: Pilotos */}
                {mapData.map((driver) => (
                    <g
                        key={driver.id}
                        className="transition-all duration-500 ease-linear"
                        style={{ transform: `translate(${driver.x}px, ${-driver.y}px)` }}
                    >
                        {/* Efecto de estela/glow */}
                        <circle r="450" fill={driver.color} className="opacity-20 animate-pulse" />

                        {/* Punto del coche */}
                        <circle
                            r="280"
                            fill={driver.color}
                            stroke="white"
                            strokeWidth="60"
                        />

                        {/* Etiqueta con ABBR (ALO, VER, etc) */}
                        <g transform="translate(0, -600)">
                            <rect
                                x="-450" y="-300" width="900" height="450"
                                fill="black" rx="100" className="opacity-80"
                            />
                            <text
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="fill-white font-black text-[350px] uppercase"
                            >
                                {driver.abbr}
                            </text>
                        </g>
                    </g>
                ))}
            </svg>

            {/* Marca de agua / Info overlay */}
            <div className="absolute top-4 right-4 flex flex-col items-end gap-1 pointer-events-none">
                <div className="badge badge-outline text-[10px] opacity-50">GPS Telemetry v2.0</div>
                <div className="flex gap-2">
                    <div className="flex items-center gap-1 text-[9px] uppercase"><span className="w-2 h-2 rounded-full bg-yellow-400"></span> Sector</div>
                    <div className="flex items-center gap-1 text-[9px] uppercase"><span className="w-2 h-2 rounded-full bg-white"></span> Start/Finish</div>
                </div>
            </div>
        </div>
    );
};
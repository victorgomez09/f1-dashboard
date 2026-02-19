"use client"

import { Driver, TimingAppData, TimingLine } from "@/types/state";

const getCompoundDetails = (compound: string) => {
    const c = compound?.toUpperCase() || '';
    if (c.includes('SOFT')) return { label: 'S', color: 'bg-red-600 text-white' };
    if (c.includes('MEDIUM')) return { label: 'M', color: 'bg-yellow-500 text-black' };
    if (c.includes('HARD')) return { label: 'H', color: 'bg-white text-black' };
    if (c.includes('INTER')) return { label: 'I', color: 'bg-green-600 text-white' };
    if (c.includes('WET')) return { label: 'W', color: 'bg-blue-600 text-white' };
    return { label: '?', color: 'bg-gray-600 text-white' };
  };

export default function LeaderBoardComponent({ driverList, timingData, timingAppData, lapCount }: {
    driverList?: Record<string, Driver>, timingData?: {
        Lines: Record<string, TimingLine>;
    }, timingAppData?: TimingAppData, lapCount?: any
}) {
    const drivers = driverList || {};
    const timings = timingData?.Lines || {};
    const appData = timingAppData?.Lines || {};
    const sessionLap = lapCount?.CurrentLap || 0;
    const totalLaps = lapCount?.TotalLaps || 0;

    const sortedCarNumbers = Object.keys(timings).sort((a, b) => {
        return parseInt(timings[a].Position) - parseInt(timings[b].Position);
    });

    const handleSectors = (sectors: any[]) => {
        return Array.isArray(sectors) ? sectors : Object.values(sectors || {})
    }

    return (
        <div className="card bg-base-300 w-full">
            <div className="card-body p-4">
                <div className="card bg-base-100 shadow-2xl overflow-hidden border border-base-300">
                    <div className="overflow-x-auto">
                        <table className="table table-sm md:table-md w-full">
                            <thead className="bg-base-300/50">
                                <tr className="text-[10px] uppercase opacity-70">
                                    <th className="w-12 text-center">Pos</th>
                                    <th>Piloto</th>
                                    <th>Neumático (Vueltas)</th>
                                    <th>Gaps (Ldr / Prev)</th>
                                    <th>Vueltas (Total {totalLaps})</th>
                                    <th>Tiempos (Last / Best)</th>
                                    <th className="text-center">Sectores (S1/S2/S3)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedCarNumbers.map((num) => {
                                    const t = timings[num];
                                    const d = drivers[num];
                                    const carStints = appData[num]?.Stints || [];
                                    const currentStint = carStints[carStints.length - 1]; 
                                    const compound = getCompoundDetails(currentStint?.Compound || '');
                                    const teamColor = d?.TeamColour ? `#${d.TeamColour}` : '#666';

                                    return (
                                        <tr key={num} className="hover:bg-base-200/40 border-b border-base-300/30">
                                            {/* Posición */}
                                            <td className="text-center font-black text-lg italic">{t.Position}</td>

                                            {/* Piloto e Info */}
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1 h-8 rounded-full" style={{ backgroundColor: teamColor }} />
                                                    <div className="flex flex-col">
                                                        <span className="font-bold leading-none">{d?.Tla} {t.InPit && <span className="text-[10px] text-warning">[PITS]</span>}</span>
                                                        <span className="text-[9px] opacity-50 truncate max-w-20">{d?.FullName}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Neumático */}
                                            <td className="text-center">
                                                {currentStint ? (
                                                <div className="flex flex-col items-center gap-0.5">
                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${compound.color} ring-1 ring-base-content/20`}>
                                                    {compound.label}
                                                    </div>
                                                    <span className="text-[9px] font-mono opacity-70">
                                                    {currentStint.TotalLaps}v {currentStint.New === "true" ? '(N)' : '(U)'}
                                                    </span>
                                                </div>
                                                ) : '--'}
                                            </td>

                                            {/* Gaps */}
                                            <td className="font-mono text-[11px]">
                                                <div className="flex flex-col">
                                                    <span className="text-primary">{t.GapToLeader || 'INTERVAL'}</span>
                                                    <span className="opacity-50">{t.IntervalToNext || '--'}</span>
                                                </div>
                                            </td>

                                            {/* Vuelta Actual */}
                                            <td className="text-center font-mono text-sm">
                                                {sessionLap} <span className="text-[10px] opacity-30">/ {totalLaps}</span>
                                            </td>

                                            {/* Tiempos */}
                                            <td>
                                                <div className="flex flex-col font-mono text-[11px]">
                                                    <span className={t.LastLapTime?.PersonalBest ? 'text-secondary' : ''}>
                                                        {t.LastLapTime?.Value || '--:--.---'}
                                                    </span>
                                                    <span className="text-white/40 italic">{t.BestLapTime?.Value || '--:--.---'}</span>
                                                </div>
                                            </td>

                                            {/* Sectores */}
                                            <td>
                                                <div className="flex justify-center gap-1">
                                                    {handleSectors(t.Sectors).map((s, i) => (
                                                        <div
                                                            key={i}
                                                            className={`w-12 text-center text-[10px] py-1 rounded-sm font-bold ${s.OverallBest ? 'bg-purple-600 text-white' :
                                                                    s.PersonalBest ? 'bg-success text-success-content' : 'bg-base-300 opacity-60'
                                                                }`}
                                                        >
                                                            {s.Value || '--.--'}
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
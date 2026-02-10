"use client"

import { SectorCell } from "./sector-cell";

export const TimingTable = ({ timing }: { timing: any }) => {
    if (!timing) return <div className="p-10 text-center">Esperando datos de la sesión...</div>;

    // Ordenar por posición
    const sortedDrivers = Object.values(timing).sort((a: any, b: any) =>
        parseInt(a.Position) - parseInt(b.Position)
    );

    return (
        <table className="table table-xs w-full font-mono">
            <thead className="sticky top-0 bg-base-300">
                <tr className="border-b border-base-content/10 opacity-50 uppercase">
                    <th className="w-8">Pos</th>
                    <th>Driver</th>
                    <th>Gap</th>
                    <th>Interval</th>
                    <th>S1</th>
                    <th>S2</th>
                    <th>S3</th>
                    <th>Laps</th>
                </tr>
            </thead>
            <tbody>
                {sortedDrivers.map((line: any, idx) => (
                    <tr key={idx} className="hover:bg-base-content/5 border-b border-base-content/5">
                        <td className="font-bold text-center">{line.Position}</td>
                        <td className="flex items-center gap-2">
                            <div className="w-1 h-4" style={{ backgroundColor: line._driver?.color }}></div>
                            <span className="font-black italic">{line._driver?.abbr}</span>
                            <span className="opacity-40 text-[10px] hidden md:inline">{line._driver?.name}</span>
                        </td>
                        <td className="text-warning">{line.GapToLeader}</td>
                        <td className="text-warning/70">{line.Interval}</td>
                        <SectorCell
                            value={line.Sectors?.[0]?.Value}
                            isFastest={line.Sectors?.[0]?.OverallFastest}
                            isPersonalBest={line.Sectors?.[0]?.PersonalBest}
                        />
                        <SectorCell
                            value={line.Sectors?.[1]?.Value}
                            isFastest={line.Sectors?.[1]?.OverallFastest}
                            isPersonalBest={line.Sectors?.[1]?.PersonalBest}
                        />
                        <SectorCell
                            value={line.Sectors?.[2]?.Value}
                            isFastest={line.Sectors?.[2]?.OverallFastest}
                            isPersonalBest={line.Sectors?.[2]?.PersonalBest}
                        />
                        <td className="opacity-50">{line.NumberOfLaps}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};
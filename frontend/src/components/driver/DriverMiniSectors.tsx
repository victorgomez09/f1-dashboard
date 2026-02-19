"use client";

import clsx from "clsx";
import type { Sector, TimingDataDriver, TimingStatsDriver } from "@/types/state.type";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useDataStore } from "@/stores/useDataStore";

interface Segment {
    Status: number;
}

type Props = {
    sectors: TimingDataDriver["Sectors"];
    bestSectors: TimingStatsDriver["BestSectors"] | undefined;
};

// Fallback estricto
const DEFAULT_SEGMENTS_COUNT = [8, 8, 8];

export default function DriverMiniSectors({ sectors = [], bestSectors }: Props) {
    const showMiniSectors = useSettingsStore((state) => state.showMiniSectors);
    const showBestSectors = useSettingsStore((state) => state.showBestSectors);
    const segmentsConfig = useDataStore((state) => state.segmentsConfig);

    const sectorsArray: Sector[] = Array.isArray(sectors) ? sectors : Object.values(sectors ?? {});

    const handleSegments = (sector: Sector | undefined, sectorIndex: number): Segment[] => {
        const expectedCount = segmentsConfig?.[sectorIndex] ?? DEFAULT_SEGMENTS_COUNT[sectorIndex] ?? 8;
        
        const rawSegments = (
            sector?.Segments 
                ? (Array.isArray(sector.Segments) ? sector.Segments : Object.values(sector.Segments)) 
                : []
        ) as Segment[];

        // Siempre devolvemos un array de longitud exacta 'expectedCount'
        return Array.from({ length: expectedCount }, (_, index) => {
            return rawSegments[index] || { Status: 0 };
        });
    };

    return (
        <div className="flex gap-4"> {/* Aumentamos el gap entre los 3 sectores principales */}
            {sectorsArray.map((sector, i) => (
                <div 
                    key={`sector.${i}`} 
                    className="flex flex-col gap-1"
                    style={{ width: '100px' }} // <--- ANCHO FIJO POR SECTOR (Ajusta según necesites)
                >
                    {showMiniSectors && (
                        <div className="flex flex-row gap-0.5 h-[6px] items-center">
                            {handleSegments(sector, i).map((segment, j) => (
                                <MiniSector 
                                    status={segment.Status} 
                                    key={`sector.mini.${i}.${j}`} 
                                />
                            ))}
                        </div>
                    )}

                    <div className={clsx("flex w-full", showMiniSectors ? "items-center justify-between" : "flex-col")}>
                        <p
                            className={clsx("text-lg leading-none font-medium tabular-nums", {
                                "text-primary!": sector?.OverallFastest,
                                "text-success!": sector?.PersonalFastest,
                                "text-neutral-content/20": !sector?.Value,
                            })}
                        >
                            {!!sector?.Value ? sector.Value : "-- ---"}
                        </p>

                        {showBestSectors && (
                            <p className="text-xs leading-none text-neutral-content/20 tabular-nums">
                                {bestSectors?.[i]?.Value || "-- ---"}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

function MiniSector({ status }: { status: number }) {
    return (
        <div
            className={clsx("h-[4px] rounded-[1px] transition-colors duration-500 flex-1", {
                "bg-warning": status === 2048 || status === 2052,
                "bg-success": status === 2049,
                "bg-secondary": status === 2051,
                "bg-info": status === 2064,
                "bg-neutral-content/10": status === 0,
            })}
            style={{ minWidth: '4px' }} // Asegura que no desaparezcan si hay muchos
        />
    );
}
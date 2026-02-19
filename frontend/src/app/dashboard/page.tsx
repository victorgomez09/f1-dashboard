"use client";

import { useEffect, useRef } from "react";
import "gridstack/dist/gridstack.min.css";
import { GridStack } from "gridstack";

import LeaderBoard from "@/components/dashboard/LeaderBoard";
import RaceControl from "@/components/dashboard/RaceControl";
import TeamRadios from "@/components/dashboard/TeamRadios";
import TrackViolations from "@/components/dashboard/TrackViolations";
import Map from "@/components/dashboard/Map";

export default function Page() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gridRef.current) return;

    const grid = GridStack.init({
      cellHeight: "auto",
      margin: 5,
      animate: true,
      float: true,
      columnOpts: {
        breakpoints: [{ w: 768, c: 1 }], // Cambia a 1 columna solo si es menor a 768px
      },
      resizable: {
        handles: 'e, se, s, sw, w' // Permitir redimensionar por casi cualquier lado
      }
    }, gridRef.current);

    return () => {
      grid.destroy(false);
    };
  }, []);

  // Clases para mantener el estilo consistente
  const itemClass = "grid-stack-item";
  const contentClass = "grid-stack-item-content card bg-base-300 overflow-hidden border border-white/5";

  return (
    <div className="w-full min-h-screen bg-base-100">
      <div className="grid-stack p-0!" ref={gridRef}>
        
        {/* Fila 1: Leaderboard y Map */}
        <div className={itemClass} gs-w="8" gs-h="8" gs-x="0" gs-y="0">
          <div className={contentClass}>
            <div className="card-body p-2 overflow-auto custom-scrollbar">
              <LeaderBoard />
            </div>
          </div>
        </div>

        <div className={itemClass} gs-w="4" gs-h="8" gs-x="8" gs-y="0">
          <div className={contentClass}>
            <div className="card-body p-2 overflow-hidden">
              <Map />
            </div>
          </div>
        </div>

        <div className={itemClass} gs-w="4" gs-h="5" gs-x="0" gs-y="8">
          <div className={contentClass}>
            <div className="card-body p-2 overflow-auto">
              <RaceControl />
            </div>
          </div>
        </div>

        <div className={itemClass} gs-w="4" gs-h="5" gs-x="4" gs-y="8">
          <div className={contentClass}>
            <div className="card-body p-2 overflow-auto">
              <TeamRadios />
            </div>
          </div>
        </div>

        <div className={itemClass} gs-w="4" gs-h="5" gs-x="8" gs-y="8">
          <div className={contentClass}>
            <div className="card-body p-2 overflow-auto">
              <TrackViolations />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
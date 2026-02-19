"use client";

import Image from "next/image";
import type { Stint } from "@/types/state.type";

type Props = {
    stints: (Stint | null)[] | undefined; // Soportamos que el bridge envíe nulls temporales
    totalLaps: number;
};

export default function DriverTire({ stints, totalLaps }: Props) {
    // 1. Filtramos posibles nulos del bridge para evitar errores de índice
    const validStints = (Array.isArray(stints) ? stints : Object.values(stints || [])).filter((s): s is Stint => s !== null);
    
    // 2. Calculamos las paradas basándonos solo en stints reales
    const stops = validStints.length > 0 ? validStints.length - 1 : 0;
    
    // 3. Obtenemos el stint actual con seguridad
    const currentStint = validStints.length > 0 ? validStints[validStints.length - 1] : null;

    // 4. Verificación robusta del compuesto
    const compoundName = currentStint?.Compound?.toLowerCase() || "";
    const knownCompounds = ["soft", "medium", "hard", "intermediate", "wet"];
    const isUnknown = !knownCompounds.includes(compoundName);

    return (
        <div className="flex flex-row items-center gap-2">
            {/* Caso: Tenemos compuesto conocido */}
            {currentStint && !isUnknown && (
                <Image
                    src={`/tires/${compoundName}.svg`}
                    width={32}
                    height={32}
                    alt={compoundName}
                    priority // Añadimos priority para evitar parpadeos en F5
                />
            )}

            {/* Caso: Tenemos stint pero compuesto desconocido (?) */}
            {currentStint && isUnknown && (
                <div className="flex h-8 w-8 items-center justify-center">
                    <Image src="/tires/unknown.svg" width={32} height={32} alt="unknown" />
                </div>
            )}

            {/* Caso: Cargando o sin datos (evita el NaN visual) */}
            {!currentStint && (
                <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-800" />
            )}

            <div>
                <p className="leading-none font-medium">
                    {/* Si no hay vueltas del stint, mostramos 0 en lugar de NaN */}
                    L {Number(currentStint?.TotalLaps) || 0}
                    {currentStint?.New === "No" ? "*" : ""}
                </p>

                {/* PIT se basa en la longitud de la lista filtrada */}
                <p className="text-sm leading-none text-zinc-500">
                    PIT {stops}
                </p>

                <p className="text-sm leading-none text-zinc-500">
                    T {totalLaps || 0}
                </p>
            </div>
        </div>
    );
}
"use client";

import { DriverAvatar } from "@/components/driver/driver-image";
import { useDrivers } from "@/hooks/use-drivers";
import Image from "next/image"

interface DriverProfile {
    id: string;
    number: number;
    full_name: string;
    first_name: string;
    last_name: string;
    abbreviation: string;
    team_name: string;
    team_color: string;
    country_code: string;
    headshot_url: string;
    team_logo_url: string;
}

export default function DriversPage() {
    const { drivers, isLoading } = useDrivers(2025);

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <span className="skeleton h-full w-full"></span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-200 p-6">
            {/* <header className="mb-10 text-center">
                <h1 className="text-5xl font-black uppercase italic tracking-tighter">
                    F1 Drivers <span className="text-primary">2024</span>
                </h1>
                <div className="divider mx-auto w-24 divider-primary"></div>
            </header> */}

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {drivers?.data.map((driver: DriverProfile) => (
                    <div
                        key={driver.id}
                        className="group relative flex flex-col rounded-xl bg-base-100 shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl"
                        style={{
                            borderTop: `6px solid ${driver.team_color}`
                        }}
                    >
                        {/* Numero de Piloto de Fondo */}
                        <div className="absolute right-4 top-2 text-6xl font-black opacity-10 italic">
                            {driver.number}
                        </div>

                        <div className="flex p-4">
                            <div className="z-10 flex flex-1 flex-col justify-end pb-4">
                                <div className="flex items-center gap-2">
                                    {/* <span className="text-xs font-bold px-2 py-0.5 rounded bg-base-300">
                                        {driver.country_code}
                                    </span> */}
                                    <span className="text-lg font-mono font-bold">{driver.abbreviation}</span>
                                </div>
                                <h2 className="mt-1 text-2xl font-bold leading-none">
                                    <span className="block text-sm font-light uppercase tracking-widest opacity-70">
                                        {driver.first_name}
                                    </span>
                                    <span className="block uppercase font-black">{driver.last_name}</span>
                                </h2>
                            </div>

                            <div className="relative h-32 w-32 shrink-0">
                                <DriverAvatar alt={driver.full_name} src={driver.headshot_url} />
                            </div>
                        </div>

                        <div className="mt-auto flex items-center justify-between bg-base-300/50 p-4 rounded-b-xl">
                            <span className="text-xs font-bold uppercase opacity-80 italic">
                                {driver.team_name}
                            </span>
                            <Image
                                src={driver.team_logo_url}
                                alt={driver.team_name}
                                width={32}  // Equivalente a w-8
                                height={32} // Equivalente a h-8
                                unoptimized
                                className="object-contain brightness-90 grayscale group-hover:grayscale-0 transition-all"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
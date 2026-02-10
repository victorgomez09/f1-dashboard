"use client"

import { MessageFeed } from "@/components/live/message-feed";
import { RadioFeed } from "@/components/live/radio-feed";
import { TimingTable } from "@/components/live/timming-table";
import { TrackMap } from "@/components/live/track-map";
import { WeatherBar } from "@/components/live/weather";
import { useLiveTiming } from "@/hooks/use-live-timming";
import { useMap } from "@/hooks/use-map";

export default function LiveDashboard({ location, year }: { location: string, year: number }) {
    const { map: trackData, isLoading: isMapLoading } = useMap(year, location);
    // const { weather, timing, mapData, messages, radios } = useLiveTiming();

    if (isMapLoading) return <div className="flex justify-center p-20"><span className="loading loading-ring loading-lg"></span></div>;

    console.log("trackData", trackData)

    return (
        <div className="flex flex-col gap-2 w-full h-full">
            {/* <WeatherBar data={weather} /> */}
            <main className="grid grid-cols-12 gap-2 p-2 overflow-hidden w-full h-full">
                {/* SECCIÓN IZQUIERDA: TABLA DE TIEMPOS (6/12) */}
                <section className="col-span-12 lg:col-span-7 bg-base-300 rounded-box overflow-y-auto">
                    <div className="p-4 flex justify-between items-center border-b border-base-content/10">
                        <h2 className="font-black italic text-xl uppercase tracking-tighter">Live Timing</h2>
                        <div className="badge badge-error gap-2 animate-pulse font-bold">● LIVE</div>
                    </div>
                    {/* <TimingTable timing={timing} /> */}
                </section>

                {/* SECCIÓN DERECHA: MAPA Y FEED (5/12) */}
                <section className="col-span-12 lg:col-span-5 flex flex-col gap-2 overflow-hidden">

                    {/* Mapa del Circuito */}
                    <div className="flex-1 bg-base-300 rounded-box relative min-h-100">
                        <TrackMap mapData={trackData} driverPositions={trackData?.data || []} />
                    </div>

                    {/* Paneles Inferiores (Radios y Mensajes) */}
                    <div className="h-1/3 grid grid-cols-2 gap-2">
                        <div className="bg-base-200 rounded-box p-3 overflow-y-auto">
                            <h3 className="text-[10px] font-bold opacity-50 uppercase mb-2">Team Radio</h3>
                            {/* <RadioFeed radios={radios} /> */}
                        </div>
                        <div className="bg-base-200 rounded-box p-3 overflow-y-auto">
                            <h3 className="text-[10px] font-bold opacity-50 uppercase mb-2">Race Control</h3>
                            {/* <MessageFeed messages={messages} /> */}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
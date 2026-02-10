"use client"

import { useEffect, useMemo, useState } from "react";
import Image from "next/image"
import { useSchedule } from "@/hooks/use-schedule";

export default function SchedulePage() {
    const { schedule, isLoading } = useSchedule();

    const nextEvent = schedule?.data.find((e: any) => e.is_next);

    if (isLoading) {
        return (
            <div className="h-full w-full">
                <span className="skeleton h-full w-full"></span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1 w-full h-full">
            {nextEvent && (
                <div className="card bg-base-100 border border-base-content/5">
                    <div className="card-body">
                        <div className="flex flex-col items-center justify-center gap-2">

                            <div className="text-center mb-6">
                                <h2 className="text-sm uppercase font-black tracking-widest opacity-50">NEXT EVENT</h2>
                                <h1 className="text-xl font-black italic uppercase">{nextEvent.location}</h1>
                                <p className="mt-2 opacity-70">{nextEvent.name}</p>
                            </div>

                            {/* Usamos la fecha de la Carrera (Session5) para el contador general */}
                            <Countdown nextEvent={nextEvent} />
                        </div>
                    </div>

                </div>
            )}

            {schedule?.data.map((event: any, index: number) => (
                <EventListItem key={index} event={event} />
            ))}
        </div>
    );
};

const SessionRow = ({ name, date }: { name: string; date: string | null }) => {
    if (!date) return null;
    const isSessionLive = (sessionDateISO: string | null) => {
        if (!sessionDateISO) return false;

        const now = new Date();
        const sessionStart = new Date(sessionDateISO);

        // Definimos que una sesión está "activa" desde que empieza 
        // hasta 2 horas después.
        const sessionEnd = new Date(sessionStart.getTime() + 2 * 60 * 60 * 1000);

        return now >= sessionStart && now <= sessionEnd;
    };

    const isLive = isSessionLive(date);
    const d = new Date(date);

    return (
        <div className={`flex justify-between items-center py-2 px-3 rounded-lg transition-all ${isLive ? 'bg-error/10 border border-error/20 animate-pulse' : 'border-b border-base-content/5'
            }`}>
            <div className="flex items-center gap-2">
                {isLive && (
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-error"></span>
                    </span>
                )}
                <span className={`text-[10px] font-bold uppercase ${isLive ? 'text-error' : 'opacity-50'}`}>
                    {isLive ? 'En Directo' : name}
                </span>
            </div>

            <div className="text-right">
                <span className={`text-sm font-mono font-medium ${isLive ? 'text-error' : ''}`}>
                    {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-[10px] ml-2 opacity-40">
                    {d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                </span>
            </div>
        </div>
    );
};

export const EventListItem = ({ event }: { event: any }) => {
    const formatDateRange = (start: string, end: string) => {
        const s = new Date(start);
        const e = new Date(end);

        const monthOptions: Intl.DateTimeFormatOptions = { month: 'short' };
        const month = s.toLocaleDateString(undefined, monthOptions);

        if (s.getMonth() === e.getMonth()) {
            return `${s.getDate()} - ${e.getDate()} ${month}`;
        }

        const endMonth = e.toLocaleDateString(undefined, monthOptions);
        return `${s.getDate()} ${month} - ${e.getDate()} ${endMonth}`;
    };

    return (
        <div className="collapse collapse-arrow bg-base-100 border border-base-content/5">
            <input type="radio" name="f1-calendar" />

            {/* Cabecera: Siempre visible */}
            <div className="collapse-title flex items-center gap-4 pr-12">
                <div className="avatar">
                    <div className="w-10 h-7 rounded relative shadow-sm">
                        <Image
                            src={event.flag_url}
                            alt={event.country}
                            fill
                            className="object-cover"
                        />
                    </div>
                </div>

                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black opacity-30">R{event.round}</span>
                        <span className="text-[10px] uppercase font-bold text-primary">{event.type}</span>
                    </div>
                    <h3 className="font-bold text-lg uppercase italic tracking-tighter leading-none">
                        {event.location}
                    </h3>
                </div>

                <div className="flex flex-col items-center justify-center">
                    <span className="text-lg font-black leading-none opacity-80">
                        {formatDateRange(event.start_date, event.end_date)}
                    </span>
                </div>
            </div>

            {/* Contenido: Se expande al hacer click */}
            <div className="collapse-content bg-base-100/30">
                <div className="pt-4 space-y-1">
                    <p className="text-xs italic opacity-60 mb-4">{event.name}</p>

                    <SessionRow name="Free Practice 1" date={event.sessions.fp1} />
                    <SessionRow
                        name={event.type === "Sprint Weekend" ? "Sprint" : "Free Practice 3"}
                        date={event.sessions.sprint_or_fp3}
                    />
                    <SessionRow name="Qualifying" date={event.sessions.qualifying} />
                    <SessionRow name="Grand Prix" date={event.sessions.race} />
                </div>
            </div>
        </div>
    );
};

const Countdown = ({ nextEvent }: { nextEvent: any }) => {
    const targetDate = nextEvent.start_date;
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = new Date(targetDate).getTime() - now;

            if (distance < 0) {
                setTimeLeft(prev => ({ ...prev, expired: true }));
                clearInterval(timer);
            } else {
                setTimeLeft({
                    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((distance % (1000 * 60)) / 1000),
                    expired: false
                });
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [targetDate]);

    return (
        <div className="grid grid-flow-col gap-5 text-center auto-cols-max">
            <CountdownUnit value={timeLeft.days} label="days" />
            <CountdownUnit value={timeLeft.hours} label="hours" />
            <CountdownUnit value={timeLeft.minutes} label="min" />
            <CountdownUnit value={timeLeft.seconds} label="sec" />
        </div>
    );
};

const CountdownUnit = ({ value, label }: { value: number, label: string }) => (
    <div className="flex flex-col p-2 rounded-box text-neutral-content w-fit">
        <span className="countdown font-mono text-2xl">
            {/* @ts-ignore -- DaisyUI utiliza esta variable CSS para la animación */}
            <span style={{ "--value": value }}></span>
        </span>
        <span className="text-xs opacity-50">{label}</span>
    </div>
);
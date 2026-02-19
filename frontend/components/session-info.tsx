"use client"

import { ExtrapolatedClock, SessionInfo, TrackStatus, WeatherData } from "@/types/state";
import clsx from "clsx";
import moment from "moment";

const getWeatherUnit = (key: string) => {
    switch (key) {
        case "AirTemp":
        case "TrackTemp":
            return "°C";
        case "Humidity":
            return "%";
        case "Pressure":
            return " mbar";
        case "WindDirection":
            return "°";
        case "WindSpeed":
            return " km/h";
        default:
            return null;
    }
};

type StatusMessage = {
    message: string;
    color: string;
    trackColor: string;
    bySector?: boolean;
    pulse?: number;
    hex: string;
};

type MessageMap = {
    [key: string]: StatusMessage;
};

export const getTrackStatusMessage = (statusCode: number | undefined): StatusMessage | null => {
    const messageMap: MessageMap = {
        1: { message: "Track Clear", color: "badge-success", trackColor: "stroke-white", hex: "#34b981" },
        2: { message: "Yellow Flag", color: "badge-warning", trackColor: "stroke-warning", bySector: true, hex: "#fbbf24", },
        3: { message: "Flag", color: "badge-warning", trackColor: "stroke-warning", bySector: true, hex: "#fbbf24" },
        4: { message: "Safety Car", color: "badge-warning", trackColor: "stroke-warning", hex: "#fbbf24" },
        5: { message: "Red Flag", color: "badge-error", trackColor: "stroke-red-500", hex: "#ef4444" },
        6: { message: "VSC Deployed", color: "badge-warning", trackColor: "stroke-warning", hex: "#fbbf24" },
        7: { message: "VSC Ending", color: "badge-warning", trackColor: "stroke-warning", hex: "#fbbf24" },
    };

    return statusCode ? (messageMap[statusCode] ?? messageMap[0]) : null;
};

export default function SessionInfoComponent({ sessionInfo, trackStatus, weatherData, extrapolatedClock, lapCount, delayMs }: { sessionInfo?: SessionInfo, trackStatus?: TrackStatus, weatherData?: WeatherData, extrapolatedClock: ExtrapolatedClock; lapCount?: any; delayMs: number }) {
    const extrapolatedTimeRemaining =
        extrapolatedClock.Utc && extrapolatedClock.Remaining
            ? extrapolatedClock.Extrapolating
                ? moment
                    .utc(
                        Math.max(
                            moment
                                .duration(extrapolatedClock.Remaining)
                                .subtract(
                                    moment.utc().diff(moment.utc(extrapolatedClock.Utc))
                                )
                                .asMilliseconds() + delayMs,
                            0
                        )
                    )
                    .format("HH:mm:ss")
                : extrapolatedClock.Remaining
            : undefined;

    const currentTrackStatus = getTrackStatusMessage(trackStatus?.Status ? parseInt(trackStatus?.Status) : undefined);

    return (
        <div className="card bg-base-300 w-full">
            <div className="card-body p-4 w-full">
                <div className="flex items-center gap-2 w-full">
                    <div className="flex items-center justify-between w-full">
                        {!!sessionInfo && (
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">{sessionInfo.Meeting.Name}: {sessionInfo.Name}</span>
                                {!!extrapolatedTimeRemaining && (
                                    <span className="font-semibold">
                                        {extrapolatedTimeRemaining}
                                    </span>
                                )}
                            </div>
                        )}

                        {!!weatherData && (
                            <div className="flex items-center gap-2">
                                {Object.entries(weatherData).map(([k, v]) =>
                                    k !== "_kf" ? (
                                        <div
                                            key={`weather-${k}`}
                                        >
                                            <span className="font-semibold">{k}</span>: {v}
                                            {getWeatherUnit(k)}
                                        </div>
                                    ) : null
                                )}
                            </div>
                        )}

                        <div className="flex flex-row items-center gap-4 md:justify-self-end">
                            {!!lapCount && (
                                <p className="text-3xl font-extrabold whitespace-nowrap">
                                    {lapCount?.CurrentLap} / {lapCount?.TotalLaps}
                                </p>
                            )}

                            {!!currentTrackStatus ? (
                                <div
                                    className={clsx("badge flex h-8 items-center truncate rounded-box px-2", currentTrackStatus.color)}
                                >
                                    <p className="text-lg font-medium">{currentTrackStatus.message}</p>
                                </div>
                            ) : (
                                <div className="relative h-8 w-28 animate-pulse overflow-hidden rounded-box bg-zinc-800" />
                            )}
                        </div>
                        {/*
                            {!!LapCount && (
                                <p style={{ marginRight: "var(--space-4)" }}>
                                    Lap: {LapCount.CurrentLap}/{LapCount.TotalLaps}
                                </p>
                            )} */}
                    </div>
                    {/* <div
                            style={{
                                display: "flex",
                                alignItems: "flex-start",
                            }}
                        >
                            <p style={{ marginRight: "var(--space-4)" }}>
                                Data updated: {moment.utc(updated).format("HH:mm:ss.SSS")} UTC
                            </p>
                            <p style={{ color: "limegreen", marginRight: "var(--space-4)" }}>
                                CONNECTED
                            </p>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const form = new FormData(e.target);
                                    const delayMsValue = Number(form.get("delayMs"));
                                    setBlocking(true);
                                    setDelayMs(delayMsValue);
                                    setDelayTarget(Date.now() + delayMsValue);
                                }}
                                style={{ display: "flex", alignItems: "center" }}
                            >
                                <p style={{ marginRight: "var(--space-2)" }}>Delay</p>
                                <Input
                                    type="number"
                                    name="delayMs"
                                    defaultValue={delayMs}
                                    style={{ width: "75px", marginRight: "var(--space-2)" }}
                                />
                                <p style={{ marginRight: "var(--space-4)" }}>ms</p>
                            </form>
                            <a
                                href="https://github.com/tdjsnelling/monaco"
                                target="_blank"
                                style={{ color: "grey" }}
                            >
                                tdjsnelling/monaco
                            </a>
                        </div>
                    </div>

                    {!!WeatherData && (
                        <div
                            style={{
                                display: "flex",
                                padding: "var(--space-3)",
                                borderBottom: "1px solid var(--colour-border)",
                                overflowX: "auto",
                            }}
                        >
                            <p style={{ marginRight: "var(--space-4)" }}>
                                <strong>WEATHER</strong>
                            </p>
                            {Object.entries(WeatherData).map(([k, v]) =>
                                k !== "_kf" ? (
                                    <p
                                        key={`weather-${k}`}
                                        style={{ marginRight: "var(--space-4)" }}
                                    >
                                        {k}: {v}
                                        {getWeatherUnit(k)}
                                    </p>
                                ) : null
                            )}
                        </div>
                    )} */}
                </div>
            </div>
        </div>
    )
}
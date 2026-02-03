"use client"

import { Evolutions, StandingEvolutionProps } from "@/models/chart";
import { getConstructorHex } from "@/utils/chart";
import { ResponsiveLine } from "@nivo/line";

function transformData(rankings: Evolutions, mapping: any, type: "drivers" | "teams" = "drivers") {
    const transformedData = [];

    if (type === "drivers" && rankings?.driversEvolution) {
        for (const driver of rankings.driversEvolution) {
            const driverSeries: {
                id: string;
                data: { x: number | string; y: number; locality: string | undefined }[];
                name: string;
                color: string;
                constructorId: string;
            } = {
                // id: driver.code,
                id: driver.name,
                data: [],
                name: driver.name,
                color: getConstructorHex(driver.constructorId, mapping),
                constructorId: driver.constructorId,
            };

            for (let i = 0; i < driver.rounds.length; i++) {
                driverSeries.data.push({
                    x: driver.rounds[i].round,
                    y: driver.rounds[i].points,
                    locality: driver.rounds[i].locality || undefined,
                });
            }

            transformedData.push(driverSeries);
        }
    }

    if (type === "teams" && rankings?.constructorsEvolution) {
        for (const constructor of rankings.constructorsEvolution) {
            const constructorSeries: {
                id: string;
                data: { x: string | number; y: number; locality: string | undefined }[];
                constructorId: string;
                color: string;
                name: string;
            } = {
                id: constructor.name,
                name: constructor.name,
                data: [],
                constructorId: constructor.constructorId,
                color: constructor.constructorId,
            };

            for (let i = 0; i < constructor.rounds.length; i++) {
                constructorSeries.data.push({
                    x: constructor.rounds[i].round,
                    y: constructor.rounds[i].points,
                    locality: constructor.rounds[i].locality || undefined,
                });
            }

            transformedData.push(constructorSeries);
        }
    }

    return transformedData;
}

export const chartTheme = {
    axis: {
        ticks: {
            text: {
                fill: "#94a3b8",
                fontSize: 11,
            },
            line: {
                stroke: "rgba(255, 255, 255, 0.10)",
                strokeWidth: 1,
            },
        },
        legend: {
            text: {
                fill: "#fff",
            },
        },
    },
    grid: {
        line: {
            stroke: "rgba(255, 255, 255, 0.10)",
            strokeWidth: 1,
            // strokeDasharray: '4 4' // Optional: creates a dashed line effect
        },
    },
    text: {
        fill: "#fff",
        fontSize: 11,
        fontWeight: 300,
    },
};

export const StandingEvolution = ({ title, standings, mappings, type }: StandingEvolutionProps) => {
    const data = transformData(standings, mappings, type);

    const getColor = (series: { constructorId: string }) => {
        return getConstructorHex(series.constructorId, mappings);
    };

    const CustomTooltip = ({ slice }: { slice: any }) => {
        if (!slice?.points?.length) return null;
        const sortedPoints = [...slice.points].sort((a, b) => b.data.y - a.data.y);
        const round = sortedPoints[0].data.x;
        const locality = sortedPoints[0].data.locality || "";

        return (
            <div
                className="bg-slate-800 rounded-md min-w-30 opacity-95"
                style={{
                    fontSize: "10px",
                    fontWeight: "light",
                }}
            >
                <div className="mb-2 p-2 border-b border-slate-600">{locality}</div>
                {sortedPoints.map((point) => {
                    return (
                        <div
                            key={point.seriesId}
                            className="flex justify-between items-center mb-1 px-2 last:pb-2"
                            style={{ color: point.serieColor }}
                        >
                            <span className="pr-2">{point.seriesId}</span>
                            <span style={{ color: point.color }}>{point.data.y}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    const hasNoData =
        (standings?.driversEvolution?.length === 0 ||
            !standings?.driversEvolution) &&
        (standings?.constructorsEvolution?.length === 0 ||
            !standings?.constructorsEvolution);

    return (
        <>
            {hasNoData ? (
                <div className="skeleton h-125 w-full">
                </div>
            ) : (
                <div className="card bg-base-100 shadow">
                    <div className="card-body p-4">
                        <div className="card-title">{title} Standings Evolution</div>
                        <div className="h-125">
                            <ResponsiveLine
                                data={data}
                                margin={{ top: 10, right: 40, bottom: 20, left: 30 }}
                                axisTop={null}
                                axisRight={null}
                                theme={chartTheme}
                                enablePoints={true}
                                lineWidth={2}
                                pointSize={4}
                                enableSlices="x"
                                sliceTooltip={({ slice }) => <CustomTooltip slice={slice} />}
                                colors={getColor}
                                enableGridX={false}
                                enableGridY={true}
                                animate={true}
                                motionConfig={"slow"}
                                useMesh={true}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
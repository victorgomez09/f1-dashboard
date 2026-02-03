import { getConstructorHex } from "@/utils/chart";
import { BarTooltipProps, ResponsiveBar } from "@nivo/bar";
import { CircleAlert } from "lucide-react";
import { useMemo } from "react";
import { chartTheme } from "./standing-chart";

interface PtDistributionChartProps {
    heading?: string;
    data: Array<{ name: string;[key: string]: any }>;
    indexBy?: string;
    layout?: "vertical" | "horizontal";
    groupMode?: "grouped" | "stacked";
    margin?: { top: number; right: number; bottom: number; left: number };
    barHeight?: number;
    mapping: any
}

export default function PtDistributionChart({
    heading,
    data,
    indexBy,
    layout = "horizontal",
    groupMode = "stacked",
    margin = { top: 20, right: 20, bottom: 40, left: 30 },
    barHeight = 15,
    mapping
}: PtDistributionChartProps) {
    // Get all keys (excluding 'name' and 'locality')
    const keys = Array.from(
        new Set(
            data.flatMap((d) =>
                Object.keys(d).filter(
                    (key) =>
                        key !== "name" &&
                        key !== "locality" &&
                        typeof d[key] === "object" &&
                        d[key] !== null &&
                        "points" in d[key]
                )
            )
        )
    );

    if (keys.length === 0) {
        return (
            <>
                <div className="scroll-m-20 mb-3">{heading}</div>
                <div className="h-full flex justify-center items-center text-gray-500">
                    <CircleAlert />
                    &nbsp;&nbsp;Not Available
                </div>
            </>
        );
    }

    const driverNames: Record<string, string> = useMemo(() => {
        const names: Record<string, string> = {};
        keys.forEach((driverId) => {
            const driverData = data[0][driverId];
            if (
                driverData &&
                typeof driverData === "object" &&
                "name" in driverData
            ) {
                names[driverId] = driverData.name as string;
            } else {
                names[driverId] = driverId;
            }
        });
        return names;
    }, [data, keys]);

    const CustomTooltip = ({ id, value, color, data }: BarTooltipProps<any>) => {
        return (
            <div className="bg-slate-800 text-xs rounded-md w-36 flex flex-col opacity-95">
                <div className="p-2 border-b border-slate-600">{data.name} Grand Prix ({data.locality})</div>
                <div className="text-xs p-2 flex justify-between w-full">
                    <div>{driverNames[id as string] || String(id)}</div>
                    <div style={{ color: color }}>{value} pts</div>
                </div>
            </div>
        );
    };

    // Transform data for Nivo
    const chartData = data.map((round, index) => {
        const formattedRound: { name: string;[key: string]: number | string } = {
            id: `${round.name}-${index}`,
            name: round.name,
            locality: round.locality || "",
        };

        Object.entries(round).forEach(([driverKey, driverData]) => {
            if (
                driverKey !== "name" &&
                driverKey !== "locality" &&
                typeof driverData === "object" &&
                driverData !== null &&
                "points" in driverData
            ) {
                formattedRound[driverKey] = (driverData as { points: number }).points;
            }
        });
        return formattedRound;
    });

    // Color function with proper type safety
    const getColor = (key: string) => {
        const driverData = data[0][key];
        const constructor =
            driverData &&
                typeof driverData === "object" &&
                "constructor" in driverData
                ? (driverData.constructor as string)
                : undefined;
        return getConstructorHex(constructor as string, mapping);
    };

    return (
        <div className="card bg-base-100 shadow">
            <div className="card-body p-4">
                <div className="card-title">
                    {heading}
                </div>

                <div className="h-125">
                    <ResponsiveBar
                        data={chartData}
                        theme={chartTheme}
                        keys={keys}
                        indexBy={indexBy}
                        colors={({ id }) => getColor(String(id))}
                        tooltip={CustomTooltip}
                        margin={margin}
                        innerPadding={1}
                        padding={0.075}
                        layout={layout}
                        groupMode={groupMode}
                        enableLabel={false}
                        // enableTotals={true}
                        isInteractive={true}
                        axisLeft={{
                            tickSize: 5,
                            tickPadding: 5,
                            tickRotation: 0,
                            format: (id: string) => {
                                const d = chartData.find(c => c.id === id);
                                if (d?.name) {
                                    return d.name.substring(0, 3).toUpperCase(); // "AUS"
                                }

                                return id.substring(0, 3).toUpperCase();
                            },
                        }}
                        enableGridX={true}
                        enableGridY={false}
                        animate={true}
                        ariaLabel="Points Distribution"
                    />
                </div>
            </div>
        </div>
    );
}
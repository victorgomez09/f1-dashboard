"use client"

import PtDistributionChart from "@/components/charts/distribution-chart";
import { RankingEvolution } from "@/components/charts/evolution-chart";
import StackedBarChart from "@/components/charts/stacked-bar-chart";
import { StandingEvolution } from "@/components/charts/standing-chart";
import { useDrivers } from "@/hooks/use-drivers";
import { useTeams } from "@/hooks/use-teams";

export default function DriverStandingPage() {
    const { driverStanding, driverRanking, driverStats, driverPointsDistribution, isLoading: driversLoading } = useDrivers(2025)
    const { teamsMapping, isLoading: teamsLoading } = useTeams(2025)

    return (
        <div className="grid grid-cols-2 gap-2 w-full h-full">
            {driversLoading || teamsLoading ? (
                <div className="skeleton h-125 w-full"></div>
            ) : (
                <StandingEvolution title="Drivers" standings={driverStanding?.data || {} as any} mappings={teamsMapping} type="drivers" />
            )}
            {driversLoading || teamsLoading ? (
                <div className="skeleton h-125 w-full"></div>
            ) : (
                <RankingEvolution title="Drivers" rankings={driverRanking?.data || {} as any} mappings={teamsMapping} type="drivers" />
            )}
            {driversLoading || teamsLoading ? (
                <div className="skeleton h-125 w-full"></div>
            ) : (
                <StackedBarChart heading="Stats"
                    data={driverStats?.data || []}
                    indexBy="driver"
                    keys={[
                        "Wins",
                        "Podiums",
                        "PointsFinish",
                        "DNF",
                        "DSQ",
                    ]}
                    groupMode="grouped"
                    margin={{
                        top: 20,
                        right: 20,
                        bottom: 40,
                        left: 30,
                    }} />
            )}
            {driversLoading || teamsLoading ? (
                <div className="skeleton h-125 w-full"></div>
            ) : (
                <PtDistributionChart heading="Points Distribution"
                    data={driverPointsDistribution?.data || []}
                    indexBy="name"
                    groupMode="stacked"
                    layout="horizontal"
                    margin={{
                        top: 10,
                        right: 10,
                        bottom: 20,
                        left: 40,
                    }}
                    barHeight={18}
                    mapping={teamsMapping} />
            )}
        </div>
    )
}
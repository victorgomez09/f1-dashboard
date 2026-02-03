import { getDriverRanking, getDriverStanding, getDriverStats, getPointsDristribution } from '@/lib/api/drivers';
import { useQuery } from '@tanstack/react-query';

export function useDrivers(year: number = new Date().getFullYear()) {
    const driverStanding = useQuery({
        queryKey: ['driver-standing', year],
        queryFn: () => getDriverStanding(year),
    });

    const driverRanking = useQuery({
        queryKey: ['driver-ranking', year],
        queryFn: () => getDriverRanking(year),
    });

    const driverStats = useQuery({
        queryKey: ['driver-stats', year],
        queryFn: () => getDriverStats(year),
    });

    const driverPointsDistribution = useQuery({
        queryKey: ['getPointsDristribution', year],
        queryFn: () => getPointsDristribution(year),
    });

    return {
        driverStanding: driverStanding.data,
        driverRanking: driverRanking.data,
        driverStats: driverStats.data,
        driverPointsDistribution: driverPointsDistribution.data,
        isLoading: driverStanding.isLoading || driverRanking.isLoading || driverStats.isLoading || driverPointsDistribution.isLoading,
        error: driverStanding.error || driverRanking.isError || driverStats.isError || driverPointsDistribution.isError,
    };
}
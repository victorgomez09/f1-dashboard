import { getDriverRanking, getDriverStanding, getDriverStats } from '@/lib/api/drivers';
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

    return {
        driverStanding: driverStanding.data,
        driverRanking: driverRanking.data,
        driverStats: driverStats.data,
        isLoading: driverStanding.isLoading || driverRanking.isLoading || driverStats.isLoading,
        error: driverStanding.error || driverRanking.isError || driverStats.isError,
    };
}
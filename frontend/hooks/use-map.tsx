import { getDriverRanking, getDrivers, getDriverStanding, getDriverStats, getPointsDristribution } from '@/lib/api/drivers';
import { getMap } from '@/lib/api/timming';
import { useQuery } from '@tanstack/react-query';

export function useMap(year: number = new Date().getFullYear(), location: string, session_type: string) {
    const map = useQuery({
        queryKey: ['map', year, location, session_type],
        queryFn: () => getMap(year, location, session_type),
        enabled: !!location && !!session_type,
        // Al ser un trazado que no cambia, aumentamos el staleTime para no re-peticionar
        staleTime: Infinity,
    });

    return {
        map: map.data,
        isLoading: map.isLoading,
        error: map.error,
    };
}

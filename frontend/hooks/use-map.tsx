import { getMap } from '@/lib/api/timming';
import { useQuery } from '@tanstack/react-query';

export function useMap(year: number = new Date().getFullYear(), location: string) {
    const map = useQuery({
        queryKey: ['map', year, location],
        queryFn: () => getMap(year, location),
        enabled: !!location,
        // Al ser un trazado que no cambia, aumentamos el staleTime para no re-peticionar
        staleTime: Infinity,
    });

    return {
        map: map.data,
        isLoading: map.isLoading,
        error: map.error,
    };
}

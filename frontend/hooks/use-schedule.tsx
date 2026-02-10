import { getSchedule } from '@/lib/api/schedule';
import { useQuery } from '@tanstack/react-query';

export function useSchedule(year: number = new Date().getFullYear()) {
    const schedule = useQuery({
        queryKey: ['schedule', year],
        queryFn: () => getSchedule(year),
        // Revalida los datos cada 5 minutos automáticamente
        refetchInterval: 300000,
        refetchOnWindowFocus: true, // Actualiza al volver a la pestaña
    });

    return {
        schedule: schedule.data,
        isLoading: schedule.isLoading,
        error: schedule.error,
    };
}
import { getTeamsMapping } from '@/lib/api/teams';
import { useQuery } from '@tanstack/react-query';

export function useTeams(year: number = new Date().getFullYear()) {
    const teamMapping = useQuery({
        queryKey: ['teams-mapping', year],
        queryFn: () => getTeamsMapping(year),
    });

    return {
        teamsMapping: teamMapping.data,
        isLoading: teamMapping.isLoading,
        error: teamMapping.error,
    };
}
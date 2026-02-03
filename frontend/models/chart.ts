export interface DriverEvo {
    code: string;
    driverId: string;
    constructorId: string;
    name: string;
    nationality: string;
    rounds: {
        round: number | string;
        position: number;
        points: number;
        locality?: string;
    }[];
}

export interface ConstructorEvo {
    constructorId: string;
    name: string;
    nationality: string;
    rounds: {
        round: number | string;
        position: number;
        points: number;
        locality?: string;
    }[];
}

export interface Evolutions {
    season: string;
    totalRounds: number;
    driversEvolution?: DriverEvo[];
    constructorsEvolution?: ConstructorEvo[];
}

export interface RankingEvolutionProps {
    title: string;
    rankings: Evolutions;
    mappings: any;
    type: "drivers" | "teams"
}

export interface StandingEvolutionProps {
    title: string;
    standings: Evolutions;
    mappings: any;
    type: "drivers" | "teams"
}

export interface Driver {
    FullName: string;
    Tla: string; // Ej: "VER"
    TeamName: string;
    TeamColour: string;
    FirstName: string;
    LastName: string;
}

export interface TimingLine {
    Position: string;
    GapToLeader: string;
    IntervalToNext: string;
    LastLapTime: { Value: string; PersonalBest: boolean };
    InPit: boolean;
    Stopped: boolean;
}

export interface ExtrapolatedClock {
    Utc: string; // ISO string
    Remaining: string; // Formato "HH:mm:ss"
    Extrapolating: boolean;
}

export interface SessionInfo {
    "Meeting": SessionInfoMeeting,
    "SessionStatus": string,
    "ArchiveStatus": {
        "Status": string,
    },
    "Key": number,
    "Type": string,
    "Number": number,
    "Name": string,
    "StartDate": string,
    "EndDate": string,
    "GmtOffset": string,
    "Path": string,
    "_kf": boolean
}

export interface SessionInfoMeeting {
    "Key": number;
    "Name": string;
    "OfficialName": string;
    "Location": string;
    "Number": number;
    "Country": {
        "Key": number;
        "Code": string;
        "Name": string;
    },
    "Circuit": {
        "Key": number;
        "ShortName": string;
    }
}

export interface TrackStatus {
    "Status": string;
    "Message": string;
    "_kf": boolean
}

export interface WeatherData {
    "AirTemp": string;
    "Humidity": string;
    "Pressure": string;
    "Rainfall": string;
    "TrackTemp": string;
    "WindDirection": string;
    "WindSpeed": string;
    "_kf": boolean
}

export interface TimingLine {
    Position: string;
    GapToLeader: string;
    IntervalToNext: string; // Gap al coche de delante
    LastLapTime: { Value: string; PersonalBest: boolean };
    BestLapTime: { Value: string };
    InPit: boolean;
    PitOut?: boolean;
    Stopped: boolean;
    Sectors: Array<{ Value: string; PersonalBest: boolean; OverallBest: boolean }>;
}

export interface TimingAppData {
    "Lines": Record<string, {
        "RacingNumber": string;
        "Line": number;
        "Stints": {
            "LapFlags": number;
            "Compound": string;
            "New": string;
            "TyresNotChanged": string;
            "TotalLaps": number;
            "StartLaps": number;
            "LapTime": string;
            "LapNumber": number;
        }[]
    }>
    "_kf": boolean
}

export interface F1State {
    SessionInfo?: SessionInfo;
    DriverList?: Record<string, Driver>;
    TimingData?: {
        Lines: Record<string, TimingLine>;
    };
    TimingAppData?: TimingAppData;
    TrackStatus?: TrackStatus;
    ExtrapolatedClock?: ExtrapolatedClock;
    LapCount?: any;
    WeatherData?: WeatherData;
}
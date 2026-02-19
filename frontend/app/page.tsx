"use client"

import LeaderBoardComponent from "@/components/leader-board";
import SessionInfoComponent from "@/components/session-info";
import { useF1Live } from "@/hooks/use-live";
import { ExtrapolatedClock } from "@/types/state";
import { useState } from "react";

export default function Home() {
  const { data, isConnected } = useF1Live();

  const [updated, setUpdated] = useState(new Date());
  const [delayMs, setDelayMs] = useState(0);
  const [delayTarget, setDelayTarget] = useState(0);
  const [blocking, setBlocking] = useState(false);

  console.log("SessionInfo", data?.TimingAppData);
  return (
    <div className="flex flex-col gap-2 p-2">
      <SessionInfoComponent sessionInfo={data?.SessionInfo} trackStatus={data.TrackStatus} lapCount={data?.LapCount} weatherData={data?.WeatherData} extrapolatedClock={data?.ExtrapolatedClock || {} as ExtrapolatedClock} delayMs={delayMs} />

      <LeaderBoardComponent driverList={data?.DriverList} timingData={data?.TimingData} timingAppData={data?.TimingAppData} lapCount={data?.LapCount} />
    </div>
  );
}

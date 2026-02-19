"use client";

import clsx from "clsx";
import { motion } from "motion/react";

import type { Driver, TimingDataDriver } from "@/types/state.type";

import { useDataStore } from "@/stores/useDataStore";
import { useSettingsStore } from "@/stores/useSettingsStore";

import DriverCarMetrics from "./DriverCarMetrics";
import DriverGap from "./DriverGap";
import DriverInfo from "./DriverInfo";
import DriverLapTime from "./DriverLapTime";
import DriverMiniSectors from "./DriverMiniSectors";
import DriverPit from "./DriverPit";
import DriverTag from "./DriverTag";
import DriverTire from "./DriverTire";

type Props = {
	position: number;
	driver: Driver;
	timingDriver: TimingDataDriver;
};

const hasDRS = (drs: number) => drs > 9;

const possibleDRS = (drs: number) => drs === 8;

const inDangerZone = (position: number, sessionPart: number) => {
	switch (sessionPart) {
		case 1:
			return position > 15;
		case 2:
			return position > 10;
		case 3:
		default:
			return false;
	}
};

export default function Driver({ driver, timingDriver, position }: Props) {
	const sessionPart = useDataStore((state) => state.state?.TimingData?.SessionPart);
	const lapsPart = useDataStore((state) => state.state?.TimingData?.Lines[driver.RacingNumber]);
	const timingStatsDriver = useDataStore((state) => state.state?.TimingStats?.Lines[driver.RacingNumber]);
	const appTimingDriver = useDataStore((state) => state.state?.TimingAppData?.Lines[driver?.RacingNumber ?? ""]);
	const carData = useDataStore((state) => (state?.carsData ? state.carsData[driver.RacingNumber].Channels : undefined));

	const hasFastest = timingStatsDriver?.PersonalBestLapTime.Position == 1;

	const carMetrics = useSettingsStore((state) => state.carMetrics);

	const favoriteDriver = useSettingsStore((state) => state.favoriteDrivers.includes(driver?.RacingNumber ?? ""));

	return (
		<motion.div
			layout="position"
			className={clsx("flex flex-col gap-1 rounded-box p-1.5 select-none", {
				"opacity-50": timingDriver.KnockedOut || timingDriver.Retired || timingDriver.Stopped,
				"bg-info/15": favoriteDriver,
				"bg-primary/15": hasFastest,
				"bg-error/15": sessionPart != undefined && inDangerZone(position, sessionPart),
			})}
		>
			<div
				className="grid items-center gap-2"
				style={{
					gridTemplateColumns: carMetrics
						? "5.5rem 3.5rem 5.5rem 4rem 5rem 5.5rem auto 10.5rem"
						: "5.5rem 3.5rem 5.5rem 4rem 5rem 5.5rem auto",
				}}
			>
				<DriverTag className="min-w-full!" short={driver?.Tla} teamColor={driver?.TeamColour} position={position} />
				<DriverPit
					on={carData ? hasDRS(carData[45]) : false}
					possible={carData ? possibleDRS(carData[45]) : false}
					inPit={timingDriver.InPit}
					pitOut={timingDriver.PitOut}
				/>
				<DriverTire stints={appTimingDriver?.Stints} totalLaps={lapsPart?.NumberOfLaps ?? 0} />
				<DriverInfo timingDriver={timingDriver} gridPos={appTimingDriver ? parseInt(appTimingDriver.GridPos) : 0} />
				<DriverGap timingDriver={timingDriver} sessionPart={sessionPart} />
				<DriverLapTime last={timingDriver.LastLapTime} best={timingDriver.BestLapTime} hasFastest={hasFastest} />
				<DriverMiniSectors sectors={timingDriver.Sectors} bestSectors={timingStatsDriver?.BestSectors} />

				{carMetrics && carData && <DriverCarMetrics carData={carData} />}
			</div>
		</motion.div>
	);
}

import clsx from "clsx";

import type { Sector, TimingDataDriver, TimingStatsDriver } from "@/types/state.type";
import { useSettingsStore } from "@/stores/useSettingsStore";

type Props = {
	sectors: TimingDataDriver["Sectors"];
	bestSectors: TimingStatsDriver["BestSectors"] | undefined;
};

export default function DriverMiniSectors({ sectors = [], bestSectors }: Props) {
	const showMiniSectors = useSettingsStore((state) => state.showMiniSectors);
	const showBestSectors = useSettingsStore((state) => state.showBestSectors);

	const sectorsArray: Sector[] = Array.isArray(sectors)
		? sectors
		: Object.values(sectors ?? {});


	const handleSegments = (sector: Sector): Sector["Segments"] => {
		return Array.isArray(sector.Segments)
			? sector.Segments
			: Object.values(sector.Segments ?? {});
	}

	return (
		<div className="flex gap-2">
			{sectorsArray?.map((sector, i) => (
				<div key={`sector.${i}`} className="flex flex-col gap-1">
					{showMiniSectors && (
						<div className="flex flex-row gap-1">
							{handleSegments(sector).map((segment, j) => (
								<MiniSector status={segment.Status} key={`sector.mini.${j}`} />
							))}
						</div>
					)}

					<div className={clsx("flex", showMiniSectors ? "items-center gap-1" : "flex-col")}>
						<p
							className={clsx("text-lg leading-none font-medium tabular-nums", {
								"text-primary!": sector.OverallFastest,
								"text-success!": sector.PersonalFastest,
								"text-neutral-content/20": !sector.Value,
							})}
						>
							{!!sector.Value ? sector.Value : !!sector.PreviousValue ? sector.PreviousValue : "-- ---"}
						</p>

						{showBestSectors && (
							<p
								className={clsx("text-sm leading-none text-neutral-content/20 tabular-nums", {
									"text-primary!": bestSectors?.[i]?.Position === 1,
								})}
							>
								{bestSectors && bestSectors[i]?.Value ? bestSectors[i].Value : "-- ---"}
							</p>
						)}
					</div>
				</div>
			))}
		</div>
	);
}

function MiniSector({ status }: { status: number }) {
	return (
		<div
			style={{ width: 10, height: 5, borderRadius: 2 }}
			className={clsx({
				"bg-warning": status === 2048 || status === 2052, // TODO unsure
				"bg-success": status === 2049,
				"bg-secondary": status === 2051,
				"bg-info": status === 2064,
				"bg-neutral-content/20": status === 0,
			})}
		/>
	);
}

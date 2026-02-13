"use client";

import LeaderBoard from "@/components/dashboard/LeaderBoard";
import RaceControl from "@/components/dashboard/RaceControl";
import TeamRadios from "@/components/dashboard/TeamRadios";
import TrackViolations from "@/components/dashboard/TrackViolations";
import Map from "@/components/dashboard/Map";
// import Footer from "@/components/Footer";

export default function Page() {
	return (
		<div className="flex w-full flex-col gap-2">
			<div className="flex w-full flex-col gap-2 2xl:flex-row">
				<div className="card bg-base-300 overflow-x-auto">
					<div className="card-body p-2">
						<LeaderBoard />
					</div>
				</div>

				<div className="flex-1 2xl:max-h-200">
					<div className="card bg-base-300 overflow-x-auto">
						<div className="card-body p-2">
							<Map />
						</div>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-2 divide-y *:h-120 *:overflow-y-auto *:rounded-box *:p-2 md:divide-y-0 lg:grid-cols-3">
				<div className="card bg-base-300 overflow-x-auto">
					<div className="card-body p-2">
						<RaceControl />
					</div>
				</div>

				<div className="card bg-base-300 overflow-x-auto">
					<div className="card-body p-2">
						<TeamRadios />
					</div>
				</div>

				<div className="card bg-base-300 overflow-x-auto">
					<div className="card-body p-2">
						<TrackViolations />
					</div>
				</div>
			</div>

			{/* <Footer /> */}
		</div>
	);
}

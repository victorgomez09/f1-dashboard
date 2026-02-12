"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import Link from "next/link";
import clsx from "clsx";

import { useSidebarStore } from "@/stores/useSidebarStore";
import { useSettingsStore } from "@/stores/useSettingsStore";

import ConnectionStatus from "@/components/ConnectionStatus";
import DelayInput from "@/components/DelayInput";
import SidenavButton from "@/components/SidenavButton";
import DelayTimer from "@/components/DelayTimer";

const liveTimingItems = [
	{
		href: "/dashboard",
		name: "Dashboard",
	},
	{
		href: "/dashboard/track-map",
		name: "Track Map",
	},
	{
		href: "/dashboard/standings",
		name: "Standings",
	},
	{
		href: "/dashboard/weather",
		name: "Weather",
	},
];

type Props = {
	connected: boolean;
};

export default function Sidebar({ connected }: Props) {
	// const favoriteDrivers = useSettingsStore((state) => state.favoriteDrivers);
	// const drivers = useDataStore((state) => state.driverList);

	// const driverItems = drivers
	// 	? favoriteDrivers.map((nr) => ({
	// 			href: `/dashboard/driver/${nr}`,
	// 			name: drivers[nr].fullName,
	// 		}))
	// 	: null;

	const { opened, pinned } = useSidebarStore();
	const close = useSidebarStore((state) => state.close);
	const open = useSidebarStore((state) => state.open);

	const pin = useSidebarStore((state) => state.pin);
	const unpin = useSidebarStore((state) => state.unpin);

	const oledMode = useSettingsStore((state) => state.oledMode);

	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth < 768) {
				unpin();
			}
		};

		window.addEventListener("resize", handleResize);
		handleResize();

		return () => window.removeEventListener("resize", handleResize, false);
	}, [unpin]);

	return (
		<div>
			<motion.div className="hidden md:block" style={{ width: 216 }} animate={{ width: pinned ? 216 : 8 }} />

			<AnimatePresence>
				{opened && (
					<motion.div
						onTouchEnd={() => close()}
						className="fixed top-0 right-0 bottom-0 left-0 z-30 backdrop-blur-sm md:hidden"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
					/>
				)}
			</AnimatePresence>

			<motion.div
				className="no-scrollbar fixed top-0 bottom-0 left-0 z-40 flex overflow-y-auto p-2"
				//
				onHoverEnd={!pinned ? () => close() : undefined}
				onHoverStart={!pinned ? () => open() : undefined}
				//
				animate={{ left: pinned || opened ? 0 : -216 }}
				transition={{ type: "spring", bounce: 0.1 }}
			>
				<ul className="menu bg-base-300 rounded-box w-52">
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-2">
							<DelayInput saveDelay={500} />
							<DelayTimer />

							<ConnectionStatus connected={connected} />
						</div>

						<SidenavButton className="hidden md:flex" onClick={() => (pinned ? unpin() : pin())} />
						<SidenavButton className="md:hidden" onClick={() => close()} />
					</div>

					<li>
						<h2 className="menu-title">Live Timming</h2>

						<ul>
							{liveTimingItems.map((item) => (
								<Item key={item.href} item={item} />
							))}
						</ul>
					</li>

					{/* <p className="mt-4 p-2 text-sm text-zinc-500">Favorite Drivers</p>

					<div className="flex flex-col gap-1">
						{driverItems === null && (
							<>
								<div className="h-8 animate-pulse rounded-box bg-zinc-800" />
								<div className="h-8 animate-pulse rounded-box bg-zinc-800" />
							</>
						)}
						{driverItems !== null && driverItems.length === 0 && <div className="p-2">No favorites</div>}
						{driverItems?.map((item) => <Item key={item.href} item={item} />)}
					</div> */}

					<li>
						<h2 className="menu-title">Live Timming</h2>

						<ul>

							<Item item={{ href: "/dashboard/settings", name: "Settings" }} />

							<Item target="_blank" item={{ href: "/schedule", name: "Schedule" }} />
							<Item target="_blank" item={{ href: "/help", name: "Help" }} />
							<Item target="_blank" item={{ href: "/", name: "Home" }} />
						</ul>
					</li>
				</ul>
			</motion.div>
		</div>
	);
}

type ItemProps = {
	target?: string;
	item: { href: string; name: string };
};

const Item = ({ target, item }: ItemProps) => {
	const active = usePathname() === item.href;

	return (
		<li
			className={clsx({
				"menu-active": active,
			})}
		>
			<Link href={item.href} target={target}>
				{item.name}
			</Link>
		</li>
	);
};

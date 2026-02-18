import clsx from "clsx";

type Props = {
	teamColor: string;
	short: string;
	position?: number;
	className?: string;
};

export default function DriverTag({ position, teamColor, short, className }: Props) {
	return (
		<div
			id="walkthrough-driver-position"
			className={clsx(
				"grid grid-cols-3 items-center font-semibold h-full w-full",
				className,
			)}
		>
			{position && <p className="flex items-center justify-center h-8 w-full rounded-l-box" style={{ backgroundColor: `#${teamColor}` }}>{position}</p>}

			<div className="flex items-center justify-center col-span-2 h-8 text-center rounded-r-box" style={{ backgroundColor: `color-mix(in srgb, #${teamColor}, transparent 50%)` }}>
				<p className="w-full">{short}</p>
			</div>
		</div>
	);
}

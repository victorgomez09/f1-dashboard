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
				"flex items-center justify-between gap-0.5 rounded-box p-2 font-black w-full",
				className,
			)}
		>
			{position && <p className="p-2" style={{ backgroundColor: `#${teamColor}` }}>{position}</p>}

			<div style={{ backgroundColor: `color-mix(in srgb, #${teamColor}, transparent 80%)` }}>
				<p className="px-1">{short}</p>
			</div>
		</div>
	);
}

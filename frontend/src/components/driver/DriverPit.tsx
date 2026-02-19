import clsx from "clsx";

type Props = {
	on: boolean;
	possible: boolean;
	inPit: boolean;
	pitOut: boolean;
};

export default function DriverPit({ on, possible, inPit, pitOut }: Props) {
	const pit = inPit || pitOut;

	return (
		<span
			className={clsx(
				"text-md inline-flex h-8 w-full items-center justify-center rounded-box border-2 font-mono font-black",
				{
					"border-base-100 text-base-100": !pit && !on && !possible,
					"border-base-content text-base-content": !pit && !on && possible,
					"border-success text-success": !pit && on,
					"border-info text-info": pit,
				},
			)}
		>
			{pit ? "PIT" : "PIT"}
		</span>
	);
}

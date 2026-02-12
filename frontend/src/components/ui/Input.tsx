"use client";

import clsx from "clsx";

type Props = {
	value: string;
	setValue: (value: string) => void;
};

export default function Input({ value, setValue }: Props) {
	return (
		<input
			className={clsx(
				"input input-bordered w-full max-w-xs bg-base-200",
			)}
			type="text"
			value={value}
			onChange={(e) => setValue(e.target.value)}
		/>
	);
}

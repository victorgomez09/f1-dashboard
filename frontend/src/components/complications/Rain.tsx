import Image from "next/image";

import rainIcon from "public/icons/cloud.heavyrain.svg";
import noRainIcon from "public/icons/cloud.rain.svg";

type Props = {
	rain: boolean;
};

export default function RainComplication({ rain }: Props) {
	return (
		<div className="relative flex h-13.75 w-13.75 items-center justify-center rounded-full bg-black">
			{rain ? (
				<Image src={rainIcon} alt="rain" className="h-6.25 w-auto" />
			) : (
				<Image src={noRainIcon} alt="no rain" className="h-6.25 w-auto" />
			)}
		</div>
	);
}

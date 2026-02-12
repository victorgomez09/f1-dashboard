type StatusMessage = {
	message: string;
	color: string;
	trackColor: string;
	bySector?: boolean;
	pulse?: number;
	hex: string;
};

type MessageMap = {
	[key: string]: StatusMessage;
};

export const getTrackStatusMessage = (statusCode: number | undefined): StatusMessage | null => {
	const messageMap: MessageMap = {
		1: { message: "Track Clear", color: "badge-success", trackColor: "stroke-white", hex: "#34b981" },
		2: { message: "Yellow Flag", color: "badge-warning", trackColor: "stroke-amber-400", bySector: true, hex: "#fbbf24", },
		3: { message: "Flag", color: "badge-warning", trackColor: "stroke-amber-400", bySector: true, hex: "#fbbf24" },
		4: { message: "Safety Car", color: "badge-warning", trackColor: "stroke-amber-400", hex: "#fbbf24" },
		5: { message: "Red Flag", color: "badge-error", trackColor: "stroke-red-500", hex: "#ef4444" },
		6: { message: "VSC Deployed", color: "badge-warning", trackColor: "stroke-amber-400", hex: "#fbbf24" },
		7: { message: "VSC Ending", color: "badge-warning", trackColor: "stroke-amber-400", hex: "#fbbf24" },
	};

	return statusCode ? (messageMap[statusCode] ?? messageMap[0]) : null;
};

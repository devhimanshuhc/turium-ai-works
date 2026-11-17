import { DM_Sans, Instrument_Serif } from "next/font/google";

export const dmSans = DM_Sans({
	subsets: ["latin"],
	weight: [
		"100",
		"200",
		"300",
		"400",
		"500",
		"600",
		"700",
		"800",
		"900",
		"1000",
	],
	display: "swap",
});

export const instrumentSerif = Instrument_Serif({
	subsets: ["latin"],
	weight: "400",
	style: ["normal", "italic"],
	variable: "--font-display-serif",
	display: "swap",
});

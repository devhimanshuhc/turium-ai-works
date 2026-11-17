"use client";

import { Joyride } from "react-joyride";
import { TOUR_STEPS, type TourId } from "@/constants";
import { useProductTour } from "@/hooks";
import { TourTooltip } from "./TourTooltip.view";

export function ProductTour({ tourId }: { tourId: TourId }) {
	const { run, onEvent } = useProductTour(tourId);

	return (
		<Joyride
			run={run}
			steps={TOUR_STEPS[tourId]}
			continuous
			onEvent={onEvent}
			tooltipComponent={TourTooltip}
			locale={{ back: "Back", next: "Next", last: "Done", skip: "Skip tour" }}
			floatingOptions={{ hideArrow: true }}
			options={{
				skipBeacon: true,
				overlayClickAction: false,
				overlayColor: "rgba(0, 0, 0, 0.6)",
				spotlightPadding: 6,
				spotlightRadius: 8,
				zIndex: 60,
			}}
		/>
	);
}

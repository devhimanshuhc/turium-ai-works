"use client";

import { useEffect, useState } from "react";
import { EVENTS, type EventHandler, STATUS } from "react-joyride";
import { TOUR_RESTART_EVENT, type TourId } from "@/constants";
import { hasSeenTour, markTourSeen } from "@/utils";

export function useProductTour(tourId: TourId) {
	const [run, setRun] = useState(false);

	useEffect(() => {
		const startIfUnseen = () => setRun(!hasSeenTour(tourId));
		startIfUnseen();
		window.addEventListener(TOUR_RESTART_EVENT, startIfUnseen);
		return () => window.removeEventListener(TOUR_RESTART_EVENT, startIfUnseen);
	}, [tourId]);

	const onEvent: EventHandler = ({ type, status }) => {
		const isOver =
			type === EVENTS.TOUR_END ||
			status === STATUS.FINISHED ||
			status === STATUS.SKIPPED;
		if (!isOver) return;
		markTourSeen(tourId);
		setRun(false);
	};

	return { run, onEvent };
}

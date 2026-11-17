import { TOUR_IDS, TOUR_STORAGE_PREFIX, type TourId } from "@/constants";

// Storage can throw (private mode, blocked site data); the tour is a
// convenience, so failing to read or write it must never break the page.
export const hasSeenTour = (tourId: TourId) => {
	try {
		return localStorage.getItem(TOUR_STORAGE_PREFIX + tourId) === "seen";
	} catch {
		return true;
	}
};

export const markTourSeen = (tourId: TourId) => {
	try {
		localStorage.setItem(TOUR_STORAGE_PREFIX + tourId, "seen");
	} catch {}
};

export const resetTours = () => {
	try {
		for (const tourId of TOUR_IDS) {
			localStorage.removeItem(TOUR_STORAGE_PREFIX + tourId);
		}
	} catch {}
};

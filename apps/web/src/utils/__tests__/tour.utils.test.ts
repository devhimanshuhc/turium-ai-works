import { afterEach, describe, expect, it, vi } from "vitest";
import { hasSeenTour, markTourSeen, resetTours } from "../tour.utils";

afterEach(() => {
	localStorage.clear();
	vi.restoreAllMocks();
});

describe("tour storage", () => {
	it("remembers a finished tour until the tours are reset", () => {
		expect(hasSeenTour("app")).toBe(false);

		markTourSeen("app");
		expect(hasSeenTour("app")).toBe(true);
		expect(hasSeenTour("knowledge-base")).toBe(false);

		resetTours();
		expect(hasSeenTour("app")).toBe(false);
	});

	it("treats unreadable storage as seen so the tour never blocks the page", () => {
		vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
			throw new Error("blocked");
		});

		expect(hasSeenTour("app")).toBe(true);
	});
});

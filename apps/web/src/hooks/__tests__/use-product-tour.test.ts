import { act, renderHook } from "@testing-library/react";
import type { EventData } from "react-joyride";
import { afterEach, describe, expect, it } from "vitest";
import { TOUR_RESTART_EVENT } from "@/constants";
import { hasSeenTour, markTourSeen } from "@/utils";
import { useProductTour } from "../use-product-tour";

const controls = {} as Parameters<
	ReturnType<typeof useProductTour>["onEvent"]
>[1];

const finish = (onEvent: ReturnType<typeof useProductTour>["onEvent"]) =>
	act(() =>
		onEvent({ type: "tour:end", status: "finished" } as EventData, controls),
	);

afterEach(() => localStorage.clear());

describe("useProductTour", () => {
	it("runs the first time and is remembered once finished", () => {
		const { result } = renderHook(() => useProductTour("app"));

		expect(result.current.run).toBe(true);

		finish(result.current.onEvent);

		expect(result.current.run).toBe(false);
		expect(hasSeenTour("app")).toBe(true);
	});

	it("stays hidden after it has been seen", () => {
		markTourSeen("app");

		const { result } = renderHook(() => useProductTour("app"));

		expect(result.current.run).toBe(false);
	});

	it("runs again when the tours are reset and restarted", () => {
		markTourSeen("app");
		const { result } = renderHook(() => useProductTour("app"));

		localStorage.clear();
		act(() => {
			window.dispatchEvent(new Event(TOUR_RESTART_EVENT));
		});

		expect(result.current.run).toBe(true);
	});
});

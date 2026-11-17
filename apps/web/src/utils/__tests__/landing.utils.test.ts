import { describe, expect, it } from "vitest";
import {
	formatStat,
	gridIndexAt,
	magneticOffset,
	padCounter,
	splitCitationMarkers,
} from "../landing.utils";

describe("landing utils", () => {
	it("formats counters and stats", () => {
		expect(padCounter(7.6)).toBe("008");
		expect(padCounter(100)).toBe("100");
		expect(formatStat(5.24, 1)).toBe("5.2");
		expect(formatStat(13.6, 0)).toBe("14");
	});

	it("pulls toward the pointer and caps the pull", () => {
		const rect = { left: 0, top: 0, width: 100, height: 40 };

		expect(magneticOffset({ x: 50, y: 20 }, rect, 10)).toEqual({ x: 0, y: 0 });
		expect(magneticOffset({ x: 100, y: 0 }, rect, 10)).toEqual({ x: 10, y: -10 });
		expect(magneticOffset({ x: 900, y: 900 }, rect, 10)).toEqual({ x: 10, y: 10 });
	});

	it("finds the grid cell under a point, clamped to the grid", () => {
		const size = { width: 100, height: 100 };
		const grid = { columns: 10, rows: 10 };

		expect(gridIndexAt({ x: 0, y: 0 }, size, grid)).toBe(0);
		expect(gridIndexAt({ x: 55, y: 25 }, size, grid)).toBe(25);
		expect(gridIndexAt({ x: 500, y: 500 }, size, grid)).toBe(99);
	});

	it("splits citation markers out of answer text", () => {
		expect(splitCitationMarkers("Fridays [1] and month end [2].")).toEqual([
			{ kind: "text", text: "Fridays " },
			{ kind: "citation", number: 1 },
			{ kind: "text", text: " and month end " },
			{ kind: "citation", number: 2 },
			{ kind: "text", text: "." },
		]);
	});
});

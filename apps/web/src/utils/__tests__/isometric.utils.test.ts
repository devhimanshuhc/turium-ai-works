import { describe, expect, it } from "vitest";
import { isoBoxFaces, projectIso } from "../isometric.utils";

describe("projectIso", () => {
	it("projects the three axes to the isometric directions", () => {
		const right = projectIso({ x: 10, y: 0, z: 0 });
		const left = projectIso({ x: 0, y: 10, z: 0 });
		const up = projectIso({ x: 0, y: 0, z: 10 });

		expect(right.x).toBeGreaterThan(0);
		expect(right.y).toBeCloseTo(5);
		expect(left.x).toBeLessThan(0);
		expect(left.y).toBeCloseTo(5);
		expect(up).toEqual({ x: 0, y: -10 });
	});
});

describe("isoBoxFaces", () => {
	it("returns a four-point polygon for each visible face", () => {
		const faces = isoBoxFaces({ x: 0, y: 0, z: 0, width: 10, depth: 10, height: 10 });

		for (const face of [faces.top, faces.left, faces.right]) {
			expect(face.split(" ")).toHaveLength(4);
		}
	});

	it("lifts the top face by the box height", () => {
		const flat = isoBoxFaces({ x: 0, y: 0, z: 0, width: 10, depth: 10, height: 0 });
		const tall = isoBoxFaces({ x: 0, y: 0, z: 0, width: 10, depth: 10, height: 20 });
		const firstY = (polygon: string) => Number(polygon.split(" ")[0].split(",")[1]);

		expect(firstY(flat.top) - firstY(tall.top)).toBeCloseTo(20);
	});
});

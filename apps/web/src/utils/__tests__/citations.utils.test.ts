import { describe, expect, it } from "vitest";
import type { Citation } from "@/types";
import {
	highlightMatchedChunk,
	linkCitationMarkers,
	splitCitations,
} from "../citations.utils";

const citation = (number: number, cited: boolean): Citation => ({
	number,
	item_id: `item-${number}`,
	parent_chunk_id: `chunk-${number}`,
	title: `Source ${number}`,
	url: null,
	source_type: "note",
	snippet: "snippet",
	score: 0.1,
	cited,
});

describe("linkCitationMarkers", () => {
	it("turns single and adjacent markers into anchor links for the message", () => {
		expect(linkCitationMarkers("Fridays [1] and month end [2][3].", "m1")).toBe(
			"Fridays [1](#source-m1-1) and month end [2](#source-m1-2)[3](#source-m1-3).",
		);
	});

	it("leaves text without markers and partial markers untouched", () => {
		expect(linkCitationMarkers("No sources here [a] [1", "m1")).toBe("No sources here [a] [1");
	});
});

describe("splitCitations", () => {
	it("separates cited from other retrieved sources, ordered by number", () => {
		const { cited, others } = splitCitations([citation(3, false), citation(2, true), citation(1, true)]);

		expect(cited.map((c) => c.number)).toEqual([1, 2]);
		expect(others.map((c) => c.number)).toEqual([3]);
	});

	it("handles missing citations", () => {
		expect(splitCitations(null)).toEqual({ cited: [], others: [] });
	});
});

describe("highlightMatchedChunk", () => {
	it("marks the matched chunk inside the full section", () => {
		expect(
			highlightMatchedChunk({ snippet: "frozen on Fridays", content: "Deploys are frozen on Fridays at 14:00." }),
		).toEqual([
			{ text: "Deploys are ", isMatch: false },
			{ text: "frozen on Fridays", isMatch: true },
			{ text: " at 14:00.", isMatch: false },
		]);
	});

	it("falls back to the snippet for messages saved without the section", () => {
		expect(highlightMatchedChunk({ snippet: "only the chunk", content: "" })).toEqual([
			{ text: "only the chunk", isMatch: true },
		]);
	});
});

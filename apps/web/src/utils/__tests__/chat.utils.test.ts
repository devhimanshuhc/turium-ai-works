import { describe, expect, it } from "vitest";
import { describeChatSource, pickKnowledgeBases } from "../chat.utils";

describe("pickKnowledgeBases", () => {
	it("keeps only the selected knowledge bases", () => {
		const all = [
			{ id: "a", name: "A", description: null, item_count: 0, created_at: "" },
			{ id: "b", name: "B", description: null, item_count: 0, created_at: "" },
		];

		expect(pickKnowledgeBases(all, ["b"]).map(({ id }) => id)).toEqual(["b"]);
		expect(pickKnowledgeBases(undefined, ["b"])).toEqual([]);
	});
});

describe("describeChatSource", () => {
	it("explains where answers come from in each mode", () => {
		expect(describeChatSource("general")).toContain("general knowledge");
		expect(describeChatSource("knowledge_base")).toContain("with sources");
		expect(describeChatSource("new")).toContain("Tick knowledge bases");
	});
});

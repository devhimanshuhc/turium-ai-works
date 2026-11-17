import { describe, expect, it } from "vitest";
import type { Item } from "@/types";
import { getItemDisplayTitle, getItemsPollInterval, hasPendingItems } from "../items.utils";

const item = (overrides: Partial<Item>): Item => ({
	id: "1",
	knowledge_base_id: "kb",
	source_type: "note",
	status: "ready",
	title: null,
	url: null,
	error: null,
	content_preview: "",
	created_at: "2026-01-01T00:00:00Z",
	updated_at: "2026-01-01T00:00:00Z",
	...overrides,
});

describe("items polling", () => {
	it("polls every 2s only while an item is pending", () => {
		expect(getItemsPollInterval([item({ status: "pending" }), item({ status: "ready" })])).toBe(2000);
		expect(getItemsPollInterval([item({ status: "ready" }), item({ status: "failed" })])).toBe(false);
		expect(getItemsPollInterval([])).toBe(false);
		expect(getItemsPollInterval(undefined)).toBe(false);
		expect(hasPendingItems([item({ status: "pending" })])).toBe(true);
	});

	it("falls back from title to url to Untitled", () => {
		expect(getItemDisplayTitle(item({ title: "Doc", url: "https://a.com" }))).toBe("Doc");
		expect(getItemDisplayTitle(item({ url: "https://a.com" }))).toBe("https://a.com");
		expect(getItemDisplayTitle(item({}))).toBe("Untitled");
	});
});

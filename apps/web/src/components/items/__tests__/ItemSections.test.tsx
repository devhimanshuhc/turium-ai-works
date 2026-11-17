import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ItemSection } from "@/types";
import { ItemSections } from "../ItemSections";

const { query } = vi.hoisted(() => ({
	query: { current: {} as Record<string, unknown> },
}));

vi.mock("@/queries", () => ({ useItemSections: () => query.current }));

const SECTIONS: ItemSection[] = [
	{
		id: "section-1",
		position: 0,
		content: "Deploys freeze on Fridays.",
		chunks: [
			{
				id: "chunk-1",
				position: 0,
				context: "From the release policy.",
				content: "Deploys freeze on Fridays.",
			},
		],
	},
];

beforeEach(() => {
	query.current = { data: SECTIONS, isLoading: false, isError: false };
});

describe("ItemSections", () => {
	it("summarises sections and chunks, and expands a section to its chunks", async () => {
		render(<ItemSections itemId="item-1" />);

		expect(screen.getByText("1 section · 1 searchable chunk")).not.toBeNull();
		expect(screen.queryByText("From the release policy.")).toBeNull();

		await userEvent.click(screen.getByRole("button", { name: /Section 1/ }));

		expect(screen.getByText("From the release policy.")).not.toBeNull();
	});

	it("shows the request error", () => {
		query.current = {
			isLoading: false,
			isError: true,
			error: new Error("Item not found"),
		};

		render(<ItemSections itemId="item-1" />);

		expect(screen.getByText("Item not found")).not.toBeNull();
	});

	it("explains an item with no extracted text", () => {
		query.current = { data: [], isLoading: false, isError: false };

		render(<ItemSections itemId="item-1" />);

		expect(
			screen.getByText("No text could be extracted from this source."),
		).not.toBeNull();
	});
});

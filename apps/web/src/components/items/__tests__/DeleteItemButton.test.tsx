import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Item } from "@/types";
import { DeleteItemButton } from "../DeleteItemButton";

const { mutate, mutation } = vi.hoisted(() => ({
	mutate: vi.fn(),
	mutation: { current: {} as Record<string, unknown> },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
vi.mock("@/queries", () => ({ useDeleteItem: () => mutation.current }));

const ITEM: Item = {
	id: "item-1",
	knowledge_base_id: "kb-1",
	source_type: "note",
	status: "ready",
	title: "Leave policy",
	url: null,
	error: null,
	content_preview: "",
	created_at: "2026-11-17T10:00:00Z",
	updated_at: "2026-11-17T10:00:00Z",
};

beforeEach(() => {
	vi.clearAllMocks();
	mutation.current = { mutate, reset: vi.fn(), isPending: false, error: null };
});

describe("DeleteItemButton", () => {
	it("asks for confirmation before deleting", async () => {
		render(<DeleteItemButton item={ITEM} />);

		await userEvent.click(screen.getByRole("button", { name: "Delete Leave policy" }));

		expect(screen.getByText("Remove this item?")).not.toBeNull();
		expect(mutate).not.toHaveBeenCalled();
	});

	it("deletes the item on confirm", async () => {
		render(<DeleteItemButton item={ITEM} />);

		await userEvent.click(screen.getByRole("button", { name: "Delete Leave policy" }));
		await userEvent.click(screen.getByRole("button", { name: "Remove" }));

		expect(mutate).toHaveBeenCalledWith(ITEM, expect.any(Object));
	});

	it("shows a server error inside the dialog", async () => {
		mutation.current = { ...mutation.current, error: new Error("Item not found") };
		render(<DeleteItemButton item={ITEM} />);

		await userEvent.click(screen.getByRole("button", { name: "Delete Leave policy" }));

		expect(screen.getByText("Item not found")).not.toBeNull();
	});
});

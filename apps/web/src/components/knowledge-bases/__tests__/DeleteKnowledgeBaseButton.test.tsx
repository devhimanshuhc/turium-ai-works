import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeleteKnowledgeBaseButton } from "../DeleteKnowledgeBaseButton";

const { mutate, replace } = vi.hoisted(() => ({ mutate: vi.fn(), replace: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
vi.mock("@/queries", () => ({
	useDeleteKnowledgeBase: () => ({ mutate, reset: vi.fn(), isPending: false, error: null }),
	useChats: () => ({
		data: [
			{ id: "c1", title: "", knowledge_bases: [{ id: "kb-1", name: "Handbook" }] },
			{ id: "c2", title: "", knowledge_bases: [{ id: "kb-2", name: "Other" }] },
		],
	}),
}));

const KNOWLEDGE_BASE = {
	id: "kb-1",
	name: "Handbook",
	description: null,
	item_count: 3,
	created_at: "",
};

beforeEach(() => vi.clearAllMocks());

describe("DeleteKnowledgeBaseButton", () => {
	it("warns how many chats will stop searching it", async () => {
		render(<DeleteKnowledgeBaseButton knowledgeBase={KNOWLEDGE_BASE} />);

		await userEvent.click(screen.getByRole("button", { name: "Delete" }));

		expect(screen.getByText(/1 chat uses it/)).not.toBeNull();
	});

	it("deletes and leaves the page on success", async () => {
		mutate.mockImplementation((_id, { onSuccess }) => onSuccess());
		render(<DeleteKnowledgeBaseButton knowledgeBase={KNOWLEDGE_BASE} />);

		await userEvent.click(screen.getByRole("button", { name: "Delete" }));
		const dialogButtons = screen.getAllByRole("button", { name: "Delete" });
		await userEvent.click(dialogButtons[dialogButtons.length - 1]);

		expect(mutate).toHaveBeenCalledWith("kb-1", expect.any(Object));
		expect(replace).toHaveBeenCalledWith("/chats/new");
	});
});

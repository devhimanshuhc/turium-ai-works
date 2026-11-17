import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useStartChat } from "../use-start-chat";

const { createChatMutate, replace, lock, toastError, selection } = vi.hoisted(() => ({
	createChatMutate: vi.fn(),
	replace: vi.fn(),
	lock: vi.fn(),
	toastError: vi.fn(),
	selection: { ids: [] as string[] },
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("sonner", () => ({ toast: { error: toastError } }));
vi.mock("@/queries", () => ({
	useCreateChat: () => ({ mutate: createChatMutate, isPending: false }),
}));
vi.mock("@/contexts", () => ({
	useNewChatSelection: () => ({ selectedKnowledgeBaseIds: selection.ids, lock }),
}));

const succeedCreatingChat = () =>
	createChatMutate.mockImplementation((_body, { onSuccess }) =>
		onSuccess({ id: "chat-7" }),
	);

beforeEach(() => {
	vi.clearAllMocks();
	selection.ids = [];
});

describe("useStartChat", () => {
	it("creates the chat with the ticked knowledge bases and locks them", () => {
		selection.ids = ["kb-1", "kb-2"];
		succeedCreatingChat();
		const ask = vi.fn().mockResolvedValue(true);
		const onCreated = vi.fn();
		const { result } = renderHook(() => useStartChat(ask, onCreated));

		result.current.start("What changed?");

		expect(createChatMutate).toHaveBeenCalledWith(
			{ knowledge_base_ids: ["kb-1", "kb-2"] },
			expect.any(Object),
		);
		expect(lock).toHaveBeenCalled();
		expect(onCreated).toHaveBeenCalledWith("chat-7");
		expect(ask).toHaveBeenCalledWith("What changed?", "chat-7");
	});

	it("starts a general-knowledge chat when nothing is ticked", () => {
		succeedCreatingChat();
		const { result } = renderHook(() =>
			useStartChat(vi.fn().mockResolvedValue(true), vi.fn()),
		);

		result.current.start("Hi");

		expect(createChatMutate.mock.calls[0][0]).toEqual({ knowledge_base_ids: [] });
	});

	it("moves to the chat's URL only after the first answer is saved", async () => {
		succeedCreatingChat();
		const { result, rerender } = renderHook(
			({ answered }) => useStartChat(vi.fn().mockResolvedValue(answered), vi.fn()),
			{ initialProps: { answered: false } },
		);

		result.current.start("Q");
		await Promise.resolve();
		expect(replace).not.toHaveBeenCalled();

		rerender({ answered: true });
		result.current.start("Q");
		await waitFor(() => expect(replace).toHaveBeenCalledWith("/chats/chat-7"));
	});

	it("shows a toast when the chat cannot be created", () => {
		createChatMutate.mockImplementation((_body, { onError }) =>
			onError(new Error("Knowledge base not found")),
		);
		const { result } = renderHook(() => useStartChat(vi.fn(), vi.fn()));

		result.current.start("Q");

		expect(toastError).toHaveBeenCalledWith("Knowledge base not found");
	});
});

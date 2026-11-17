import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { QueryStreamEvent } from "@/types";
import { useAskQuestion } from "../use-ask-question";

const { streamQuery } = vi.hoisted(() => ({ streamQuery: vi.fn() }));
vi.mock("@/lib/query-stream", () => ({ streamQuery }));

const DONE_MESSAGE = {
	id: "m1",
	role: "assistant" as const,
	content: "Answer [1]",
	citations: [],
	grounding: null,
	created_at: "2026-01-01T00:00:00Z",
};

const createGate = () => {
	let open = () => {};
	const opened = new Promise<void>((resolve) => {
		open = resolve;
	});
	return { open, opened };
};

const renderAskHook = () => {
	const queryClient = new QueryClient();
	const invalidate = vi.spyOn(queryClient, "invalidateQueries");
	const wrapper = ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
	return { ...renderHook(() => useAskQuestion("chat-1"), { wrapper }), invalidate };
};

describe("useAskQuestion", () => {
	beforeEach(() => streamQuery.mockReset());

	it("tracks stage and tokens while streaming, then resets after done", async () => {
		const gate = createGate();
		streamQuery.mockImplementation(async function* () {
			yield { type: "status", stage: "searching" } satisfies QueryStreamEvent;
			yield { type: "token", text: "Answer" } satisfies QueryStreamEvent;
			yield { type: "token", text: " [1]" } satisfies QueryStreamEvent;
			await gate.opened;
			yield { type: "done", message: DONE_MESSAGE } satisfies QueryStreamEvent;
		});
		const { result, invalidate } = renderAskHook();

		act(() => {
			result.current.ask("When are deploys frozen?");
		});

		await waitFor(() => expect(result.current.draft).toBe("Answer [1]"));
		expect(result.current.stage).toBe("searching");
		expect(result.current.isStreaming).toBe(true);
		expect(result.current.question).toBe("When are deploys frozen?");
		expect(streamQuery).toHaveBeenCalledWith(
			{ chat_id: "chat-1", question: "When are deploys frozen?" },
			expect.any(AbortSignal),
		);

		await act(async () => gate.open());

		await waitFor(() => expect(result.current.isStreaming).toBe(false));
		expect(result.current.draft).toBe("");
		expect(result.current.error).toBeNull();
		expect(invalidate).toHaveBeenCalledWith({ queryKey: ["chats"] });
	});

	it("surfaces error events and retries the failed question", async () => {
		streamQuery.mockImplementationOnce(async function* () {
			yield { type: "error", detail: "Model unavailable" } satisfies QueryStreamEvent;
		});
		const { result } = renderAskHook();

		await act(() => result.current.ask("Q1"));

		expect(result.current.error).toBe("Model unavailable");
		expect(result.current.failedQuestion).toBe("Q1");
		expect(result.current.isStreaming).toBe(false);

		streamQuery.mockImplementationOnce(async function* () {
			yield { type: "done", message: DONE_MESSAGE } satisfies QueryStreamEvent;
		});
		await act(async () => result.current.retry());

		await waitFor(() => expect(result.current.error).toBeNull());
		expect(streamQuery).toHaveBeenLastCalledWith({ chat_id: "chat-1", question: "Q1" }, expect.any(AbortSignal));
	});

	it("reports request errors thrown before the stream starts", async () => {
		streamQuery.mockImplementation(async function* () {
			yield* [];
			throw new Error("Chat not found");
		});
		const { result } = renderAskHook();

		await act(() => result.current.ask("Q"));

		expect(result.current.error).toBe("Chat not found");
	});

	it("treats a stream that ends without done as an error", async () => {
		streamQuery.mockImplementation(async function* () {
			yield { type: "token", text: "partial" } satisfies QueryStreamEvent;
		});
		const { result } = renderAskHook();

		await act(() => result.current.ask("Q"));

		expect(result.current.error).toMatch(/stopped before it finished/);
	});

	it("aborts the stream on unmount", async () => {
		let signal: AbortSignal | undefined;
		streamQuery.mockImplementation(async function* (_body: unknown, abortSignal: AbortSignal) {
			signal = abortSignal;
			yield* [];
			await new Promise(() => {});
		});
		const { result, unmount } = renderAskHook();

		act(() => {
			result.current.ask("Q");
		});
		await waitFor(() => expect(signal).toBeDefined());
		unmount();

		expect(signal?.aborted).toBe(true);
	});
});

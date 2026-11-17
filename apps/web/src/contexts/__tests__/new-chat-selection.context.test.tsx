import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import {
	NewChatSelectionProvider,
	useNewChatSelection,
} from "../new-chat-selection.context";

const wrapper = ({ children }: { children: ReactNode }) => (
	<NewChatSelectionProvider>{children}</NewChatSelectionProvider>
);

describe("useNewChatSelection", () => {
	it("toggles knowledge bases on and off", () => {
		const { result } = renderHook(() => useNewChatSelection(), { wrapper });

		act(() => result.current.toggle("kb-1"));
		act(() => result.current.toggle("kb-2"));
		act(() => result.current.toggle("kb-1"));

		expect(result.current.selectedKnowledgeBaseIds).toEqual(["kb-2"]);
	});

	it("ignores toggles once locked and clears on reset", () => {
		const { result } = renderHook(() => useNewChatSelection(), { wrapper });

		act(() => result.current.toggle("kb-1"));
		act(() => result.current.lock());
		act(() => result.current.toggle("kb-2"));
		expect(result.current.selectedKnowledgeBaseIds).toEqual(["kb-1"]);

		act(() => result.current.reset());
		expect(result.current).toMatchObject({ selectedKnowledgeBaseIds: [], isLocked: false });
	});

	it("throws a clear error outside the provider", () => {
		expect(() => renderHook(() => useNewChatSelection())).toThrow(
			"useNewChatSelection must be used inside NewChatSelectionProvider",
		);
	});
});

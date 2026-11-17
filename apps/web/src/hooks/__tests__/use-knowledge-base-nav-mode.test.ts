import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useKnowledgeBaseNavMode } from "../use-knowledge-base-nav-mode";

const { route, selection, chatQuery } = vi.hoisted(() => ({
	route: { pathname: "/" },
	selection: { selectedKnowledgeBaseIds: ["kb-1"], isLocked: false, toggle: () => {} },
	chatQuery: { calledWith: undefined as string | null | undefined },
}));

vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
vi.mock("@/contexts", () => ({ useNewChatSelection: () => selection }));
vi.mock("@/queries", () => ({
	useChat: (id: string | null) => {
		chatQuery.calledWith = id;
		return { data: id ? { knowledge_bases: [{ id: "kb-9", name: "Locked" }] } : undefined };
	},
}));

beforeEach(() => {
	selection.isLocked = false;
});

describe("useKnowledgeBaseNavMode", () => {
	it("lets an unstarted new chat select knowledge bases", () => {
		route.pathname = "/chats/new";

		const { result } = renderHook(() => useKnowledgeBaseNavMode());

		expect(result.current.mode).toBe("select");
		expect(result.current.attachedIds).toEqual(["kb-1"]);
		expect(chatQuery.calledWith).toBeNull();
	});

	it("shows the selection as locked once the new chat has started", () => {
		route.pathname = "/chats/new";
		selection.isLocked = true;

		const { result } = renderHook(() => useKnowledgeBaseNavMode());

		expect(result.current).toMatchObject({ mode: "view", attachedIds: ["kb-1"] });
	});

	it("marks an existing chat's knowledge bases", () => {
		route.pathname = "/chats/chat-3";

		const { result } = renderHook(() => useKnowledgeBaseNavMode());

		expect(chatQuery.calledWith).toBe("chat-3");
		expect(result.current).toMatchObject({ mode: "view", attachedIds: ["kb-9"] });
	});

	it("marks nothing on other pages", () => {
		route.pathname = "/knowledge-bases/kb-1";

		const { result } = renderHook(() => useKnowledgeBaseNavMode());

		expect(result.current).toMatchObject({ mode: "view", attachedIds: [] });
	});
});

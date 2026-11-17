import { describe, expect, it } from "vitest";
import type { Chat } from "@/types";
import {
	countChatsUsingKnowledgeBase,
	describeKnowledgeBaseDeletion,
} from "../knowledge-bases.utils";

const chat = (knowledgeBaseIds: string[]): Chat => ({
	id: crypto.randomUUID(),
	title: "Chat",
	mode: "knowledge_base",
	knowledge_bases: knowledgeBaseIds.map((id) => ({ id, name: id })),
	created_at: "",
	updated_at: "",
});

describe("countChatsUsingKnowledgeBase", () => {
	it("counts chats locked to the knowledge base", () => {
		const chats = [chat(["kb-1"]), chat(["kb-1", "kb-2"]), chat(["kb-2"])];

		expect(countChatsUsingKnowledgeBase(chats, "kb-1")).toBe(2);
		expect(countChatsUsingKnowledgeBase(undefined, "kb-1")).toBe(0);
	});
});

describe("describeKnowledgeBaseDeletion", () => {
	it("warns about affected chats only when there are some", () => {
		expect(describeKnowledgeBaseDeletion("Handbook", 0)).toBe(
			'"Handbook" and all of its content will be permanently deleted.',
		);
		expect(describeKnowledgeBaseDeletion("Handbook", 1)).toContain(
			"1 chat uses it",
		);
		expect(describeKnowledgeBaseDeletion("Handbook", 3)).toContain(
			"3 chats use it",
		);
	});
});

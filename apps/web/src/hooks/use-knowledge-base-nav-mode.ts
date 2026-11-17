"use client";

import { usePathname } from "next/navigation";
import { useNewChatSelection } from "@/contexts";
import { useChat } from "@/queries";

export const NEW_CHAT_PATH = "/chats/new";

const chatIdFromPath = (pathname: string) => {
	const match = /^\/chats\/([^/]+)$/.exec(pathname);
	return match && match[1] !== "new" ? match[1] : null;
};

/**
 * How the sidebar's knowledge base list behaves on the current page:
 * - "select": a new chat that hasn't started — rows toggle selection.
 * - "view": rows are links; `attachedIds` marks a chat's locked knowledge bases.
 */
export function useKnowledgeBaseNavMode() {
	const pathname = usePathname();
	const selection = useNewChatSelection();
	const { data: chat } = useChat(chatIdFromPath(pathname));

	if (pathname === NEW_CHAT_PATH && !selection.isLocked) {
		return {
			mode: "select" as const,
			attachedIds: selection.selectedKnowledgeBaseIds,
			toggle: selection.toggle,
		};
	}
	const attachedIds =
		pathname === NEW_CHAT_PATH
			? selection.selectedKnowledgeBaseIds
			: (chat?.knowledge_bases.map(({ id }) => id) ?? []);
	return { mode: "view" as const, attachedIds, toggle: selection.toggle };
}

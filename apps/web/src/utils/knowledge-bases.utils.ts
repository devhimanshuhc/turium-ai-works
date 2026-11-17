import type { Chat } from "@/types";

export const countChatsUsingKnowledgeBase = (
	chats: Chat[] | undefined,
	knowledgeBaseId: string,
) =>
	(chats ?? []).filter((chat) =>
		chat.knowledge_bases.some(({ id }) => id === knowledgeBaseId),
	).length;

export const describeKnowledgeBaseDeletion = (
	name: string,
	chatCount: number,
) => {
	const base = `"${name}" and all of its content will be permanently deleted.`;
	if (chatCount === 0) return base;
	const chats = chatCount === 1 ? "1 chat uses" : `${chatCount} chats use`;
	return `${base} ${chats} it — their history stays, but they will no longer search it.`;
};

"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useNewChatSelection } from "@/contexts";
import { useCreateChat } from "@/queries";

/**
 * A new chat is created by its first question, locked to whatever knowledge
 * bases are ticked in the sidebar (none = general knowledge). The URL moves to
 * the chat only after that first answer is saved, so the stream is never cut
 * off by a route change.
 */
export function useStartChat(
	ask: (question: string, chatId: string) => Promise<boolean>,
	onCreated: (chatId: string) => void,
) {
	const router = useRouter();
	const createChat = useCreateChat();
	const { selectedKnowledgeBaseIds, lock } = useNewChatSelection();

	const start = (question: string) =>
		createChat.mutate(
			{ knowledge_base_ids: selectedKnowledgeBaseIds },
			{
				onSuccess: async (chat) => {
					lock();
					onCreated(chat.id);
					if (await ask(question, chat.id)) {
						router.replace(`/chats/${chat.id}`);
					}
				},
				onError: (error) => toast.error(error.message),
			},
		);

	return { start, isStarting: createChat.isPending };
}

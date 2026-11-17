import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChatService } from "@/services";
import type { CreateChatBody } from "@/types";

export const CHAT_KEYS = {
	all: ["chats"] as const,
	detail: (id: string) => ["chats", id] as const,
	messages: (id: string) => ["chats", id, "messages"] as const,
};

export function useChats() {
	return useQuery({
		queryKey: CHAT_KEYS.all,
		queryFn: () => ChatService.getChats(),
	});
}

export function useChat(id: string | null) {
	return useQuery({
		queryKey: CHAT_KEYS.detail(id ?? ""),
		queryFn: () => ChatService.getChat(id as string),
		enabled: Boolean(id),
	});
}

export function useChatMessages(id: string | null) {
	return useQuery({
		queryKey: CHAT_KEYS.messages(id ?? ""),
		queryFn: () => ChatService.getMessages(id as string),
		enabled: Boolean(id),
	});
}

export function useCreateChat() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (body: CreateChatBody) => ChatService.createChat(body),
		onSuccess: (chat) => {
			queryClient.setQueryData(CHAT_KEYS.detail(chat.id), chat);
			queryClient.invalidateQueries({ queryKey: CHAT_KEYS.all });
		},
	});
}

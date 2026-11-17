import { ApiClient } from "@/lib/api-client";
import type { Chat, CreateChatBody, Message } from "@/types";

export class ChatService {
	static getChats() {
		return ApiClient.get<Chat[]>("/chats");
	}

	static getChat(id: string) {
		return ApiClient.get<Chat>(`/chats/${id}`);
	}

	static getMessages(chatId: string) {
		return ApiClient.get<Message[]>(`/chats/${chatId}/messages`);
	}

	static createChat(body: CreateChatBody) {
		return ApiClient.post<Chat>("/chats", body);
	}
}

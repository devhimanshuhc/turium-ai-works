import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KnowledgeBaseService } from "@/services";
import type { CreateKnowledgeBaseBody } from "@/types";
import { CHAT_KEYS } from "./chat.query";

export const KNOWLEDGE_BASE_KEYS = {
	all: ["knowledge-bases"] as const,
	detail: (id: string) => ["knowledge-bases", id] as const,
};

export function useKnowledgeBases() {
	return useQuery({
		queryKey: KNOWLEDGE_BASE_KEYS.all,
		queryFn: () => KnowledgeBaseService.getKnowledgeBases(),
	});
}

export function useKnowledgeBase(id: string) {
	return useQuery({
		queryKey: KNOWLEDGE_BASE_KEYS.detail(id),
		queryFn: () => KnowledgeBaseService.getKnowledgeBase(id),
	});
}

export function useCreateKnowledgeBase() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (body: CreateKnowledgeBaseBody) =>
			KnowledgeBaseService.createKnowledgeBase(body),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: KNOWLEDGE_BASE_KEYS.all }),
	});
}

export function useDeleteKnowledgeBase() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => KnowledgeBaseService.deleteKnowledgeBase(id),
		onSuccess: (_, id) => {
			queryClient.removeQueries({ queryKey: KNOWLEDGE_BASE_KEYS.detail(id) });
			queryClient.invalidateQueries({ queryKey: KNOWLEDGE_BASE_KEYS.all });
			queryClient.invalidateQueries({ queryKey: CHAT_KEYS.all });
		},
	});
}

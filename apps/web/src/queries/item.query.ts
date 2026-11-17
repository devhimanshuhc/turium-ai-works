import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ItemService } from "@/services";
import type { FileIngestBody, IngestBody, Item } from "@/types";
import { getItemsPollInterval } from "@/utils";
import { KNOWLEDGE_BASE_KEYS } from "./knowledge-base.query";

export const ITEM_KEYS = {
	byKnowledgeBase: (knowledgeBaseId: string) =>
		["items", knowledgeBaseId] as const,
	sections: (itemId: string) => ["items", "sections", itemId] as const,
};

export function useItems(knowledgeBaseId: string) {
	return useQuery({
		queryKey: ITEM_KEYS.byKnowledgeBase(knowledgeBaseId),
		queryFn: () => ItemService.getItems(knowledgeBaseId),
		refetchInterval: (query) => getItemsPollInterval(query.state.data),
	});
}

export function useItemSections(itemId: string) {
	return useQuery({
		queryKey: ITEM_KEYS.sections(itemId),
		queryFn: () => ItemService.getSections(itemId),
	});
}

function useInvalidateAfterIngest() {
	const queryClient = useQueryClient();

	return (item: Item) => {
		queryClient.invalidateQueries({
			queryKey: ITEM_KEYS.byKnowledgeBase(item.knowledge_base_id),
		});
		queryClient.invalidateQueries({ queryKey: KNOWLEDGE_BASE_KEYS.all });
	};
}

export function useIngestItem() {
	const onSuccess = useInvalidateAfterIngest();

	return useMutation({
		mutationFn: (body: IngestBody) => ItemService.ingest(body),
		onSuccess,
	});
}

export function useIngestFile() {
	const onSuccess = useInvalidateAfterIngest();

	return useMutation({
		mutationFn: (body: FileIngestBody) => ItemService.ingestFile(body),
		onSuccess,
	});
}

export function useDeleteItem() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (item: Item) => ItemService.deleteItem(item.id),
		onSuccess: (_, item) => {
			queryClient.invalidateQueries({
				queryKey: ITEM_KEYS.byKnowledgeBase(item.knowledge_base_id),
			});
			queryClient.invalidateQueries({ queryKey: KNOWLEDGE_BASE_KEYS.all });
		},
	});
}

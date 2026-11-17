import { ApiClient } from "@/lib/api-client";
import type { FileIngestBody, IngestBody, Item, ItemSection } from "@/types";

export class ItemService {
	static getItems(knowledgeBaseId: string) {
		return ApiClient.get<Item[]>("/items", {
			knowledge_base_id: knowledgeBaseId,
		});
	}

	static getSections(itemId: string) {
		return ApiClient.get<ItemSection[]>(`/items/${itemId}/sections`);
	}

	static ingest(body: IngestBody) {
		return ApiClient.post<Item>("/ingest", body);
	}

	static ingestFile({ knowledge_base_id, file }: FileIngestBody) {
		const formData = new FormData();
		formData.append("knowledge_base_id", knowledge_base_id);
		formData.append("file", file);
		return ApiClient.post<Item>("/ingest/file", formData);
	}

	static deleteItem(id: string) {
		return ApiClient.delete<void>(`/items/${id}`);
	}
}

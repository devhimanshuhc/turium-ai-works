import { ApiClient } from "@/lib/api-client";
import type { CreateKnowledgeBaseBody, KnowledgeBase } from "@/types";

export class KnowledgeBaseService {
	static getKnowledgeBases() {
		return ApiClient.get<KnowledgeBase[]>("/knowledge-bases");
	}

	static getKnowledgeBase(id: string) {
		return ApiClient.get<KnowledgeBase>(`/knowledge-bases/${id}`);
	}

	static createKnowledgeBase(body: CreateKnowledgeBaseBody) {
		return ApiClient.post<KnowledgeBase>("/knowledge-bases", body);
	}

	static deleteKnowledgeBase(id: string) {
		return ApiClient.delete<void>(`/knowledge-bases/${id}`);
	}
}

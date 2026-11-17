export type KnowledgeBase = {
	id: string;
	name: string;
	description: string | null;
	item_count: number;
	created_at: string;
};

export type CreateKnowledgeBaseBody = {
	name: string;
	description?: string;
};

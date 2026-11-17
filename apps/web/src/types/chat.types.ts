import type { SourceType } from "./item.types";

export type KnowledgeBaseSummary = {
	id: string;
	name: string;
};

export type ChatMode = "knowledge_base" | "general";

export type Chat = {
	id: string;
	title: string;
	mode: ChatMode;
	knowledge_bases: KnowledgeBaseSummary[];
	created_at: string;
	updated_at: string;
};

export type CreateChatBody = {
	title?: string;
	knowledge_base_ids: string[];
};

export type Citation = {
	number: number;
	item_id: string;
	parent_chunk_id: string;
	title: string;
	url: string | null;
	source_type: SourceType;
	snippet: string;
	content?: string;
	score: number;
	cited: boolean;
};

export type GroundingVerdict =
	| "grounded"
	| "partially_grounded"
	| "ungrounded"
	| "no_answer"
	| "unverified"
	| "general_knowledge";

export type Grounding = {
	verdict: GroundingVerdict;
	unsupported_claims: string[];
	explanation: string;
	invalid_citations: number[];
};

export type Message = {
	id: string;
	role: "user" | "assistant";
	content: string;
	citations: Citation[] | null;
	grounding: Grounding | null;
	created_at: string;
};

import type { ChatMode, KnowledgeBase, KnowledgeBaseSummary } from "@/types";

export const pickKnowledgeBases = (
	knowledgeBases: KnowledgeBase[] | undefined,
	ids: string[],
): KnowledgeBaseSummary[] =>
	(knowledgeBases ?? []).filter((knowledgeBase) =>
		ids.includes(knowledgeBase.id),
	);

export const describeChatSource = (mode: ChatMode | "new") => {
	if (mode === "general") {
		return "Answers come from the model's general knowledge, not your knowledge bases.";
	}
	if (mode === "knowledge_base") {
		return "Answers come only from this chat's knowledge bases, with sources.";
	}
	return "Tick knowledge bases in the sidebar to answer from your content, or just ask to use general knowledge.";
};

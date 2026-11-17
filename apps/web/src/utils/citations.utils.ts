import type { Citation } from "@/types";

const CITATION_MARKER = /\[(\d+)\]/g;

export const getCitationAnchorId = (messageId: string, number: number) =>
	`source-${messageId}-${number}`;

export const linkCitationMarkers = (content: string, messageId: string) =>
	content.replace(
		CITATION_MARKER,
		(_, number: string) =>
			`[${number}](#${getCitationAnchorId(messageId, Number(number))})`,
	);

export const splitCitations = (citations: Citation[] | null) => {
	const sorted = [...(citations ?? [])].sort((a, b) => a.number - b.number);
	return {
		cited: sorted.filter((citation) => citation.cited),
		others: sorted.filter((citation) => !citation.cited),
	};
};

export type HighlightedPart = { text: string; isMatch: boolean };

/**
 * The full section the model read, with the chunk that matched the question
 * marked. Falls back to the snippet alone for messages saved before sections
 * were recorded.
 */
export const highlightMatchedChunk = (
	citation: Pick<Citation, "snippet" | "content">,
): HighlightedPart[] => {
	const section = citation.content || citation.snippet;
	const start = section.indexOf(citation.snippet);
	if (!citation.content || start === -1) {
		return [{ text: section, isMatch: !citation.content }];
	}
	const end = start + citation.snippet.length;
	return [
		{ text: section.slice(0, start), isMatch: false },
		{ text: citation.snippet, isMatch: true },
		{ text: section.slice(end), isMatch: false },
	].filter((part) => part.text);
};

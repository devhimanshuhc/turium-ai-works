import type { Step } from "react-joyride";

export type TourId = "app" | "knowledge-base";

export const TOUR_STORAGE_PREFIX = "knowledge-inbox:tour:";

export const TOUR_RESTART_EVENT = "knowledge-inbox:tour-restart";

export const TOUR_IDS: TourId[] = ["app", "knowledge-base"];

const target = (name: string) => `[data-tour="${name}"]`;

export const TOUR_STEPS: Record<TourId, Step[]> = {
	app: [
		{
			target: "body",
			placement: "center",
			title: "Welcome to Knowledge Inbox",
			content:
				"Save notes, links and files, then ask questions and get answers that cite them. This takes 30 seconds.",
		},
		{
			target: target("create-knowledge-base"),
			placement: "right",
			title: "Create a knowledge base",
			content:
				"A knowledge base groups related content. Open it to add text, links or files.",
		},
		{
			target: target("knowledge-bases"),
			placement: "right",
			title: "Choose what a chat reads",
			content:
				"On a new chat, tick the knowledge bases to search. They lock when you send the first message. Leave them all unticked for a general-knowledge answer.",
		},
		{
			target: target("composer"),
			placement: "top",
			title: "Ask a question",
			content:
				"Answers stream in with numbered citations. Click a number to see the exact chunk it came from.",
		},
		{
			target: target("new-chat"),
			placement: "right",
			title: "Start a new chat",
			content: "Each chat keeps its own history and knowledge bases.",
		},
	],
	"knowledge-base": [
		{
			target: target("add-content"),
			placement: "bottom-end",
			title: "Add content",
			content:
				"Paste text, add a link, or upload a PDF, DOCX, TXT or Markdown file. Indexing runs in the background.",
		},
		{
			target: target("sources"),
			placement: "top",
			title: "See what was indexed",
			content:
				"Expand a source to see its sections and the searchable chunks, each with the context line generated for it.",
		},
	],
};

export const APP_ENTRY_PATH = "/chats/new";

export const HERO_COPY = {
	eyebrow: "AI knowledge inbox",
	headlineStart: "Ask anything you've ever",
	headlineEmphasis: "saved.",
	body: "Drop in notes, links and files. Knowledge Inbox answers your questions from them, and every sentence points to the source it came from.",
	fact: "Text, links, PDF, DOCX and Markdown — searched by meaning and by exact words.",
};

export const PREVIEW_CHAT = {
	knowledgeBase: "Falcon onboarding",
	question: "When are production deploys frozen?",
	answer:
		"Production deploys are frozen on Fridays after 14:00 IST [1] and during the last three business days of each month, while invoices are generated [1].",
	source: {
		title: "Project Falcon onboarding guide",
		snippet:
			"Production deploys are frozen on Fridays after 14:00 IST and during the last three business days of each month…",
	},
};

export const MARQUEE_WORDS = [
	"Notes",
	"Links",
	"PDF",
	"DOCX",
	"Markdown",
	"Hybrid search",
	"Cited answers",
	"Checked claims",
];

export const HOW_IT_WORKS_STAGES = [
	{
		id: "save",
		title: "Save",
		body: "Paste text, drop a link or upload a file. Pages are fetched on the server while you keep working.",
	},
	{
		id: "chunk",
		title: "Chunk",
		body: "Each document is cut into small pieces for search and larger sections for reading. A fast model notes where every piece belongs.",
	},
	{
		id: "search",
		title: "Search",
		body: "Your question is matched by meaning and by exact words, and the two rankings are merged into one.",
	},
	{
		id: "answer",
		title: "Answer",
		body: "The answer streams in with numbered sources. A second model checks every claim before it is saved.",
	},
] as const;

export type HowItWorksStageId = (typeof HOW_IT_WORKS_STAGES)[number]["id"];

export const STATEMENT =
	"No source, no answer. When your knowledge bases don't cover a question, Knowledge Inbox says so instead of guessing.";

export const EVAL_STATS = [
	{ value: 14, decimals: 0, suffix: "/14", label: "eval questions passed" },
	{
		value: 100,
		decimals: 0,
		suffix: "%",
		label: "of answers supported by their sources",
	},
	{
		value: 3,
		decimals: 0,
		suffix: "/3",
		label: "unanswerable questions refused",
	},
	{
		value: 5.2,
		decimals: 1,
		suffix: " s",
		label: "median time to a checked answer",
	},
] as const;

export const EVAL_NOTE =
	"From the offline eval in the repository: 14 questions over four documents, each answer judged by an LLM against a human-written reference.";

export const LANDING_LINKS = [
	{ label: "How it works", href: "#how" },
	{ label: "Evals", href: "#proof" },
	{ label: "Docs", href: "/docs" },
];

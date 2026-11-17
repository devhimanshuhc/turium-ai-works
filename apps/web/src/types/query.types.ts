import type { Message } from "./chat.types";

export type QueryStage = "planning" | "searching" | "answering" | "verifying";

export type QueryBody = {
	chat_id: string;
	question: string;
};

export type QueryStreamEvent =
	| { type: "status"; stage: QueryStage; query?: string }
	| { type: "sources"; count: number }
	| { type: "token"; text: string }
	| { type: "done"; message: Message }
	| { type: "error"; detail: string };

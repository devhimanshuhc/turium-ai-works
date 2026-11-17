import { envConfig } from "@/config";
import type { QueryBody, QueryStreamEvent } from "@/types";
import { type FastApiErrorBody, getApiErrorMessage } from "./api-error";

const FRAME_SEPARATOR = /\r?\n\r?\n/;

const parseFrame = (frame: string): QueryStreamEvent | null => {
	const data = frame
		.split(/\r?\n/)
		.filter((line) => line.startsWith("data:"))
		.map((line) => line.slice(5).trimStart())
		.join("\n");
	return data ? (JSON.parse(data) as QueryStreamEvent) : null;
};

const readErrorBody = async (response: Response) => {
	try {
		return (await response.json()) as FastApiErrorBody;
	} catch {
		return undefined;
	}
};

export async function* parseEventStream(
	stream: ReadableStream<Uint8Array>,
): AsyncGenerator<QueryStreamEvent> {
	const reader = stream.getReader();
	const decoder = new TextDecoder();
	let buffer = "";

	while (true) {
		const { done, value } = await reader.read();
		buffer += decoder.decode(value, { stream: !done });
		const frames = buffer.split(FRAME_SEPARATOR);
		buffer = done ? "" : (frames.pop() ?? "");

		for (const frame of frames) {
			const event = parseFrame(frame);
			if (event) yield event;
		}
		if (done) return;
	}
}

export async function* streamQuery(
	body: QueryBody,
	signal?: AbortSignal,
): AsyncGenerator<QueryStreamEvent> {
	const response = await fetch(`${envConfig.apiUrl}/query`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "text/event-stream",
		},
		body: JSON.stringify(body),
		signal,
	});

	if (!response.ok || !response.body) {
		throw new Error(getApiErrorMessage(await readErrorBody(response)));
	}

	yield* parseEventStream(response.body);
}

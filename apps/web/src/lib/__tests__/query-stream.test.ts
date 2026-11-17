import { afterEach, describe, expect, it, vi } from "vitest";
import { parseEventStream, streamQuery } from "../query-stream";

const streamOf = (chunks: string[]) => {
	const encoder = new TextEncoder();
	return new ReadableStream<Uint8Array>({
		start(controller) {
			for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
			controller.close();
		},
	});
};

const collect = async <T>(iterable: AsyncIterable<T>) => {
	const items: T[] = [];
	for await (const item of iterable) items.push(item);
	return items;
};

describe("parseEventStream", () => {
	it("parses events split across chunk boundaries", async () => {
		const events = await collect(
			parseEventStream(
				streamOf([
					'data: {"type":"status","sta',
					'ge":"searching"}\n',
					'\ndata: {"type":"token","text":"Hi"}\n\ndata: {"type":"tok',
					'en","text":" there"}\n\n',
				]),
			),
		);

		expect(events).toEqual([
			{ type: "status", stage: "searching" },
			{ type: "token", text: "Hi" },
			{ type: "token", text: " there" },
		]);
	});

	it("flushes a final event without a trailing blank line and handles CRLF", async () => {
		const events = await collect(
			parseEventStream(
				streamOf(['data: {"type":"sources","count":2}\r\n\r\n', 'data: {"type":"error","detail":"boom"}']),
			),
		);

		expect(events).toEqual([
			{ type: "sources", count: 2 },
			{ type: "error", detail: "boom" },
		]);
	});

	it("keeps multi-byte characters intact across chunks", async () => {
		const bytes = new TextEncoder().encode('data: {"type":"token","text":"é"}\n\n');
		const stream = new ReadableStream<Uint8Array>({
			start(controller) {
				controller.enqueue(bytes.slice(0, 31));
				controller.enqueue(bytes.slice(31));
				controller.close();
			},
		});

		expect(await collect(parseEventStream(stream))).toEqual([{ type: "token", text: "é" }]);
	});
});

describe("streamQuery", () => {
	afterEach(() => vi.unstubAllGlobals());

	it("throws the FastAPI detail on a non-2xx response", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(new Response(JSON.stringify({ detail: "Chat not found" }), { status: 404 })),
		);

		await expect(collect(streamQuery({ chat_id: "c1", question: "q" }))).rejects.toThrow("Chat not found");
	});

	it("uses the first validation message for 422 responses", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				new Response(JSON.stringify({ detail: [{ msg: "String should have at least 1 character" }] }), {
					status: 422,
				}),
			),
		);

		await expect(collect(streamQuery({ chat_id: "c1", question: "" }))).rejects.toThrow(
			"String should have at least 1 character",
		);
	});

	it("posts the body and yields parsed events", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(new Response(streamOf(['data: {"type":"token","text":"ok"}\n\n']), { status: 200 }));
		vi.stubGlobal("fetch", fetchMock);

		const events = await collect(streamQuery({ chat_id: "c1", question: "q" }));

		expect(events).toEqual([{ type: "token", text: "ok" }]);
		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:8000/query",
			expect.objectContaining({ method: "POST", body: JSON.stringify({ chat_id: "c1", question: "q" }) }),
		);
	});
});

"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { streamQuery } from "@/lib/query-stream";
import { CHAT_KEYS } from "@/queries";
import type { QueryStage, QueryStreamEvent } from "@/types";

export type AskQuestionState = {
	question: string | null;
	draft: string;
	stage: QueryStage | null;
	error: string | null;
	failedQuestion: string | null;
	isStreaming: boolean;
};

const IDLE_STATE: AskQuestionState = {
	question: null,
	draft: "",
	stage: null,
	error: null,
	failedQuestion: null,
	isStreaming: false,
};

const STREAM_ENDED_EARLY = "The answer stopped before it finished. Try again.";

const applyProgressEvent = (
	state: AskQuestionState,
	event: QueryStreamEvent,
): AskQuestionState => {
	if (event.type === "status") return { ...state, stage: event.stage };
	if (event.type === "token")
		return { ...state, draft: state.draft + event.text };
	return state;
};

const toErrorMessage = (error: unknown) =>
	error instanceof Error ? error.message : "Something went wrong";

/** Reads the stream to its end; resolves to an error message, or null once the answer is saved. */
const consumeStream = async (
	chatId: string,
	question: string,
	signal: AbortSignal,
	onProgress: (event: QueryStreamEvent) => void,
) => {
	for await (const event of streamQuery(
		{ chat_id: chatId, question },
		signal,
	)) {
		if (event.type === "done") return null;
		if (event.type === "error") return event.detail;
		onProgress(event);
	}
	return STREAM_ENDED_EARLY;
};

export function useAskQuestion(chatId: string | null) {
	const queryClient = useQueryClient();
	const controllerRef = useRef<AbortController | null>(null);
	const [state, setState] = useState<AskQuestionState>(IDLE_STATE);

	useEffect(() => () => controllerRef.current?.abort(), []);

	/** Resolves true when the answer was saved. A chat id can be passed for a
	 * chat created a moment ago, before this hook re-renders with it. */
	const ask = async (
		question: string,
		targetChatId: string | null = chatId,
	): Promise<boolean> => {
		if (!targetChatId) return false;
		controllerRef.current?.abort();
		const controller = new AbortController();
		controllerRef.current = controller;
		setState({ ...IDLE_STATE, question, isStreaming: true });

		const error = await consumeStream(
			targetChatId,
			question,
			controller.signal,
			(event) => setState((previous) => applyProgressEvent(previous, event)),
		).catch(toErrorMessage);
		if (controller.signal.aborted) return false;

		await queryClient.invalidateQueries({ queryKey: CHAT_KEYS.all });
		setState(
			error ? { ...IDLE_STATE, error, failedQuestion: question } : IDLE_STATE,
		);
		return !error;
	};

	const retry = () => {
		if (state.failedQuestion) ask(state.failedQuestion);
	};

	return { ...state, ask, retry };
}

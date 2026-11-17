"use client";

import AlertMessage from "@repo/ui/general/AlertMessage";
import { LoadingScreen } from "@repo/ui/general/LoadingScreen";
import { PageContainer } from "@repo/ui/general/PageContainer";
import { useState } from "react";
import { HeaderActions, useNewChatSelection } from "@/contexts";
import { useAskQuestion, useBreadcrumbLabel, useStartChat } from "@/hooks";
import { useChat, useKnowledgeBases } from "@/queries";
import { describeChatSource, pickKnowledgeBases } from "@/utils";
import { ChatComposer } from "./ChatComposer";
import { ChatMessages } from "./ChatMessages";
import { ChatScope } from "./ChatScope.view";

export function ChatWorkspace({ chatId }: { chatId: string | null }) {
	const [activeChatId, setActiveChatId] = useState(chatId);
	const { data: chat, isLoading, isError, error } = useChat(activeChatId);
	const { data: knowledgeBases } = useKnowledgeBases();
	const { selectedKnowledgeBaseIds } = useNewChatSelection();
	const { ask, retry, ...asking } = useAskQuestion(activeChatId);
	const { start, isStarting } = useStartChat(ask, setActiveChatId);
	useBreadcrumbLabel(activeChatId ?? "", chat?.title);

	if (isLoading) return <LoadingScreen />;

	if (isError) {
		return (
			<PageContainer>
				<AlertMessage variant="destructive" message={error.message} />
			</PageContainer>
		);
	}

	return (
		<div className="flex h-[calc(100svh-4rem)] flex-col group-has-data-[collapsible=icon]/sidebar-wrapper:h-[calc(100svh-3rem)]">
			<HeaderActions>
				<ChatScope
					mode={chat?.mode ?? "new"}
					knowledgeBases={
						chat?.knowledge_bases ??
						pickKnowledgeBases(knowledgeBases, selectedKnowledgeBaseIds)
					}
				/>
			</HeaderActions>
			<ChatMessages
				chatId={activeChatId}
				asking={asking}
				onRetry={retry}
				emptyDescription={describeChatSource(chat?.mode ?? "new")}
			/>
			<ChatComposer
				onAsk={(question) => (activeChatId ? ask(question) : start(question))}
				isStreaming={asking.isStreaming || isStarting}
			/>
		</div>
	);
}

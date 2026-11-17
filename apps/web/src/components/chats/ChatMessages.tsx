"use client";

import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@repo/ui/components/empty";
import {
	MessageScroller,
	MessageScrollerButton,
	MessageScrollerContent,
	MessageScrollerItem,
	MessageScrollerProvider,
	MessageScrollerViewport,
} from "@repo/ui/components/message-scroller";
import { Skeleton } from "@repo/ui/components/skeleton";
import AlertMessage from "@repo/ui/general/AlertMessage";
import { MessagesSquare } from "lucide-react";
import type { AskQuestionState } from "@/hooks";
import { useChatMessages } from "@/queries";
import { AskError } from "./AskError.view";
import { AssistantMessage } from "./AssistantMessage";
import { StreamingAnswer } from "./StreamingAnswer.view";
import { UserMessage } from "./UserMessage.view";

type ChatMessagesProps = {
	chatId: string | null;
	asking: AskQuestionState;
	onRetry: () => void;
	emptyDescription: string;
};

export function ChatMessages({
	chatId,
	asking,
	onRetry,
	emptyDescription,
}: ChatMessagesProps) {
	const { data: messages, isLoading, isError, error } = useChatMessages(chatId);

	if (isLoading) {
		return (
			<div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4">
				<Skeleton className="ml-auto h-10 w-1/2" />
				<Skeleton className="h-24 w-full" />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="mx-auto w-full max-w-3xl flex-1 p-4">
				<AlertMessage variant="destructive" message={error.message} />
			</div>
		);
	}

	if (!messages?.length && !asking.question && !asking.error) {
		return (
			<Empty className="flex-1">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<MessagesSquare />
					</EmptyMedia>
					<EmptyTitle>Ask your first question</EmptyTitle>
					<EmptyDescription>{emptyDescription}</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	return (
		<MessageScrollerProvider autoScroll defaultScrollPosition="end">
			<MessageScroller className="flex-1">
				<MessageScrollerViewport>
					<MessageScrollerContent className="mx-auto w-full max-w-3xl p-4">
						{messages?.map((message) => (
							<MessageScrollerItem key={message.id} messageId={message.id}>
								{message.role === "user" ? (
									<UserMessage content={message.content} />
								) : (
									<AssistantMessage message={message} />
								)}
							</MessageScrollerItem>
						))}
						{asking.question && (
							<MessageScrollerItem messageId="pending" scrollAnchor>
								<div className="flex flex-col gap-6">
									<UserMessage content={asking.question} />
									<StreamingAnswer stage={asking.stage} draft={asking.draft} />
								</div>
							</MessageScrollerItem>
						)}
						{asking.error && (
							<MessageScrollerItem messageId="error">
								<AskError message={asking.error} onRetry={onRetry} />
							</MessageScrollerItem>
						)}
					</MessageScrollerContent>
				</MessageScrollerViewport>
				<MessageScrollerButton />
			</MessageScroller>
		</MessageScrollerProvider>
	);
}

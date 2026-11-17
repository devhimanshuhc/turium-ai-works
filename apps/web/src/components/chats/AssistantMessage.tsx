"use client";

import { Message, MessageContent } from "@repo/ui/components/message";
import { useState } from "react";
import type { Message as ChatMessage } from "@/types";
import { AnswerContent } from "./AnswerContent.view";
import { GroundingBadge } from "./GroundingBadge.view";
import { SourcesButton } from "./sources/SourcesButton.view";
import { SourcesSheet } from "./sources/SourcesSheet";

export function AssistantMessage({ message }: { message: ChatMessage }) {
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [focusedNumber, setFocusedNumber] = useState<number | null>(null);
	const citations = message.citations ?? [];

	const openSources = (number: number | null) => {
		setFocusedNumber(number);
		setIsSheetOpen(true);
	};

	return (
		<Message>
			<MessageContent className="gap-3">
				<AnswerContent
					content={message.content}
					messageId={message.id}
					onCitationClick={openSources}
				/>
				<div className="flex flex-wrap items-center gap-2">
					<GroundingBadge grounding={message.grounding} />
					{citations.length > 0 && (
						<SourcesButton
							citations={citations}
							onClick={() => openSources(null)}
						/>
					)}
				</div>
				{citations.length > 0 && (
					<SourcesSheet
						messageId={message.id}
						citations={citations}
						focusedNumber={focusedNumber}
						isOpen={isSheetOpen}
						onOpenChange={setIsSheetOpen}
					/>
				)}
			</MessageContent>
		</Message>
	);
}

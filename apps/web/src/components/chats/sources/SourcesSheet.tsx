"use client";

import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@repo/ui/components/sheet";
import { useEffect } from "react";
import type { Citation } from "@/types";
import { getCitationAnchorId, splitCitations } from "@/utils";
import { SourceCard } from "./SourceCard.view";

type SourcesSheetProps = {
	messageId: string;
	citations: Citation[];
	focusedNumber: number | null;
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
};

export function SourcesSheet({
	messageId,
	citations,
	focusedNumber,
	isOpen,
	onOpenChange,
}: SourcesSheetProps) {
	const { cited, others } = splitCitations(citations);

	useEffect(() => {
		if (!isOpen || focusedNumber === null) return;
		const frame = requestAnimationFrame(() =>
			document
				.getElementById(getCitationAnchorId(messageId, focusedNumber))
				?.scrollIntoView({ block: "start", behavior: "smooth" }),
		);
		return () => cancelAnimationFrame(frame);
	}, [isOpen, focusedNumber, messageId]);

	const renderCards = (list: Citation[]) =>
		list.map((citation) => (
			<SourceCard
				key={citation.number}
				messageId={messageId}
				citation={citation}
				isFocused={citation.number === focusedNumber}
			/>
		));

	return (
		<Sheet open={isOpen} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="w-full data-[side=right]:sm:max-w-xl"
			>
				<SheetHeader>
					<SheetTitle>Sources</SheetTitle>
					<SheetDescription>
						The sections this answer was written from. The highlighted part
						matched your question.
					</SheetDescription>
				</SheetHeader>
				<div className="flex flex-col gap-6 overflow-y-auto px-4 pb-6">
					{cited.length > 0 && (
						<section className="flex flex-col gap-3">
							<h3 className="text-xs font-medium">
								Cited in the answer ({cited.length})
							</h3>
							<ul className="flex flex-col gap-3">{renderCards(cited)}</ul>
						</section>
					)}
					{others.length > 0 && (
						<section className="flex flex-col gap-3">
							<h3 className="text-muted-foreground text-xs font-medium">
								Also retrieved ({others.length})
							</h3>
							<ul className="flex flex-col gap-3">{renderCards(others)}</ul>
						</section>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}

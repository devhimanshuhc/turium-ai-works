"use client";

import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@repo/ui/components/empty";
import { Skeleton } from "@repo/ui/components/skeleton";
import AlertMessage from "@repo/ui/general/AlertMessage";
import { Inbox } from "lucide-react";
import { useItems } from "@/queries";
import { DeleteItemButton } from "./DeleteItemButton";
import { ItemRow } from "./ItemRow.view";
import { ItemSections } from "./ItemSections";

export function ItemsList({ knowledgeBaseId }: { knowledgeBaseId: string }) {
	const { data: items, isLoading, isError, error } = useItems(knowledgeBaseId);

	if (isLoading) {
		return (
			<div className="divide-y rounded-lg border">
				{["first", "second", "third"].map((key) => (
					<div key={key} className="flex items-center gap-3 px-4 py-3">
						<Skeleton className="size-8 rounded-md" />
						<div className="flex-1 space-y-1.5">
							<Skeleton className="h-4 w-1/2" />
							<Skeleton className="h-3 w-1/4" />
						</div>
					</div>
				))}
			</div>
		);
	}

	if (isError)
		return <AlertMessage variant="destructive" message={error.message} />;

	if (!items?.length) {
		return (
			<Empty className="rounded-lg border border-dashed">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<Inbox />
					</EmptyMedia>
					<EmptyTitle>No content yet</EmptyTitle>
					<EmptyDescription>
						Add text, a link or a file to start asking questions about it.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	return (
		<div className="divide-y overflow-hidden rounded-lg border">
			{items.map((item) => (
				<ItemRow
					key={item.id}
					item={item}
					actions={<DeleteItemButton item={item} />}
					details={<ItemSections itemId={item.id} />}
				/>
			))}
		</div>
	);
}

"use client";

import { formatCount } from "@repo/shared";
import { Skeleton } from "@repo/ui/components/skeleton";
import AlertMessage from "@repo/ui/general/AlertMessage";
import { useItemSections } from "@/queries";
import { SectionRow } from "./SectionRow.view";

export function ItemSections({ itemId }: { itemId: string }) {
	const { data: sections, isLoading, isError, error } = useItemSections(itemId);

	if (isLoading) {
		return (
			<div className="space-y-2">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
			</div>
		);
	}

	if (isError)
		return <AlertMessage variant="destructive" message={error.message} />;

	if (!sections?.length) {
		return (
			<p className="text-muted-foreground text-sm">
				No text could be extracted from this source.
			</p>
		);
	}

	const chunkCount = sections.reduce(
		(total, section) => total + section.chunks.length,
		0,
	);

	return (
		<div className="space-y-3">
			<p className="text-muted-foreground text-xs tabular-nums">
				{formatCount(sections.length, "section")} ·{" "}
				{formatCount(chunkCount, "searchable chunk")}
			</p>
			<div className="space-y-2">
				{sections.map((section) => (
					<SectionRow key={section.id} section={section} />
				))}
			</div>
		</div>
	);
}

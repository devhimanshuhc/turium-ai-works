import { formatCount } from "@repo/shared";
import { format } from "date-fns";
import type { ReactNode } from "react";
import type { KnowledgeBase } from "@/types";

export function KnowledgeBaseHeader({
	knowledgeBase,
	actions,
}: {
	knowledgeBase: KnowledgeBase;
	actions?: ReactNode;
}) {
	return (
		<header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
			<div className="min-w-0 space-y-1.5">
				<h1 className="truncate text-2xl font-semibold tracking-tight">
					{knowledgeBase.name}
				</h1>
				{knowledgeBase.description && (
					<p className="text-muted-foreground text-sm">
						{knowledgeBase.description}
					</p>
				)}
				<p className="text-muted-foreground text-xs tabular-nums">
					{formatCount(knowledgeBase.item_count, "source")} · Created{" "}
					{format(new Date(knowledgeBase.created_at), "d MMM yyyy")}
				</p>
			</div>
			<div className="flex shrink-0 items-center gap-2">{actions}</div>
		</header>
	);
}

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@repo/ui/components/collapsible";
import { formatDistanceToNow } from "date-fns";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { SOURCE_TYPE_ICONS, SOURCE_TYPE_LABELS } from "@/constants";
import type { Item } from "@/types";
import { getItemDisplayTitle, getUrlHost } from "@/utils";
import { ItemStatusBadge } from "./ItemStatusBadge.view";

export function ItemRow({
	item,
	actions,
	details,
}: {
	item: Item;
	actions?: ReactNode;
	details: ReactNode;
}) {
	const Icon = SOURCE_TYPE_ICONS[item.source_type];
	const isReady = item.status === "ready";
	const meta = [
		SOURCE_TYPE_LABELS[item.source_type],
		item.url && getUrlHost(item.url),
		`Added ${formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}`,
	]
		.filter(Boolean)
		.join(" · ");

	return (
		<Collapsible>
			<div className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-muted/40 sm:px-4">
				<CollapsibleTrigger
					disabled={!isReady}
					className="group flex min-w-0 flex-1 items-center gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default"
				>
					<ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-disabled:opacity-0 group-data-[panel-open]:rotate-90" />
					<span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted/50 text-muted-foreground">
						<Icon className="size-4" />
					</span>
					<span className="min-w-0 flex-1">
						<span className="block truncate text-sm font-medium">
							{getItemDisplayTitle(item)}
						</span>
						<span className="block truncate text-muted-foreground text-xs">
							{item.status === "failed" && item.error ? (
								<span className="text-destructive">{item.error}</span>
							) : (
								meta
							)}
						</span>
					</span>
				</CollapsibleTrigger>
				<ItemStatusBadge status={item.status} />
				{actions}
			</div>
			<CollapsibleContent className="border-t bg-muted/20 px-3 py-4 sm:px-4 sm:pl-[4.75rem]">
				{details}
			</CollapsibleContent>
		</Collapsible>
	);
}

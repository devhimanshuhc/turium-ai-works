import { formatCount } from "@repo/shared";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@repo/ui/components/collapsible";
import { ChevronRight } from "lucide-react";
import type { ItemSection } from "@/types";
import { ChunkBlock } from "./ChunkBlock.view";

export function SectionRow({ section }: { section: ItemSection }) {
	return (
		<Collapsible className="rounded-md border bg-background">
			<CollapsibleTrigger className="group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring">
				<ChevronRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-data-[panel-open]:rotate-90" />
				<span className="w-16 shrink-0 text-muted-foreground text-xs tabular-nums">
					Section {section.position + 1}
				</span>
				<span className="min-w-0 flex-1 truncate text-sm">
					{section.content}
				</span>
				<span className="shrink-0 text-muted-foreground text-xs tabular-nums">
					{formatCount(section.chunks.length, "chunk")}
				</span>
			</CollapsibleTrigger>
			<CollapsibleContent className="space-y-2 border-t p-3">
				{section.chunks.map((chunk, index) => (
					<ChunkBlock key={chunk.id} chunk={chunk} number={index + 1} />
				))}
			</CollapsibleContent>
		</Collapsible>
	);
}

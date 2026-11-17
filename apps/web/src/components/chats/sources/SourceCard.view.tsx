import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@repo/ui/components/collapsible";
import { ChevronDown, ExternalLink } from "lucide-react";
import { SOURCE_TYPE_ICONS, SOURCE_TYPE_LABELS } from "@/constants";
import type { Citation } from "@/types";
import {
	getCitationAnchorId,
	getUrlHost,
	highlightMatchedChunk,
} from "@/utils";

type SourceCardProps = {
	messageId: string;
	citation: Citation;
	isFocused: boolean;
};

export function SourceCard({
	messageId,
	citation,
	isFocused,
}: SourceCardProps) {
	const Icon = SOURCE_TYPE_ICONS[citation.source_type];
	const meta = citation.url
		? getUrlHost(citation.url)
		: SOURCE_TYPE_LABELS[citation.source_type];

	return (
		<li
			id={getCitationAnchorId(messageId, citation.number)}
			className="scroll-mt-4"
		>
			<Collapsible
				defaultOpen={isFocused}
				className={`group/source overflow-hidden rounded-lg border transition-colors ${isFocused ? "border-primary/60" : ""}`}
			>
				<div className="flex items-center gap-3 px-3 py-2.5">
					<span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary font-semibold text-primary-foreground text-xs tabular-nums">
						{citation.number}
					</span>
					<CollapsibleTrigger className="group flex min-w-0 flex-1 items-center gap-2 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring">
						<span className="min-w-0 flex-1">
							<span className="block truncate font-medium text-sm">
								{citation.title}
							</span>
							<span className="flex items-center gap-1 text-muted-foreground text-xs">
								<Icon className="size-3 shrink-0" />
								<span className="truncate">{meta}</span>
							</span>
						</span>
						<ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[panel-open]:rotate-180" />
					</CollapsibleTrigger>
					{citation.url && (
						<a
							href={citation.url}
							target="_blank"
							rel="noopener noreferrer"
							aria-label={`Open ${citation.title}`}
							className="rounded-sm p-1 text-muted-foreground hover:text-foreground"
						>
							<ExternalLink className="size-3.5" />
						</a>
					)}
				</div>
				<CollapsibleContent className="space-y-3 border-t bg-muted/20 px-3 py-3 text-sm leading-relaxed">
					{highlightMatchedChunk(citation).map((part, index) =>
						part.isMatch ? (
							<div
								key={index}
								className="whitespace-pre-line rounded-r-md border-primary border-l-2 bg-primary/10 py-2 pr-2 pl-3 text-foreground"
							>
								{part.text}
							</div>
						) : (
							<p
								key={index}
								className="whitespace-pre-line text-muted-foreground"
							>
								{part.text}
							</p>
						),
					)}
				</CollapsibleContent>
				<p className="mx-3 mb-3 line-clamp-2 text-muted-foreground text-xs leading-relaxed group-data-[open]/source:hidden">
					{citation.snippet}
				</p>
			</Collapsible>
		</li>
	);
}

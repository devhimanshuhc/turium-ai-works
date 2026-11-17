import { Badge } from "@repo/ui/components/badge";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@repo/ui/components/collapsible";
import { ChevronDown } from "lucide-react";
import { GROUNDING_BADGES } from "@/constants";
import type { Grounding } from "@/types";

export function GroundingBadge({ grounding }: { grounding: Grounding | null }) {
	const badge = grounding && GROUNDING_BADGES[grounding.verdict];
	if (!grounding || !badge) return null;

	const claims = grounding.unsupported_claims;

	return (
		<Collapsible className="flex flex-col gap-2">
			<div className="flex items-center gap-2">
				<Badge
					variant="outline"
					title={grounding.explanation}
					className={badge.className}
				>
					<badge.icon />
					{badge.label}
				</Badge>
				{claims.length > 0 && (
					<CollapsibleTrigger className="text-muted-foreground hover:text-foreground group flex items-center gap-1 text-xs">
						{claims.length} unsupported{" "}
						{claims.length === 1 ? "claim" : "claims"}
						<ChevronDown className="size-3 transition-transform group-data-panel-open:rotate-180" />
					</CollapsibleTrigger>
				)}
			</div>
			{claims.length > 0 && (
				<CollapsibleContent>
					<ul className="text-muted-foreground ml-4 list-disc space-y-1 text-xs">
						{claims.map((claim) => (
							<li key={claim}>{claim}</li>
						))}
					</ul>
				</CollapsibleContent>
			)}
		</Collapsible>
	);
}

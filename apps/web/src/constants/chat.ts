import {
	Globe,
	type LucideIcon,
	ShieldAlert,
	ShieldCheck,
	ShieldQuestionMark,
	ShieldX,
} from "lucide-react";
import type { GroundingVerdict, QueryStage } from "@/types";

export const QUERY_STAGE_LABELS: Record<QueryStage, string> = {
	planning: "Rewriting question…",
	searching: "Searching your knowledge bases…",
	answering: "Writing answer…",
	verifying: "Checking answer against sources…",
};

export const GROUNDING_BADGES: Partial<
	Record<
		GroundingVerdict,
		{ label: string; className: string; icon: LucideIcon }
	>
> = {
	grounded: {
		label: "Verified against sources",
		icon: ShieldCheck,
		className:
			"border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400",
	},
	partially_grounded: {
		label: "Partially supported",
		icon: ShieldAlert,
		className:
			"border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
	},
	ungrounded: {
		label: "Not supported by sources",
		icon: ShieldX,
		className: "border-destructive/20 bg-destructive/10 text-destructive",
	},
	general_knowledge: {
		label: "General knowledge — not from your knowledge bases",
		icon: Globe,
		className:
			"border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
	},
	unverified: {
		label: "Not verified",
		icon: ShieldQuestionMark,
		className: "border-border bg-muted text-muted-foreground",
	},
};

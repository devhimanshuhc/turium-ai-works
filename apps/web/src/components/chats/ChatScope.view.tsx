import { Badge } from "@repo/ui/components/badge";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@repo/ui/components/tooltip";
import { Globe, Library, Lock } from "lucide-react";
import type { ChatMode, KnowledgeBaseSummary } from "@/types";

type ChatScopeProps = {
	mode: ChatMode | "new";
	knowledgeBases: KnowledgeBaseSummary[];
};

/** What a chat answers from, shown in the top bar: its knowledge bases or general knowledge. */
export function ChatScope({ mode, knowledgeBases }: ChatScopeProps) {
	const isGeneral =
		mode === "general" || (mode === "new" && !knowledgeBases.length);
	const isOrphaned = mode === "knowledge_base" && !knowledgeBases.length;

	return (
		<div className="flex min-w-0 items-center gap-1.5">
			{mode !== "new" && (
				<Tooltip>
					<TooltipTrigger
						className="text-muted-foreground"
						aria-label="Fixed for this chat"
					>
						<Lock className="size-3.5" />
					</TooltipTrigger>
					<TooltipContent>Fixed for this chat</TooltipContent>
				</Tooltip>
			)}
			{isGeneral && (
				<Badge variant="secondary">
					<Globe />
					General knowledge
				</Badge>
			)}
			{isOrphaned && (
				<span className="text-muted-foreground truncate text-xs">
					Knowledge bases deleted — new questions won't find anything
				</span>
			)}
			{knowledgeBases.map((knowledgeBase) => (
				<Badge key={knowledgeBase.id} variant="secondary" className="max-w-40">
					<Library />
					<span className="truncate">{knowledgeBase.name}</span>
				</Badge>
			))}
		</div>
	);
}

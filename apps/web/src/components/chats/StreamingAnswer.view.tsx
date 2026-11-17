import { Message, MessageContent } from "@repo/ui/components/message";
import { Spinner } from "@repo/ui/components/spinner";
import { QUERY_STAGE_LABELS } from "@/constants";
import type { QueryStage } from "@/types";
import { AnswerContent } from "./AnswerContent.view";

type StreamingAnswerProps = {
	stage: QueryStage | null;
	draft: string;
};

export function StreamingAnswer({ stage, draft }: StreamingAnswerProps) {
	return (
		<Message>
			<MessageContent className="gap-3">
				{draft && <AnswerContent content={draft} messageId="draft" />}
				<p
					className="text-muted-foreground flex items-center gap-2 text-xs"
					aria-live="polite"
				>
					<Spinner className="size-3" aria-hidden />
					{stage ? QUERY_STAGE_LABELS[stage] : "Starting…"}
				</p>
			</MessageContent>
		</Message>
	);
}

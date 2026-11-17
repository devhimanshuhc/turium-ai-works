import { Bubble, BubbleContent } from "@repo/ui/components/bubble";
import { Message, MessageContent } from "@repo/ui/components/message";

export function UserMessage({ content }: { content: string }) {
	return (
		<Message align="end">
			<MessageContent>
				<Bubble variant="secondary" align="end">
					<BubbleContent className="whitespace-pre-wrap">
						{content}
					</BubbleContent>
				</Bubble>
			</MessageContent>
		</Message>
	);
}

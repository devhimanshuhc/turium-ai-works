import MarkdownContent from "@repo/ui/general/MarkdownContent";
import { linkCitationMarkers } from "@/utils";

const CITATION_LINK_STYLES =
	"[&_a[href^='#source-']]:mx-px [&_a[href^='#source-']]:inline-flex [&_a[href^='#source-']]:h-4 [&_a[href^='#source-']]:min-w-4 [&_a[href^='#source-']]:items-center [&_a[href^='#source-']]:justify-center [&_a[href^='#source-']]:rounded [&_a[href^='#source-']]:bg-muted [&_a[href^='#source-']]:px-1 [&_a[href^='#source-']]:align-super [&_a[href^='#source-']]:text-[10px] [&_a[href^='#source-']]:font-medium [&_a[href^='#source-']]:text-foreground [&_a[href^='#source-']]:no-underline [&_a[href^='#source-']:hover]:bg-primary [&_a[href^='#source-']:hover]:text-primary-foreground";

type AnswerContentProps = {
	content: string;
	messageId: string;
	onCitationClick?: (number: number) => void;
};

const citationNumberFrom = (target: EventTarget) => {
	const href = (target as Element)
		.closest?.("a[href^='#source-']")
		?.getAttribute("href");
	return href ? Number(href.split("-").at(-1)) : null;
};

export function AnswerContent({
	content,
	messageId,
	onCitationClick,
}: AnswerContentProps) {
	return (
		<div
			onClick={(event) => {
				const number = citationNumberFrom(event.target);
				if (number === null || !onCitationClick) return;
				event.preventDefault();
				onCitationClick(number);
			}}
		>
			<MarkdownContent
				content={linkCitationMarkers(content, messageId)}
				allowHtml={false}
				className={`text-sm ${CITATION_LINK_STYLES}`}
			/>
		</div>
	);
}

import { BookOpen } from "lucide-react";
import { SOURCE_TYPE_ICONS } from "@/constants";
import type { Citation } from "@/types";

const PREVIEW_COUNT = 3;

export function SourcesButton({
	citations,
	onClick,
}: {
	citations: Citation[];
	onClick: () => void;
}) {
	const preview = citations.slice(0, PREVIEW_COUNT);

	return (
		<button
			type="button"
			onClick={onClick}
			className="hover:bg-muted flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors"
		>
			<BookOpen className="size-3.5" />
			<span className="font-medium">
				{citations.length} {citations.length === 1 ? "source" : "sources"}
			</span>
			<span className="flex -space-x-1">
				{preview.map((citation) => {
					const Icon = SOURCE_TYPE_ICONS[citation.source_type];
					return (
						<span
							key={citation.number}
							className="bg-muted border-background flex size-5 items-center justify-center rounded-full border"
						>
							<Icon className="size-3" />
						</span>
					);
				})}
			</span>
		</button>
	);
}

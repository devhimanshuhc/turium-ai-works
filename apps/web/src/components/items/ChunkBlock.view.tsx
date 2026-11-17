import type { ItemChunk } from "@/types";

export function ChunkBlock({
	chunk,
	number,
}: {
	chunk: ItemChunk;
	number: number;
}) {
	return (
		<div className="space-y-2 rounded-md bg-muted/40 p-3">
			<div className="flex items-center justify-between text-muted-foreground text-xs tabular-nums">
				<span>Chunk {number}</span>
				<span>{chunk.content.length.toLocaleString()} chars</span>
			</div>
			{chunk.context && (
				<p className="border-primary/60 border-l-2 pl-2 text-muted-foreground text-xs italic">
					{chunk.context}
				</p>
			)}
			<p className="whitespace-pre-wrap text-sm leading-relaxed">
				{chunk.content}
			</p>
		</div>
	);
}

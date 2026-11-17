import { Badge } from "@repo/ui/components/badge";
import { Spinner } from "@repo/ui/components/spinner";
import type { ItemStatus } from "@/types";

export function ItemStatusBadge({ status }: { status: ItemStatus }) {
	if (status === "pending") {
		return (
			<Badge variant="outline" className="text-muted-foreground">
				<Spinner className="size-3" aria-label="Processing" />
				Processing
			</Badge>
		);
	}

	if (status === "failed") {
		return (
			<Badge
				variant="outline"
				className="border-destructive/20 bg-destructive/10 text-destructive"
			>
				Failed
			</Badge>
		);
	}

	return (
		<Badge
			variant="outline"
			className="border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400"
		>
			Ready
		</Badge>
	);
}

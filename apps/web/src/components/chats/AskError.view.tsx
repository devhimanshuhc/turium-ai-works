import { Button } from "@repo/ui/components/button";
import AlertMessage from "@repo/ui/general/AlertMessage";
import { RotateCcw } from "lucide-react";

type AskErrorProps = {
	message: string;
	onRetry: () => void;
};

export function AskError({ message, onRetry }: AskErrorProps) {
	return (
		<div className="flex flex-col items-start gap-2">
			<AlertMessage variant="destructive" message={message} />
			<Button variant="outline" size="sm" onClick={onRetry}>
				<RotateCcw />
				Retry
			</Button>
		</div>
	);
}

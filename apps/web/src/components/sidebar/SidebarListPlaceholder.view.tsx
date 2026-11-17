import { SidebarMenuSkeleton } from "@repo/ui/components/sidebar";
import { cn } from "@repo/ui/lib/utils";

type SidebarListPlaceholderProps = {
	isLoading: boolean;
	message?: string;
	isError?: boolean;
};

export function SidebarListPlaceholder({
	isLoading,
	message,
	isError = false,
}: SidebarListPlaceholderProps) {
	if (isLoading) {
		return (
			<>
				<SidebarMenuSkeleton width="80%" />
				<SidebarMenuSkeleton width="60%" />
				<SidebarMenuSkeleton width="70%" />
			</>
		);
	}

	return (
		<p
			className={cn(
				"px-2 py-1 text-xs group-data-[collapsible=icon]:hidden",
				isError ? "text-destructive" : "text-muted-foreground",
			)}
		>
			{message}
		</p>
	);
}

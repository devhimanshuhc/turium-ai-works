import { SidebarProvider } from "@repo/ui/components/sidebar";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import SidebarInset from "@/components/sidebar/SidebarInset";
import { HeaderActionsProvider, NewChatSelectionProvider } from "@/contexts";

export default function AppLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<NewChatSelectionProvider>
			<HeaderActionsProvider>
				<SidebarProvider>
					<AppSidebar />
					<SidebarInset>{children}</SidebarInset>
				</SidebarProvider>
			</HeaderActionsProvider>
		</NewChatSelectionProvider>
	);
}

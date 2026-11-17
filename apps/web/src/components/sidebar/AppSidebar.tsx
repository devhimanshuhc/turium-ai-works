"use client";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@repo/ui/components/sidebar";
import { BookOpen, GalleryVerticalEnd } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME } from "@/constants";
import { ChatsNav } from "./ChatsNav";
import { KnowledgeBasesNav } from "./KnowledgeBasesNav";
import SidebarFooter from "./SidebarFooter";

export function AppSidebar() {
	const pathname = usePathname();

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" render={<Link href="/" />}>
							<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
								<GalleryVerticalEnd className="size-4" />
							</div>
							<span className="font-medium">{APP_NAME}</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<ChatsNav />
				<KnowledgeBasesNav />
				<SidebarGroup className="mt-auto">
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton
								tooltip="Documentation"
								isActive={pathname.startsWith("/docs")}
								render={<Link href="/docs" />}
							>
								<BookOpen />
								<span>Documentation</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter />
			<SidebarRail />
		</Sidebar>
	);
}

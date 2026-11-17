"use client";

import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@repo/ui/components/sidebar";
import { MessageSquare, SquarePen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NEW_CHAT_PATH } from "@/hooks";
import { useChats } from "@/queries";
import { SidebarListPlaceholder } from "./SidebarListPlaceholder.view";

export function ChatsNav() {
	const pathname = usePathname();
	const { data: chats, isLoading, isError } = useChats();
	const showPlaceholder = isLoading || isError || !chats?.length;

	return (
		<SidebarGroup>
			<SidebarGroupLabel>Chats</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					<SidebarMenuItem data-tour="new-chat">
						<SidebarMenuButton
							isActive={pathname === NEW_CHAT_PATH}
							render={<Link href={NEW_CHAT_PATH} />}
						>
							<SquarePen />
							<span>New chat</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
					{showPlaceholder ? (
						<SidebarListPlaceholder
							isLoading={isLoading}
							isError={isError}
							message={isError ? "Couldn't load chats" : "No chats yet"}
						/>
					) : (
						chats?.map((chat) => (
							<SidebarMenuItem key={chat.id}>
								<SidebarMenuButton
									tooltip={chat.title}
									isActive={pathname === `/chats/${chat.id}`}
									render={<Link href={`/chats/${chat.id}`} />}
								>
									<MessageSquare />
									<span>{chat.title}</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
						))
					)}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}

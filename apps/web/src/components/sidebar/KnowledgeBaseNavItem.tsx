import {
	SidebarMenuAction,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@repo/ui/components/sidebar";
import { ArrowUpRight, Library, Lock, Square, SquareCheck } from "lucide-react";
import Link from "next/link";
import type { KnowledgeBase } from "@/types";

type KnowledgeBaseNavItemProps = {
	knowledgeBase: KnowledgeBase;
	mode: "select" | "view";
	isAttached: boolean;
	isActive: boolean;
	onToggle: () => void;
};

export function KnowledgeBaseNavItem({
	knowledgeBase,
	mode,
	isAttached,
	isActive,
	onToggle,
}: KnowledgeBaseNavItemProps) {
	const href = `/knowledge-bases/${knowledgeBase.id}`;

	if (mode === "select") {
		return (
			<SidebarMenuItem>
				<SidebarMenuButton
					aria-pressed={isAttached}
					isActive={isAttached}
					tooltip={`Use ${knowledgeBase.name} in this chat`}
					onClick={onToggle}
				>
					{isAttached ? <SquareCheck /> : <Square />}
					<span>{knowledgeBase.name}</span>
				</SidebarMenuButton>
				<SidebarMenuAction
					showOnHover
					aria-label={`Open ${knowledgeBase.name}`}
					render={<Link href={href} />}
				>
					<ArrowUpRight />
				</SidebarMenuAction>
			</SidebarMenuItem>
		);
	}

	return (
		<SidebarMenuItem>
			<SidebarMenuButton
				tooltip={knowledgeBase.name}
				isActive={isActive}
				render={<Link href={href} />}
			>
				<Library />
				<span>{knowledgeBase.name}</span>
			</SidebarMenuButton>
			<SidebarMenuBadge
				title={isAttached ? "Used by this chat (locked)" : undefined}
			>
				{isAttached ? <Lock className="size-3" /> : knowledgeBase.item_count}
			</SidebarMenuBadge>
		</SidebarMenuItem>
	);
}

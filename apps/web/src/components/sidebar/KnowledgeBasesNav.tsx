"use client";

import {
	SidebarGroup,
	SidebarGroupAction,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
} from "@repo/ui/components/sidebar";
import { Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import { CreateKnowledgeBaseDialog } from "@/components/knowledge-bases/CreateKnowledgeBaseDialog";
import { useKnowledgeBaseNavMode } from "@/hooks";
import { useKnowledgeBases } from "@/queries";
import { KnowledgeBaseNavItem } from "./KnowledgeBaseNavItem";
import { SidebarListPlaceholder } from "./SidebarListPlaceholder.view";

export function KnowledgeBasesNav() {
	const pathname = usePathname();
	const { data: knowledgeBases, isLoading, isError } = useKnowledgeBases();
	const { mode, attachedIds, toggle } = useKnowledgeBaseNavMode();
	const showPlaceholder = isLoading || isError || !knowledgeBases?.length;

	return (
		<SidebarGroup data-tour="knowledge-bases">
			<SidebarGroupLabel>Knowledge bases</SidebarGroupLabel>
			<CreateKnowledgeBaseDialog
				trigger={
					<SidebarGroupAction
						title="New knowledge base"
						data-tour="create-knowledge-base"
					>
						<Plus />
						<span className="sr-only">New knowledge base</span>
					</SidebarGroupAction>
				}
			/>
			<SidebarGroupContent>
				<SidebarMenu>
					{showPlaceholder ? (
						<SidebarListPlaceholder
							isLoading={isLoading}
							isError={isError}
							message={
								isError
									? "Couldn't load knowledge bases"
									: "Create one to start adding content"
							}
						/>
					) : (
						knowledgeBases?.map((knowledgeBase) => (
							<KnowledgeBaseNavItem
								key={knowledgeBase.id}
								knowledgeBase={knowledgeBase}
								mode={mode}
								isAttached={attachedIds.includes(knowledgeBase.id)}
								isActive={pathname === `/knowledge-bases/${knowledgeBase.id}`}
								onToggle={() => toggle(knowledgeBase.id)}
							/>
						))
					)}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}

"use client";

import { Button } from "@repo/ui/components/button";
import { CustomAlertDialog } from "@repo/ui/general/CustomAlertDialog";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useChats, useDeleteKnowledgeBase } from "@/queries";
import type { KnowledgeBase } from "@/types";
import {
	countChatsUsingKnowledgeBase,
	describeKnowledgeBaseDeletion,
} from "@/utils";

export function DeleteKnowledgeBaseButton({
	knowledgeBase,
}: {
	knowledgeBase: KnowledgeBase;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const router = useRouter();
	const { data: chats } = useChats();
	const deleteKnowledgeBase = useDeleteKnowledgeBase();
	const chatCount = countChatsUsingKnowledgeBase(chats, knowledgeBase.id);

	const close = () => {
		setIsOpen(false);
		deleteKnowledgeBase.reset();
	};

	const confirm = () =>
		deleteKnowledgeBase.mutate(knowledgeBase.id, {
			onSuccess: () => {
				toast.success(`Deleted "${knowledgeBase.name}"`);
				router.replace("/chats/new");
			},
		});

	return (
		<>
			<Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
				<Trash2 />
				Delete
			</Button>
			<CustomAlertDialog
				isOpen={isOpen}
				onClose={close}
				onConfirm={confirm}
				isLoading={deleteKnowledgeBase.isPending}
				title="Delete this knowledge base?"
				description={describeKnowledgeBaseDeletion(
					knowledgeBase.name,
					chatCount,
				)}
				cancelText="Cancel"
				confirmText="Delete"
				error={deleteKnowledgeBase.error?.message}
			/>
		</>
	);
}

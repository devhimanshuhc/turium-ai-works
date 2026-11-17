"use client";

import { Button } from "@repo/ui/components/button";
import { CustomAlertDialog } from "@repo/ui/general/CustomAlertDialog";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useDeleteItem } from "@/queries";
import type { Item } from "@/types";
import { getItemDisplayTitle } from "@/utils";

export function DeleteItemButton({ item }: { item: Item }) {
	const [isOpen, setIsOpen] = useState(false);
	const deleteItem = useDeleteItem();
	const title = getItemDisplayTitle(item);

	const close = () => {
		setIsOpen(false);
		deleteItem.reset();
	};

	const confirm = () =>
		deleteItem.mutate(item, {
			onSuccess: () => {
				toast.success("Removed from the knowledge base");
				setIsOpen(false);
			},
		});

	return (
		<>
			<Button
				variant="ghost"
				size="icon-sm"
				aria-label={`Delete ${title}`}
				onClick={() => setIsOpen(true)}
			>
				<Trash2 />
			</Button>
			<CustomAlertDialog
				isOpen={isOpen}
				onClose={close}
				onConfirm={confirm}
				isLoading={deleteItem.isPending}
				title="Remove this item?"
				description={`"${title}" and its indexed chunks will be deleted. Answers will no longer use it.`}
				cancelText="Cancel"
				confirmText="Remove"
				error={deleteItem.error?.message}
			/>
		</>
	);
}

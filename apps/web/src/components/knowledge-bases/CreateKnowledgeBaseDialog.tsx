"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@repo/ui/components/dialog";
import { type ReactElement, useState } from "react";
import { CreateKnowledgeBaseForm } from "./CreateKnowledgeBaseForm";

export function CreateKnowledgeBaseDialog({
	trigger,
}: {
	trigger: ReactElement;
}) {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={trigger} />
			<DialogContent>
				<DialogHeader>
					<DialogTitle>New knowledge base</DialogTitle>
					<DialogDescription>
						A collection of notes, links and files you can chat with.
					</DialogDescription>
				</DialogHeader>
				<CreateKnowledgeBaseForm onCreated={() => setOpen(false)} />
			</DialogContent>
		</Dialog>
	);
}

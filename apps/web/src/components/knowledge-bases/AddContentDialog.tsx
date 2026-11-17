"use client";

import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@repo/ui/components/dialog";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@repo/ui/components/tabs";
import { Plus } from "lucide-react";
import { useState } from "react";
import { SOURCE_TYPE_ICONS } from "@/constants";
import { FileIngestForm } from "./FileIngestForm";
import { NoteIngestForm } from "./NoteIngestForm";
import { UrlIngestForm } from "./UrlIngestForm";

export function AddContentDialog({
	knowledgeBaseId,
}: {
	knowledgeBaseId: string;
}) {
	const [open, setOpen] = useState(false);
	const close = () => setOpen(false);
	const NoteIcon = SOURCE_TYPE_ICONS.note;
	const LinkIcon = SOURCE_TYPE_ICONS.url;
	const FileIcon = SOURCE_TYPE_ICONS.file;

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={
					<Button size="sm" data-tour="add-content">
						<Plus />
						Add content
					</Button>
				}
			/>
			<DialogContent className="sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>Add content</DialogTitle>
					<DialogDescription>
						It's split into chunks and indexed in the background.
					</DialogDescription>
				</DialogHeader>
				<Tabs defaultValue="text" className="gap-4">
					<TabsList className="w-full">
						<TabsTrigger value="text">
							<NoteIcon />
							Text
						</TabsTrigger>
						<TabsTrigger value="link">
							<LinkIcon />
							Link
						</TabsTrigger>
						<TabsTrigger value="file">
							<FileIcon />
							File
						</TabsTrigger>
					</TabsList>
					<TabsContent value="text">
						<NoteIngestForm knowledgeBaseId={knowledgeBaseId} onAdded={close} />
					</TabsContent>
					<TabsContent value="link">
						<UrlIngestForm knowledgeBaseId={knowledgeBaseId} onAdded={close} />
					</TabsContent>
					<TabsContent value="file">
						<FileIngestForm knowledgeBaseId={knowledgeBaseId} onAdded={close} />
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}

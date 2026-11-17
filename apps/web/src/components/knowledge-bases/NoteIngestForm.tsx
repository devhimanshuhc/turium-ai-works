"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Field, FieldError, FieldLabel } from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import LoadingButton from "@repo/ui/general/LoadingButton";
import RequiredStar from "@repo/ui/general/RequiredStar";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useIngestItem } from "@/queries";
import { type NoteIngestInput, noteIngestSchema } from "@/validations";

export function NoteIngestForm({
	knowledgeBaseId,
	onAdded,
}: {
	knowledgeBaseId: string;
	onAdded?: () => void;
}) {
	const ingestItem = useIngestItem();
	const form = useForm<NoteIngestInput>({
		resolver: zodResolver(noteIngestSchema),
		defaultValues: { title: "", content: "" },
	});

	const onSubmit = form.handleSubmit(({ title, content }) =>
		ingestItem.mutate(
			{
				source_type: "note",
				knowledge_base_id: knowledgeBaseId,
				title: title || undefined,
				content,
			},
			{
				onSuccess: () => {
					toast.success("Text added. Processing it now.");
					form.reset();
					onAdded?.();
				},
				onError: (error) => toast.error(error.message),
			},
		),
	);

	return (
		<form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
			<Controller
				name="title"
				control={form.control}
				render={({ field, fieldState }) => (
					<Field data-invalid={fieldState.invalid}>
						<FieldLabel htmlFor="note-title">Title</FieldLabel>
						<Input
							{...field}
							id="note-title"
							placeholder="Optional"
							aria-invalid={fieldState.invalid}
						/>
						{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
					</Field>
				)}
			/>
			<Controller
				name="content"
				control={form.control}
				render={({ field, fieldState }) => (
					<Field data-invalid={fieldState.invalid}>
						<FieldLabel htmlFor="note-content">
							Text <RequiredStar />
						</FieldLabel>
						<Textarea
							{...field}
							id="note-content"
							rows={6}
							placeholder="Paste or write anything you want to ask about later"
							aria-invalid={fieldState.invalid}
						/>
						{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
					</Field>
				)}
			/>
			<LoadingButton
				type="submit"
				className="self-end"
				isLoading={ingestItem.isPending}
			>
				Add text
			</LoadingButton>
		</form>
	);
}

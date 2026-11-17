"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import LoadingButton from "@repo/ui/general/LoadingButton";
import RequiredStar from "@repo/ui/general/RequiredStar";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { ACCEPTED_FILE_EXTENSIONS } from "@/constants";
import { useIngestFile } from "@/queries";
import { type FileIngestInput, fileIngestSchema } from "@/validations";

export function FileIngestForm({
	knowledgeBaseId,
	onAdded,
}: {
	knowledgeBaseId: string;
	onAdded?: () => void;
}) {
	const ingestFile = useIngestFile();
	const [inputKey, setInputKey] = useState(0);
	const form = useForm<FileIngestInput>({
		resolver: zodResolver(fileIngestSchema),
	});

	const onSubmit = form.handleSubmit(({ file }) =>
		ingestFile.mutate(
			{ knowledge_base_id: knowledgeBaseId, file },
			{
				onSuccess: () => {
					toast.success(`${file.name} uploaded. Processing it now.`);
					form.reset();
					onAdded?.();
					setInputKey((key) => key + 1);
				},
				onError: (error) => toast.error(error.message),
			},
		),
	);

	return (
		<form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
			<Controller
				name="file"
				control={form.control}
				render={({ field, fieldState }) => (
					<Field data-invalid={fieldState.invalid}>
						<FieldLabel htmlFor="ingest-file">
							File <RequiredStar />
						</FieldLabel>
						<Input
							key={inputKey}
							id="ingest-file"
							type="file"
							accept={ACCEPTED_FILE_EXTENSIONS.join(",")}
							name={field.name}
							onBlur={field.onBlur}
							onChange={(event) => field.onChange(event.target.files?.[0])}
							aria-invalid={fieldState.invalid}
						/>
						<FieldDescription>
							PDF, DOCX, TXT or Markdown, up to 10 MB.
						</FieldDescription>
						{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
					</Field>
				)}
			/>
			<LoadingButton
				type="submit"
				className="self-end"
				isLoading={ingestFile.isPending}
			>
				Upload file
			</LoadingButton>
		</form>
	);
}

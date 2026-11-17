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
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useIngestItem } from "@/queries";
import { type UrlIngestInput, urlIngestSchema } from "@/validations";

export function UrlIngestForm({
	knowledgeBaseId,
	onAdded,
}: {
	knowledgeBaseId: string;
	onAdded?: () => void;
}) {
	const ingestItem = useIngestItem();
	const form = useForm<UrlIngestInput>({
		resolver: zodResolver(urlIngestSchema),
		defaultValues: { url: "" },
	});

	const onSubmit = form.handleSubmit(({ url }) =>
		ingestItem.mutate(
			{ source_type: "url", knowledge_base_id: knowledgeBaseId, url },
			{
				onSuccess: () => {
					toast.success("Link added. Fetching the page now.");
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
				name="url"
				control={form.control}
				render={({ field, fieldState }) => (
					<Field data-invalid={fieldState.invalid}>
						<FieldLabel htmlFor="ingest-url">
							URL <RequiredStar />
						</FieldLabel>
						<Input
							{...field}
							id="ingest-url"
							inputMode="url"
							placeholder="https://example.com/article"
							aria-invalid={fieldState.invalid}
						/>
						<FieldDescription>
							We'll fetch the page and keep its main text.
						</FieldDescription>
						{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
					</Field>
				)}
			/>
			<LoadingButton
				type="submit"
				className="self-end"
				isLoading={ingestItem.isPending}
			>
				Add link
			</LoadingButton>
		</form>
	);
}
